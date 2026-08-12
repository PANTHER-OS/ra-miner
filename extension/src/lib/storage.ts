// Camada fina sobre chrome.storage.local. Tudo fica só no navegador do
// usuário — nenhuma dessas chaves é sincronizada pra fora (ver decisão de
// armazenamento 100% local).
import type { Finding, Settings } from "../types";
import { DEFAULT_SETTINGS } from "../types";

const KEYS = {
  settings: "gm:settings",
  findings: "gm:findings",
  seenIds: "gm:seenIds",
  templateStats: "gm:templateStats",
  knownChats: "gm:knownChats",
} as const;

const MAX_FINDINGS = 500;
const MAX_SEEN_IDS = 8000;

async function get<T>(key: string, fallback: T): Promise<T> {
  const res = await chrome.storage.local.get(key);
  return (res[key] as T | undefined) ?? fallback;
}

async function set(key: string, value: unknown): Promise<void> {
  await chrome.storage.local.set({ [key]: value });
}

// ---- Settings ----

export async function getSettings(): Promise<Settings> {
  const stored = await get<Partial<Settings>>(KEYS.settings, {});
  return { ...DEFAULT_SETTINGS, ...stored };
}

export async function saveSettings(settings: Settings): Promise<void> {
  await set(KEYS.settings, settings);
}

// ---- Findings ----

export async function getFindings(): Promise<Finding[]> {
  return get<Finding[]>(KEYS.findings, []);
}

export async function addFinding(finding: Finding): Promise<Finding[]> {
  const findings = await getFindings();
  findings.unshift(finding);
  const trimmed = findings.slice(0, MAX_FINDINGS);
  await set(KEYS.findings, trimmed);
  return trimmed;
}

export async function updateFinding(id: string, patch: Partial<Finding>): Promise<void> {
  const findings = await getFindings();
  const idx = findings.findIndex((f) => f.id === id);
  const current = findings[idx];
  if (!current) return;
  findings[idx] = { ...current, ...patch };
  await set(KEYS.findings, findings);
}

export async function unreadCount(): Promise<number> {
  const findings = await getFindings();
  return findings.filter((f) => !f.read && !f.dismissed).length;
}

// ---- Dedupe (mensagens já processadas) ----

export async function hasSeen(messageId: string): Promise<boolean> {
  const ids = await get<string[]>(KEYS.seenIds, []);
  return ids.includes(messageId);
}

export async function markSeen(messageId: string): Promise<void> {
  const ids = await get<string[]>(KEYS.seenIds, []);
  ids.push(messageId);
  const trimmed = ids.length > MAX_SEEN_IDS ? ids.slice(ids.length - MAX_SEEN_IDS) : ids;
  await set(KEYS.seenIds, trimmed);
}

// ---- Estatística de template por grupo (aprendizado de recorrência) ----

export interface TemplateStat {
  count: number;
  firstSeen: number;
  lastSeen: number;
  /** dias da semana (0-6) em que esse template já apareceu */
  weekdaysSeen: number[];
}

export type TemplateStats = Record<string, TemplateStat>;

export async function getTemplateStats(): Promise<TemplateStats> {
  return get<TemplateStats>(KEYS.templateStats, {});
}

export async function recordTemplate(chatId: string, templateHash: string, when: number): Promise<TemplateStat> {
  const all = await getTemplateStats();
  const key = `${chatId}::${templateHash}`;
  const existing = all[key];
  const weekday = new Date(when).getDay();
  const stat: TemplateStat = existing
    ? {
        count: existing.count + 1,
        firstSeen: existing.firstSeen,
        lastSeen: when,
        weekdaysSeen: existing.weekdaysSeen.includes(weekday) ? existing.weekdaysSeen : [...existing.weekdaysSeen, weekday],
      }
    : { count: 1, firstSeen: when, lastSeen: when, weekdaysSeen: [weekday] };
  all[key] = stat;

  // Poda leve: não deixa crescer sem limite (mantém só os 2000 templates mais recentes).
  const entries = Object.entries(all);
  if (entries.length > 2000) {
    entries.sort((a, b) => b[1].lastSeen - a[1].lastSeen);
    await set(KEYS.templateStats, Object.fromEntries(entries.slice(0, 2000)));
  } else {
    await set(KEYS.templateStats, all);
  }
  return stat;
}

// ---- Chats conhecidos (pra popular a watchlist nas Options) ----

export interface KnownChat {
  chatId: string;
  name: string;
  isGroup: boolean;
  lastSeen: number;
}

export async function getKnownChats(): Promise<KnownChat[]> {
  return get<KnownChat[]>(KEYS.knownChats, []);
}

export async function upsertKnownChats(chats: { chatId: string; name: string; isGroup: boolean }[]): Promise<void> {
  const known = await getKnownChats();
  const byId = new Map(known.map((c) => [c.chatId, c]));
  const now = Date.now();
  for (const c of chats) {
    byId.set(c.chatId, { ...c, lastSeen: now });
  }
  await set(KEYS.knownChats, Array.from(byId.values()));
}

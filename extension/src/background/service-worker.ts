// Service worker (background). É aqui que a decisão final acontece: recebe
// mensagens cruas do content script, roda o motor de regras, decide quando
// vale a pena perguntar pra IA, grava achados e cuida do badge/notificação.
import type { ClassifyCandidate, Finding, RawMessage, RuntimeMessage, Settings, WatchedGroup } from "../types";
import { scoreMessage } from "../lib/rules-engine";
import { classifyBatch } from "../lib/classifier-client";
import { hashTemplate, normalizeTemplate } from "../lib/template";
import {
  addFinding,
  getFindings,
  getSettings,
  getTemplateStats,
  hasSeen,
  markSeen,
  recordTemplate,
  saveSettings,
  getKnownChats,
  unreadCount,
  updateFinding,
  upsertKnownChats,
} from "../lib/storage";

let bridgeStatus: "store" | "dom" | "unavailable" | "pending" = "pending";

// ---- Fila de candidatos ambíguos pra revisão em lote pela IA ----

interface PendingCandidate {
  candidate: ClassifyCandidate;
  message: RawMessage;
}

let pendingQueue: PendingCandidate[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
const BATCH_MAX = 10;
const BATCH_DEBOUNCE_MS = 2500;

function queueForAi(candidate: ClassifyCandidate, message: RawMessage) {
  pendingQueue.push({ candidate, message });
  if (pendingQueue.length >= BATCH_MAX) {
    flushQueue();
    return;
  }
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = setTimeout(flushQueue, BATCH_DEBOUNCE_MS);
}

async function flushQueue() {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  if (pendingQueue.length === 0) return;
  const batch = pendingQueue;
  pendingQueue = [];

  const settings = await getSettings();
  const verdicts = await classifyBatch(
    batch.map((b) => b.candidate),
    settings,
  );
  const verdictById = new Map(verdicts.map((v) => [v.id, v]));
  const aiBar = Math.max(40, settings.minConfidenceForNotification - 15);

  for (const { candidate, message } of batch) {
    const verdict = verdictById.get(candidate.id);
    if (!verdict || !verdict.isSpecialEvent || verdict.confidence < aiBar) continue;
    await createFinding(message, {
      score: verdict.confidence,
      category: verdict.category ?? "promocao_especial",
      matchedKeywords: candidate.matchedKeywords,
      confidenceSource: "regras+ia",
      reason: verdict.reason,
    });
  }
}

// ---- Criação de achado + badge + notificação ----

async function createFinding(
  message: RawMessage,
  extra: { score: number; category: Finding["category"]; matchedKeywords: string[]; confidenceSource: Finding["confidenceSource"]; reason?: string; specialDateLabel?: string },
) {
  const finding: Finding = {
    id: `${message.chatId}:${message.id}`,
    chatId: message.chatId,
    chatName: message.chatName,
    messageId: message.id,
    body: message.body,
    timestamp: message.timestamp,
    detectedAt: Date.now(),
    category: extra.category,
    score: Math.round(extra.score),
    confidenceSource: extra.confidenceSource,
    matchedKeywords: extra.matchedKeywords,
    specialDateLabel: extra.specialDateLabel,
    reason: extra.reason,
    read: false,
    dismissed: false,
  };
  await addFinding(finding);
  await refreshBadge();

  const settings = await getSettings();
  if (settings.notificationsEnabled && finding.score >= settings.minConfidenceForNotification) {
    const label = finding.category === "lancamento" ? "🚀 Lançamento" : "💎 Promoção especial";
    chrome.notifications.create(finding.id, {
      type: "basic",
      iconUrl: chrome.runtime.getURL("icons/icon128.png"),
      title: `${label} — ${finding.chatName}`,
      message: finding.body.slice(0, 180),
      priority: 1,
    });
  }
}

async function refreshBadge() {
  const n = await unreadCount();
  chrome.action.setBadgeText({ text: n > 0 ? String(Math.min(n, 99)) : "" });
  chrome.action.setBadgeBackgroundColor({ color: "#0f7a57" });
}

function isWatched(message: RawMessage, watchlist: WatchedGroup[], monitorAll: boolean): boolean {
  if (!message.isGroup) return false;
  if (monitorAll) return true;
  return watchlist.some((w) => w.active && (w.chatId === message.chatId || w.name === message.chatName));
}

async function handleNewMessage(message: RawMessage) {
  if (message.fromMe) return;
  if (await hasSeen(message.id)) return;
  await markSeen(message.id);

  const settings = await getSettings();
  if (!isWatched(message, settings.watchlist, settings.monitorAllGroups)) return;
  if (!message.body || message.body.trim().length < 8) return;

  const templateHash = hashTemplate(normalizeTemplate(message.body));
  const templateStats = await getTemplateStats();
  const existingStat = templateStats[`${message.chatId}::${templateHash}`];
  const result = scoreMessage(message, settings, existingStat);
  // registra a ocorrência do molde depois de pontuar (não deixa a mensagem
  // "aprender sobre si mesma" antes de ser avaliada).
  await recordTemplate(message.chatId, result.templateHash, message.timestamp);

  if (result.decision === "ignorar") return;

  if (result.decision === "aceitar") {
    await createFinding(message, {
      score: result.score,
      category: result.category,
      matchedKeywords: result.matchedKeywords,
      confidenceSource: "regras",
      reason: result.reason,
      specialDateLabel: result.specialDateLabel,
    });
    return;
  }

  // revisar-com-ia
  queueForAi(
    { id: `${message.chatId}:${message.id}`, chatName: message.chatName, body: message.body, ruleScore: result.score, matchedKeywords: result.matchedKeywords },
    message,
  );
}

// ---- Roteamento de mensagens de runtime ----

chrome.runtime.onMessage.addListener((msg: RuntimeMessage, _sender, sendResponse) => {
  (async () => {
    switch (msg.kind) {
      case "wa:new-message":
        await handleNewMessage(msg.message);
        sendResponse({ ok: true });
        break;
      case "wa:chat-list":
        await upsertKnownChats(msg.chats);
        sendResponse({ ok: true });
        break;
      case "wa:bridge-status":
        bridgeStatus = msg.mode;
        sendResponse({ ok: true });
        break;
      case "get-findings": {
        const findings = await getFindings();
        sendResponse({ findings: msg.unreadOnly ? findings.filter((f) => !f.read && !f.dismissed) : findings });
        break;
      }
      case "mark-read":
        await updateFinding(msg.findingId, { read: true });
        await refreshBadge();
        sendResponse({ ok: true });
        break;
      case "dismiss-finding":
        await updateFinding(msg.findingId, { dismissed: true, read: true });
        await refreshBadge();
        sendResponse({ ok: true });
        break;
      case "get-settings":
        sendResponse({ settings: await getSettings() });
        break;
      case "save-settings":
        await saveSettings(msg.settings);
        sendResponse({ ok: true });
        break;
      case "get-bridge-status":
        sendResponse({ mode: bridgeStatus });
        break;
      case "get-known-chats":
        sendResponse({ chats: await getKnownChats() });
        break;
      default:
        sendResponse({ ok: false, error: "unknown-kind" });
    }
  })();
  return true; // resposta assíncrona
});

chrome.runtime.onInstalled.addListener(() => {
  refreshBadge();
});

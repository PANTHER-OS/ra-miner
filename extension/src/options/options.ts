import type { KnownChat } from "../lib/storage";
import type { RuntimeMessage, Settings, SpecialDate, WatchedGroup } from "../types";

function send<T = any>(msg: RuntimeMessage): Promise<T> {
  return chrome.runtime.sendMessage(msg);
}

let settings: Settings;
let knownChats: KnownChat[] = [];
let dirty = false;

const el = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;

function markDirty() {
  dirty = true;
  el("save-bar").hidden = false;
}

// ---- Status badge ----

async function refreshStatusBadge() {
  const { mode } = await send<{ mode: string }>({ kind: "get-bridge-status" });
  const badge = el("status-badge");
  const map: Record<string, { text: string; cls: string }> = {
    store: { text: "🟢 tempo real ativo", cls: "badge--emerald" },
    dom: { text: "🟡 modo chat aberto", cls: "badge--gold" },
    unavailable: { text: "🔴 sem conexão", cls: "badge--red" },
    pending: { text: "conectando…", cls: "badge--muted" },
  };
  const info = map[mode] ?? { text: "conectando…", cls: "badge--muted" };
  badge.textContent = info.text;
  badge.className = `badge ${info.cls}`;
}

// ---- Watchlist ----

function isWatched(name: string): WatchedGroup | undefined {
  return settings.watchlist.find((w) => w.name === name && w.active);
}

function toggleWatch(name: string, chatId: string) {
  const existing = settings.watchlist.find((w) => w.name === name);
  if (existing) {
    existing.active = !existing.active;
  } else {
    settings.watchlist.push({ chatId, name, addedAt: Date.now(), active: true });
  }
  markDirty();
  renderChatList();
}

function renderChatList() {
  const search = el<HTMLInputElement>("chat-search").value.trim().toLowerCase();
  const list = el<HTMLUListElement>("chat-list");
  const merged = new Map<string, { chatId: string; name: string }>();
  for (const c of knownChats) merged.set(c.name, { chatId: c.chatId, name: c.name });
  for (const w of settings.watchlist) if (!merged.has(w.name)) merged.set(w.name, { chatId: w.chatId, name: w.name });

  const rows = Array.from(merged.values())
    .filter((c) => !search || c.name.toLowerCase().includes(search))
    .sort((a, b) => a.name.localeCompare(b.name));

  list.innerHTML = rows
    .map((c) => {
      const checked = isWatched(c.name) ? "checked" : "";
      const safeName = c.name.replace(/"/g, "&quot;");
      return `<li class="chat-row">
        <span class="chat-row__name">${escapeHtml(c.name)}</span>
        <label class="switch-row" style="padding:0;border:none;display:inline-flex;gap:8px">
          <input type="checkbox" data-name="${safeName}" data-chatid="${c.chatId}" class="chat-toggle" ${checked} />
          <span class="switch"></span>
        </label>
      </li>`;
    })
    .join("");
}

function escapeHtml(s: string): string {
  const div = document.createElement("div");
  div.textContent = s;
  return div.innerHTML;
}

el("chat-list").addEventListener("change", (e) => {
  const input = e.target as HTMLInputElement;
  if (!input.classList.contains("chat-toggle")) return;
  toggleWatch(input.dataset.name!, input.dataset.chatid!);
});

el("chat-search").addEventListener("input", renderChatList);

el("add-all").addEventListener("click", () => {
  for (const c of knownChats) {
    const existing = settings.watchlist.find((w) => w.name === c.name);
    if (existing) existing.active = true;
    else settings.watchlist.push({ chatId: c.chatId, name: c.name, addedAt: Date.now(), active: true });
  }
  markDirty();
  renderChatList();
});

el("clear-all").addEventListener("click", () => {
  if (settings.watchlist.length === 0) return;
  if (!confirm("Remover todos os grupos da watchlist?")) return;
  settings.watchlist = [];
  markDirty();
  renderChatList();
});

el<HTMLInputElement>("monitor-all").addEventListener("change", (e) => {
  settings.monitorAllGroups = (e.target as HTMLInputElement).checked;
  markDirty();
});

el("manual-add-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const input = el<HTMLInputElement>("manual-add-input");
  const name = input.value.trim();
  if (!name) return;
  if (!settings.watchlist.find((w) => w.name === name)) {
    settings.watchlist.push({ chatId: `manual:${name}`, name, addedAt: Date.now(), active: true });
  }
  input.value = "";
  markDirty();
  renderChatList();
});

// ---- Motor de detecção ----

function bindDetectionEngine() {
  el<HTMLInputElement>("ai-enabled").checked = settings.aiEnabled;
  el<HTMLInputElement>("recurring-suppression").checked = settings.recurringSuppressionEnabled;
  el<HTMLInputElement>("sensitivity").value = String(settings.sensitivity);
  el("sensitivity-value").textContent = String(settings.sensitivity);

  el<HTMLInputElement>("ai-enabled").addEventListener("change", (e) => {
    settings.aiEnabled = (e.target as HTMLInputElement).checked;
    markDirty();
  });
  el<HTMLInputElement>("recurring-suppression").addEventListener("change", (e) => {
    settings.recurringSuppressionEnabled = (e.target as HTMLInputElement).checked;
    markDirty();
  });
  el<HTMLInputElement>("sensitivity").addEventListener("input", (e) => {
    const v = Number((e.target as HTMLInputElement).value);
    settings.sensitivity = v;
    el("sensitivity-value").textContent = String(v);
    markDirty();
  });
}

// ---- Palavras-chave ----

function renderChips(target: "include" | "exclude") {
  const list = target === "include" ? settings.includeKeywords : settings.excludeKeywords;
  const container = el(`${target}-chips`);
  container.innerHTML = list
    .map((k, i) => `<span class="chip">${escapeHtml(k)}<button data-target="${target}" data-index="${i}">&times;</button></span>`)
    .join("");
}

document.querySelectorAll(".chips").forEach((container) => {
  container.addEventListener("click", (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>("button");
    if (!btn) return;
    const target = btn.dataset.target as "include" | "exclude";
    const index = Number(btn.dataset.index);
    const list = target === "include" ? settings.includeKeywords : settings.excludeKeywords;
    list.splice(index, 1);
    markDirty();
    renderChips(target);
  });
});

document.querySelectorAll<HTMLFormElement>(".chip-add").forEach((form) => {
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const target = form.dataset.target as "include" | "exclude";
    const input = form.querySelector("input") as HTMLInputElement;
    const value = input.value.trim();
    if (!value) return;
    const list = target === "include" ? settings.includeKeywords : settings.excludeKeywords;
    if (!list.some((k) => k.toLowerCase() === value.toLowerCase())) list.push(value);
    input.value = "";
    markDirty();
    renderChips(target);
  });
});

// ---- Datas especiais ----

function renderDateList() {
  const list = el("date-list");
  list.innerHTML = settings.specialDates
    .map(
      (d) => `<li class="date-row">
        <div class="date-row__info">
          <span class="date-row__day">${String(d.day).padStart(2, "0")}/${String(d.month).padStart(2, "0")}</span>
          <span>${escapeHtml(d.label)}</span>
          <span style="color:var(--text-muted)">± ${d.windowDays}d</span>
        </div>
        <button data-id="${d.id}" title="remover">&times;</button>
      </li>`,
    )
    .join("");
}

el("date-list").addEventListener("click", (e) => {
  const btn = (e.target as HTMLElement).closest<HTMLButtonElement>("button[data-id]");
  if (!btn) return;
  settings.specialDates = settings.specialDates.filter((d) => d.id !== btn.dataset.id);
  markDirty();
  renderDateList();
});

el("date-add-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const label = el<HTMLInputElement>("date-label").value.trim();
  const day = Number(el<HTMLInputElement>("date-day").value);
  const month = Number(el<HTMLInputElement>("date-month").value);
  const windowDays = Number(el<HTMLInputElement>("date-window").value);
  if (!label || !day || !month) return;
  const entry: SpecialDate = { id: `custom-${Date.now()}`, label, day, month, windowDays: windowDays || 0 };
  settings.specialDates.push(entry);
  (e.target as HTMLFormElement).reset();
  el<HTMLInputElement>("date-window").value = "2";
  markDirty();
  renderDateList();
});

// ---- Notificações ----

function bindNotifications() {
  el<HTMLInputElement>("notifications-enabled").checked = settings.notificationsEnabled;
  el<HTMLInputElement>("min-confidence").value = String(settings.minConfidenceForNotification);
  el("min-confidence-value").textContent = `${settings.minConfidenceForNotification}%`;

  el<HTMLInputElement>("notifications-enabled").addEventListener("change", (e) => {
    settings.notificationsEnabled = (e.target as HTMLInputElement).checked;
    markDirty();
  });
  el<HTMLInputElement>("min-confidence").addEventListener("input", (e) => {
    const v = Number((e.target as HTMLInputElement).value);
    settings.minConfidenceForNotification = v;
    el("min-confidence-value").textContent = `${v}%`;
    markDirty();
  });
}

// ---- Salvar ----

el("save-btn").addEventListener("click", async () => {
  const btn = el<HTMLButtonElement>("save-btn");
  btn.disabled = true;
  const originalText = btn.textContent;
  await send({ kind: "save-settings", settings });
  dirty = false;
  btn.textContent = "Salvo ✓";
  setTimeout(() => {
    el("save-bar").hidden = true;
    btn.textContent = originalText;
    btn.disabled = false;
  }, 900);
});

window.addEventListener("beforeunload", (e) => {
  if (dirty) e.preventDefault();
});

// ---- Boot ----

async function init() {
  const [{ settings: loadedSettings }, { chats }] = await Promise.all([
    send<{ settings: Settings }>({ kind: "get-settings" }),
    send<{ chats: KnownChat[] }>({ kind: "get-known-chats" }),
  ]);
  settings = loadedSettings;
  knownChats = chats;

  el<HTMLInputElement>("monitor-all").checked = settings.monitorAllGroups;
  bindDetectionEngine();
  bindNotifications();
  renderChatList();
  renderChips("include");
  renderChips("exclude");
  renderDateList();
  await refreshStatusBadge();

  setInterval(async () => {
    const { chats: fresh } = await send<{ chats: KnownChat[] }>({ kind: "get-known-chats" });
    knownChats = fresh;
    renderChatList();
    await refreshStatusBadge();
  }, 5000);
}

init();

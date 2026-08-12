// Roda no "isolated world" de web.whatsapp.com — tem acesso às APIs da
// extensão (chrome.runtime) mas não ao JS interno da página. Faz três
// coisas: (1) repassa pro background o que a wa-bridge.ts (MAIN world)
// conseguir capturar via Store interna; (2) mantém uma varredura leve do
// painel lateral pra listar os chats (alimenta o seletor de watchlist nas
// Options); (3) se a Store não for encontrada, cai pro modo DOM — só
// enxerga o grupo aberto na tela, mas nunca depende de estrutura interna
// não-documentada.
import type { RawMessage, RuntimeMessage } from "../types";

let bridgeMode: "store" | "dom" | "unavailable" | "pending" = "pending";
const processedDomIds = new Set<string>();

function send(msg: RuntimeMessage) {
  try {
    chrome.runtime.sendMessage(msg);
  } catch {
    // contexto da extensão pode ter sido invalidado (reload da extensão) — ignora.
  }
}

// ---- 1) Ponte com o MAIN world (wa-bridge.ts) ----

window.addEventListener("message", (event) => {
  if (event.source !== window) return;
  const data = event.data;
  if (!data || typeof data !== "object" || !data.__garimpo) return;

  if (data.type === "new-message" && data.message) {
    bridgeMode = "store";
    send({ kind: "wa:new-message", message: data.message as RawMessage });
  } else if (data.type === "chat-list" && Array.isArray(data.chats)) {
    send({ kind: "wa:chat-list", chats: data.chats });
  } else if (data.type === "bridge-status") {
    bridgeMode = data.mode;
    send({ kind: "wa:bridge-status", mode: data.mode });
    if (data.mode === "unavailable") startDomFallback();
  }
});

// Se em 12s a wa-bridge não confirmar que achou a Store, assume modo DOM.
setTimeout(() => {
  if (bridgeMode === "pending") {
    bridgeMode = "dom";
    send({ kind: "wa:bridge-status", mode: "dom" });
    startDomFallback();
  }
}, 12_000);

// ---- 2) Varredura leve da lista de chats (funciona nos dois modos) ----

function scanChatListSidebar() {
  const rows = document.querySelectorAll<HTMLElement>('[data-testid="cell-frame-container"], div[role="listitem"]');
  if (rows.length === 0) return;
  const chats: { chatId: string; name: string; isGroup: boolean }[] = [];
  rows.forEach((row) => {
    const titleEl = row.querySelector<HTMLElement>('span[title]');
    const name = titleEl?.getAttribute("title")?.trim();
    if (!name) return;
    chats.push({ chatId: `dom:${name}`, name, isGroup: true });
  });
  if (chats.length > 0) send({ kind: "wa:chat-list", chats });
}

setInterval(scanChatListSidebar, 4000);
setTimeout(scanChatListSidebar, 2500);

// ---- 3) Fallback DOM: só o chat aberto na tela ----

const PRE_PLAIN_TEXT_RE = /^\[(\d{2}):(\d{2}), (\d{2})\/(\d{2})\/(\d{4})\]\s*(.*?):\s*$/;

function getOpenChatMeta(): { name: string; isGroup: boolean } {
  const header = document.querySelector<HTMLElement>("#main header");
  const titleEl = header?.querySelector<HTMLElement>("span[title]");
  const name = titleEl?.getAttribute("title")?.trim() || titleEl?.innerText?.trim() || "Chat sem nome";
  const subtitle = header?.querySelector<HTMLElement>('span[title] ~ span, div > span')?.innerText ?? "";
  const isGroup = !/online|visto por último|visto pela última vez/i.test(subtitle);
  return { name, isGroup };
}

function extractDomMessage(row: HTMLElement): RawMessage | null {
  const dataId = row.getAttribute("data-id");
  if (!dataId || processedDomIds.has(dataId)) return null;
  processedDomIds.add(dataId);

  const textEl = row.querySelector<HTMLElement>(".selectable-text");
  const body = (textEl?.innerText ?? row.innerText ?? "").trim();
  if (!body) return null;

  const prePlain = row.querySelector<HTMLElement>("[data-pre-plain-text]")?.getAttribute("data-pre-plain-text") ?? "";
  const match = PRE_PLAIN_TEXT_RE.exec(prePlain);
  let timestamp = Date.now();
  let authorName = "desconhecido";
  if (match) {
    const [, hh, mm, dd, mo, yyyy, sender] = match;
    timestamp = new Date(Number(yyyy), Number(mo) - 1, Number(dd), Number(hh), Number(mm)).getTime();
    authorName = sender || authorName;
  }

  const { name: chatName, isGroup } = getOpenChatMeta();
  const fromMe = row.classList.contains("message-out") || Boolean(row.closest(".message-out"));

  return {
    id: `dom:${dataId}`,
    chatId: `dom:${chatName}`,
    chatName,
    isGroup,
    authorName,
    body,
    timestamp,
    fromMe,
    type: "chat",
    source: "dom",
  };
}

let domObserver: MutationObserver | null = null;

function startDomFallback() {
  if (domObserver) return;
  const target = document.querySelector("#main") ?? document.body;
  domObserver = new MutationObserver((mutations) => {
    for (const m of mutations) {
      m.addedNodes.forEach((node) => {
        if (!(node instanceof HTMLElement)) return;
        const rows = node.matches("[data-id]") ? [node] : Array.from(node.querySelectorAll<HTMLElement>("[data-id]"));
        for (const row of rows) {
          const parsed = extractDomMessage(row);
          if (parsed && !parsed.fromMe) send({ kind: "wa:new-message", message: parsed });
        }
      });
    }
  });
  domObserver.observe(target, { childList: true, subtree: true });
}

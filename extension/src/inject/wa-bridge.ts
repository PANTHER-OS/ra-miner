// Roda no "MAIN world" da página web.whatsapp.com (tem acesso ao JS interno
// do WhatsApp Web, mas NÃO tem acesso às APIs da extensão — por isso troca
// mensagens com o content-script.ts via window.postMessage).
//
// ⚠️ Isso depende de estrutura interna e não-documentada do WhatsApp Web
// (a mesma técnica usada por projetos abertos como WPPConnect/WA-JS e
// whatsapp-web.js: localizar os módulos internos do webpack e escutar os
// eventos da "Store" de mensagens). O WhatsApp pode mudar isso a qualquer
// atualização deles — quando a busca falha, a extensão cai automaticamente
// pro modo DOM (só o chat aberto na tela), que é bem mais estável mas só
// enxerga um grupo por vez. Ver content-script.ts pro modo DOM.
export {};

const BRIDGE_TAG = "garimpo-wa-bridge";

function post(payload: Record<string, unknown>) {
  window.postMessage({ __garimpo: true, ...payload }, "*");
}

function getWebpackRequire(): any {
  const globalChunkNames = Object.keys(window).filter((k) => /^webpackChunk/.test(k));
  for (const name of globalChunkNames) {
    try {
      const chunkArray = (window as any)[name];
      if (!Array.isArray(chunkArray)) continue;
      let webpackRequire: any;
      chunkArray.push([[Symbol(BRIDGE_TAG)], {}, (r: any) => (webpackRequire = r)]);
      if (webpackRequire) return webpackRequire;
    } catch {
      // tenta o próximo nome de global
    }
  }
  return null;
}

function allModuleExports(webpackRequire: any): any[] {
  const cache = webpackRequire?.c;
  if (!cache) return [];
  const out: any[] = [];
  for (const id of Object.keys(cache)) {
    const mod = cache[id]?.exports;
    if (mod) out.push(mod);
  }
  return out;
}

function looksLikeCollection(obj: any): boolean {
  return obj && typeof obj.on === "function" && typeof obj.off === "function" && (Array.isArray(obj._models) || typeof obj.getModelsArray === "function");
}

function findStores(webpackRequire: any): { msgStore: any; chatStore: any } | null {
  const exportsList = allModuleExports(webpackRequire);
  let msgStore: any = null;
  let chatStore: any = null;

  for (const mod of exportsList) {
    for (const key of Object.keys(mod ?? {})) {
      let val: any;
      try {
        val = mod[key];
      } catch {
        continue;
      }
      if (!looksLikeCollection(val)) continue;
      const sample = typeof val.getModelsArray === "function" ? val.getModelsArray()[0] : val._models?.[0];
      if (!sample) continue;
      if (!msgStore && ("body" in sample || "type" in sample) && "id" in sample) {
        msgStore = val;
      }
      if (!chatStore && ("isGroup" in sample || "formattedTitle" in sample || "kind" in sample)) {
        chatStore = val;
      }
    }
    if (msgStore && chatStore) break;
  }

  return msgStore ? { msgStore, chatStore } : null;
}

function extractChatMeta(chat: any): { chatId: string; name: string; isGroup: boolean } {
  const chatId = chat?.id?._serialized ?? String(chat?.id ?? "");
  const isGroup = Boolean(chat?.isGroup ?? chatId.endsWith("@g.us"));
  const name = chat?.formattedTitle ?? chat?.name ?? chat?.contact?.formattedName ?? chatId;
  return { chatId, name, isGroup };
}

function extractMessage(msg: any): Record<string, unknown> | null {
  try {
    const chatId = msg?.id?.remote?._serialized ?? msg?.chatId?._serialized ?? msg?.from?._serialized;
    if (!chatId) return null;
    const chat = msg.getChat ? undefined : undefined; // getChat costuma ser async; usamos metadados síncronos disponíveis no próprio msg quando dá.
    const isGroup = Boolean(msg?.isGroupMsg ?? String(chatId).endsWith("@g.us"));
    return {
      id: msg?.id?._serialized ?? `${chatId}-${msg?.t ?? Date.now()}`,
      chatId,
      chatName: msg?.chat?.formattedTitle ?? msg?.chat?.name ?? String(chatId),
      isGroup,
      authorName: msg?.senderObj?.formattedName ?? msg?.notifyName ?? msg?.from?._serialized ?? "desconhecido",
      body: msg?.body ?? msg?.caption ?? "",
      timestamp: msg?.t ? msg.t * 1000 : Date.now(),
      fromMe: Boolean(msg?.id?.fromMe ?? msg?.fromMe),
      type: msg?.type === "chat" ? "chat" : msg?.type === "image" ? "image" : msg?.type === "video" ? "video" : msg?.type === "document" ? "document" : "other",
      source: "store",
    };
  } catch {
    return null;
  }
}

function tryAttach(): boolean {
  const webpackRequire = getWebpackRequire();
  if (!webpackRequire) return false;

  const stores = findStores(webpackRequire);
  if (!stores?.msgStore) return false;

  try {
    stores.msgStore.on("add", (msg: any) => {
      const parsed = extractMessage(msg);
      if (parsed) post({ type: "new-message", message: parsed });
    });

    if (stores.chatStore) {
      const chats = (stores.chatStore.getModelsArray ? stores.chatStore.getModelsArray() : stores.chatStore._models ?? []).map(extractChatMeta);
      post({ type: "chat-list", chats });
    }

    post({ type: "bridge-status", mode: "store" });
    return true;
  } catch {
    return false;
  }
}

// A Store demora um pouco pra existir depois do carregamento da página —
// tenta por ~20s antes de desistir e avisar o content script pra usar o
// modo DOM.
let attempts = 0;
const MAX_ATTEMPTS = 40;
const interval = setInterval(() => {
  attempts++;
  if (tryAttach() || attempts >= MAX_ATTEMPTS) {
    clearInterval(interval);
    if (attempts >= MAX_ATTEMPTS) post({ type: "bridge-status", mode: "unavailable" });
  }
}, 500);

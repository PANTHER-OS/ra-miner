// Roda em facebook.com/ads/library — varre os cards de anúncio já
// renderizados na tela (a mesma página que você navega manualmente,
// pesquisando/rolando como sempre fez) e marca DIRETO NA PÁGINA os que
// batem com os seus critérios: borda, selo e um botão pra entrar no grupo
// quando o link aparecer. Não abre popup, não manda nada pra fora — tudo
// acontece ali, em cima do que você já está vendo.
//
// Âncora de extração: em vez de depender de classes CSS do Facebook (que
// mudam toda hora e não têm nome estável), usa o texto fixo "Identificação
// da biblioteca" que aparece em todo card — isso é rótulo visível pro
// usuário, muito mais estável que a estrutura interna da página.
import type { RawAd, RuntimeMessage } from "../types";
import type { AdVerdict } from "../lib/ads-rules";

const LIBRARY_ID_RE = /Identifica[çc][ãa]o da biblioteca:\s*(\d+)/i;
const WHATSAPP_LINK_SRC = 'https?://(?:api\\.)?(?:wa\\.me|chat\\.whatsapp\\.com|whatsapp\\.com/send)[^\\s"\'<>)]*';
// Regex "g" é stateful (lastIndex) — usamos uma instância nova em cada
// chamada de .test()/.match() pra não ter falso-negativo intermitente.
const isWhatsAppLink = (s: string) => new RegExp(WHATSAPP_LINK_SRC, "i").test(s);
const matchWhatsAppLinks = (s: string) => s.match(new RegExp(WHATSAPP_LINK_SRC, "gi")) ?? [];

const processedIds = new Set<string>();
const cardByAdId = new Map<string, HTMLElement>();
let relevantCount = 0;
let hideIrrelevant = false;

function send(msg: RuntimeMessage): Promise<any> {
  try {
    return chrome.runtime.sendMessage(msg);
  } catch {
    // contexto invalidado (extensão recarregada) — ignora.
    return Promise.resolve(undefined);
  }
}

// ---- Estilo + painel flutuante (injetados uma única vez) ----

function injectStyleOnce() {
  if (document.getElementById("garimpo-style")) return;
  const style = document.createElement("style");
  style.id = "garimpo-style";
  style.textContent = `
    .garimpo-highlight {
      outline: 3px solid #12b981 !important;
      outline-offset: 3px;
      border-radius: 10px;
      box-shadow: 0 0 0 6px rgba(18, 185, 129, 0.12) !important;
      position: relative !important;
    }
    .garimpo-badge {
      position: absolute; top: -14px; left: 12px; z-index: 2147483000;
      background: linear-gradient(135deg, #12b981, #0f7a57); color: #06120d;
      font: 700 11.5px -apple-system, Segoe UI, Roboto, sans-serif;
      padding: 4px 10px; border-radius: 999px; box-shadow: 0 2px 8px rgba(0,0,0,.35);
      white-space: nowrap;
    }
    .garimpo-join-btn {
      display: inline-block; margin-top: 8px; padding: 7px 14px;
      background: #12b981; color: #06120d !important; font: 700 12.5px -apple-system, Segoe UI, Roboto, sans-serif;
      border-radius: 8px; text-decoration: none !important; cursor: pointer;
    }
    .garimpo-join-btn:hover { filter: brightness(1.08); }
    .garimpo-dim { opacity: 0.12 !important; filter: grayscale(1); transition: opacity .15s; }
    #garimpo-panel {
      position: fixed; right: 18px; bottom: 18px; z-index: 2147483000;
      background: #121917; border: 1px solid #223029; color: #eef3f0;
      font: 12.5px -apple-system, Segoe UI, Roboto, sans-serif;
      border-radius: 12px; padding: 10px 14px; box-shadow: 0 8px 24px -8px rgba(0,0,0,.6);
      display: flex; align-items: center; gap: 10px;
    }
    #garimpo-panel strong { color: #12b981; }
    #garimpo-panel label { display: flex; align-items: center; gap: 6px; cursor: pointer; user-select: none; }
  `;
  document.head.appendChild(style);
}

function injectPanelOnce() {
  if (document.getElementById("garimpo-panel")) return;
  const panel = document.createElement("div");
  panel.id = "garimpo-panel";
  panel.innerHTML = `
    💎 <span>Garimpo: <strong id="garimpo-count">0</strong> relevante(s)</span>
    <label><input type="checkbox" id="garimpo-hide-toggle" /> só relevantes</label>
  `;
  document.body.appendChild(panel);
  document.getElementById("garimpo-hide-toggle")!.addEventListener("change", (e) => {
    hideIrrelevant = (e.target as HTMLInputElement).checked;
    applyDimming();
  });
}

function updateCounter() {
  const el = document.getElementById("garimpo-count");
  if (el) el.textContent = String(relevantCount);
}

function applyDimming() {
  for (const [, card] of cardByAdId) {
    const isRelevant = card.classList.contains("garimpo-highlight");
    card.classList.toggle("garimpo-dim", hideIrrelevant && !isRelevant);
  }
}

// ---- Extração ----

function findAdCard(el: HTMLElement): HTMLElement | null {
  let node: HTMLElement | null = el;
  for (let i = 0; i < 8 && node; i++) {
    if (node.querySelector("a, div[role='button']") && (node.innerText?.length ?? 0) > 80) {
      return node;
    }
    node = node.parentElement;
  }
  return el;
}

function extractAdvertiser(card: HTMLElement): string {
  const links = Array.from(card.querySelectorAll<HTMLAnchorElement>("a[href]"));
  const candidate = links.find((a) => {
    const t = a.innerText?.trim();
    return t && t.length > 1 && t.length < 60 && !isWhatsAppLink(a.href);
  });
  return candidate?.innerText?.trim() ?? "Anunciante desconhecido";
}

function highlightCard(card: HTMLElement, verdict: AdVerdict) {
  card.classList.add("garimpo-highlight");
  const label = verdict.category === "lancamento" ? "🚀 Lançamento" : "💎 Promoção especial";
  const badge = document.createElement("div");
  badge.className = "garimpo-badge";
  badge.textContent = `${label} · ${verdict.score}%`;
  card.appendChild(badge);

  if (verdict.groupLink) {
    const btn = document.createElement("a");
    btn.className = "garimpo-join-btn";
    btn.href = verdict.groupLink;
    btn.target = "_blank";
    btn.rel = "noopener noreferrer";
    btn.textContent = "▶ Entrar no grupo";
    card.appendChild(btn);
  }

  relevantCount++;
  updateCounter();
}

async function scanCard(card: HTMLElement) {
  const fullText = card.innerText ?? "";
  const match = LIBRARY_ID_RE.exec(fullText);
  const adLibraryId = match?.[1];
  if (!adLibraryId) return;
  if (processedIds.has(adLibraryId)) return;
  processedIds.add(adLibraryId);
  cardByAdId.set(adLibraryId, card);

  const whatsappLinksFromHrefs = Array.from(card.querySelectorAll<HTMLAnchorElement>("a[href]"))
    .map((a) => a.href)
    .filter((href) => isWhatsAppLink(href));
  const whatsappLinksFromText = matchWhatsAppLinks(fullText);
  const whatsappLinks = Array.from(new Set([...whatsappLinksFromHrefs, ...whatsappLinksFromText]));
  const hasWhatsAppPlatformIcon = Boolean(card.querySelector('img[alt*="WhatsApp" i], svg[aria-label*="WhatsApp" i]'));

  const ad: RawAd = {
    adLibraryId,
    advertiser: extractAdvertiser(card),
    body: fullText.slice(0, 1200),
    whatsappLinks,
    hasWhatsAppPlatformIcon,
    pageUrl: location.href,
  };

  try {
    const verdict = (await send({ kind: "ads:new-ad", ad })) as AdVerdict | undefined;
    if (verdict?.relevant) {
      highlightCard(card, verdict);
      applyDimming();
    }
  } catch {
    // se o background não responder por qualquer motivo, o card
    // simplesmente não é marcado — nunca quebra a navegação normal.
  }
}

function scanVisibleCards() {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => (LIBRARY_ID_RE.test(n.textContent ?? "") ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP),
  });
  const seenCards = new Set<HTMLElement>();
  let node: Node | null;
  // eslint-disable-next-line no-cond-assign
  while ((node = walker.nextNode())) {
    const parent = node.parentElement;
    if (!parent) continue;
    const card = findAdCard(parent);
    if (card && !seenCards.has(card)) {
      seenCards.add(card);
      scanCard(card);
    }
  }
}

injectStyleOnce();
injectPanelOnce();

// A Biblioteca de Anúncios carrega os resultados aos poucos (scroll
// infinito) e o Facebook mexe no DOM o tempo inteiro — por isso as
// varreduras são "debounced" (espera a poeira baixar) em vez de rodar a
// cada mutação, senão sobrecarrega a aba.
let scanTimer: ReturnType<typeof setTimeout> | null = null;
function scheduleScan() {
  if (scanTimer) return;
  scanTimer = setTimeout(() => {
    scanTimer = null;
    scanVisibleCards();
  }, 800);
}

const observer = new MutationObserver(scheduleScan);
observer.observe(document.body, { childList: true, subtree: true });

setTimeout(scanVisibleCards, 1500);
setInterval(scanVisibleCards, 6000);

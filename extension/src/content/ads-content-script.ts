// Roda em facebook.com/ads/library — varre os cards de anúncio já
// renderizados na tela (a mesma página que você navega manualmente,
// pesquisando/rolando como sempre fez) procurando anúncios que divulgam um
// grupo de WhatsApp. Não faz login, não clica em nada sozinho, não sai
// buscando fora do que você já carregou na tela.
//
// Âncora de extração: em vez de depender de classes CSS do Facebook (que
// mudam toda hora e não têm nome estável), usa o texto fixo "Identificação
// da biblioteca" que aparece em todo card — isso é rótulo visível pro
// usuário, muito mais estável que a estrutura interna da página.
import type { RawAd, RuntimeMessage } from "../types";

const LIBRARY_ID_RE = /Identifica[çc][ãa]o da biblioteca:\s*(\d+)/i;
const WHATSAPP_LINK_SRC = 'https?://(?:api\\.)?(?:wa\\.me|chat\\.whatsapp\\.com|whatsapp\\.com/send)[^\\s"\'<>)]*';
// Regex "g" é stateful (lastIndex) — usamos uma instância nova em cada
// chamada de .test()/.match() pra não ter falso-negativo intermitente.
const isWhatsAppLink = (s: string) => new RegExp(WHATSAPP_LINK_SRC, "i").test(s);
const matchWhatsAppLinks = (s: string) => s.match(new RegExp(WHATSAPP_LINK_SRC, "gi")) ?? [];

const processedIds = new Set<string>();

function send(msg: RuntimeMessage) {
  try {
    chrome.runtime.sendMessage(msg);
  } catch {
    // contexto invalidado (extensão recarregada) — ignora.
  }
}

/** Sobe a árvore a partir de um nó de texto até achar o card inteiro do anúncio. */
function findAdCard(el: HTMLElement): HTMLElement | null {
  let node: HTMLElement | null = el;
  for (let i = 0; i < 8 && node; i++) {
    // um card de anúncio real tem bastante texto e pelo menos um botão/link dentro
    if (node.querySelector("a, div[role='button']") && (node.innerText?.length ?? 0) > 80) {
      return node;
    }
    node = node.parentElement;
  }
  return el;
}

function extractAdvertiser(card: HTMLElement): string {
  // O nome do anunciante costuma ser o link/texto em negrito logo acima do
  // corpo do anúncio — heurística: primeiro link com texto curto (<60 chars)
  // dentro do card.
  const links = Array.from(card.querySelectorAll<HTMLAnchorElement>("a[href]"));
  const candidate = links.find((a) => {
    const t = a.innerText?.trim();
    return t && t.length > 1 && t.length < 60 && !isWhatsAppLink(a.href);
  });
  return candidate?.innerText?.trim() ?? "Anunciante desconhecido";
}

function scanCard(card: HTMLElement) {
  const fullText = card.innerText ?? "";
  const match = LIBRARY_ID_RE.exec(fullText);
  const adLibraryId = match?.[1];
  if (!adLibraryId) return;
  if (processedIds.has(adLibraryId)) return;
  processedIds.add(adLibraryId);

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

  send({ kind: "ads:new-ad", ad });
}

function scanVisibleCards() {
  // Âncora todo nó cujo texto contenha o rótulo, sem depender de classe.
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

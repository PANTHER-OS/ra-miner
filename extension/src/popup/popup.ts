import type { Finding, FindingCategory, RuntimeMessage } from "../types";

type Filter = "all" | FindingCategory | "ads";

let findings: Finding[] = [];
let activeFilter: Filter = "all";

const feedEl = document.getElementById("finding-list") as HTMLUListElement;
const emptyEl = document.getElementById("empty-state") as HTMLDivElement;
const statusEl = document.getElementById("bridge-status") as HTMLDivElement;
const footerCountEl = document.getElementById("footer-count") as HTMLSpanElement;

function send<T = any>(msg: RuntimeMessage): Promise<T> {
  return chrome.runtime.sendMessage(msg);
}

function relativeTime(ts: number): string {
  const diffMs = Date.now() - ts;
  const min = Math.round(diffMs / 60_000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `há ${h}h`;
  const d = Math.round(h / 24);
  if (d === 1) return "ontem";
  return `há ${d}d`;
}

function renderStatus(mode: string) {
  const map: Record<string, { text: string; cls: string }> = {
    store: { text: "● tempo real em todos os grupos", cls: "is-live" },
    dom: { text: "● modo chat aberto (limitado)", cls: "is-dom" },
    unavailable: { text: "● conexão indisponível", cls: "is-off" },
    pending: { text: "conectando ao WhatsApp Web…", cls: "" },
  };
  const info = map[mode] ?? { text: "conectando ao WhatsApp Web…", cls: "" };
  statusEl.textContent = info.text;
  statusEl.className = `popup-header__status ${info.cls}`;
}

function categoryBadge(f: Finding): string {
  return f.category === "lancamento"
    ? `<span class="badge badge--gold">🚀 Lançamento</span>`
    : `<span class="badge badge--emerald">💎 Promoção especial</span>`;
}

function sourceBadge(f: Finding): string {
  const label = f.confidenceSource === "regras+ia" ? "IA" : f.confidenceSource === "ia" ? "IA" : "regras";
  return `<span class="badge badge--muted">${f.score}% · ${label}</span>`;
}

function originBadge(f: Finding): string {
  return (f.origin ?? "whatsapp") === "ads" ? `<span class="badge badge--muted">📢 Biblioteca de Anúncios</span>` : "";
}

function adPermalink(f: Finding): string | null {
  if ((f.origin ?? "whatsapp") !== "ads" || !f.adLibraryId) return null;
  return `https://www.facebook.com/ads/library/?id=${encodeURIComponent(f.adLibraryId)}`;
}

function renderFeed() {
  const visible = findings.filter((f) => {
    if (f.dismissed) return false;
    if (activeFilter === "all") return true;
    if (activeFilter === "ads") return (f.origin ?? "whatsapp") === "ads";
    return f.category === activeFilter;
  });
  footerCountEl.textContent = `${findings.filter((f) => !f.dismissed).length} achado(s)`;

  if (visible.length === 0) {
    emptyEl.hidden = false;
    feedEl.hidden = true;
    return;
  }
  emptyEl.hidden = true;
  feedEl.hidden = false;

  feedEl.innerHTML = visible
    .map((f) => {
      const isAd = (f.origin ?? "whatsapp") === "ads";
      const permalink = adPermalink(f);
      const actions = isAd
        ? `${f.groupLink ? `<button class="chip-btn chip-btn--primary" data-action="open-link" data-href="${escapeHtml(f.groupLink)}">entrar no grupo</button>` : ""}${
            permalink ? `<button class="chip-btn" data-action="open-link" data-href="${escapeHtml(permalink)}">ver anúncio</button>` : ""
          }<button class="chip-btn" data-action="dismiss">descartar</button>`
        : `<button class="chip-btn" data-action="open">abrir</button><button class="chip-btn" data-action="dismiss">descartar</button>`;

      return `
    <li class="finding-card ${!f.read ? "is-unread" : ""}" data-id="${f.id}">
      <div class="finding-card__top">
        <span class="finding-card__chat">${escapeHtml(f.chatName)}</span>
        <div class="finding-card__meta">${categoryBadge(f)}${sourceBadge(f)}</div>
      </div>
      ${isAd ? `<div style="margin-bottom:4px">${originBadge(f)}</div>` : ""}
      <p class="finding-card__body">${escapeHtml(f.body)}</p>
      <div class="finding-card__bottom">
        <span class="finding-card__time">${relativeTime(f.timestamp)}${f.specialDateLabel ? ` · ${escapeHtml(f.specialDateLabel)}` : ""}</span>
        <div class="finding-card__actions">${actions}</div>
      </div>
    </li>`;
    })
    .join("");
}

function escapeHtml(s: string): string {
  const div = document.createElement("div");
  div.textContent = s;
  return div.innerHTML;
}

feedEl.addEventListener("click", async (e) => {
  const target = e.target as HTMLElement;
  const action = target.dataset.action;
  const card = target.closest<HTMLElement>(".finding-card");
  if (!card) return;
  const id = card.dataset.id!;

  if (action === "dismiss") {
    await send({ kind: "dismiss-finding", findingId: id });
    findings = findings.filter((f) => f.id !== id);
    renderFeed();
  } else if (action === "open") {
    await send({ kind: "mark-read", findingId: id });
    chrome.tabs.create({ url: "https://web.whatsapp.com/" });
  } else if (action === "open-link") {
    await send({ kind: "mark-read", findingId: id });
    const href = target.dataset.href;
    if (href) chrome.tabs.create({ url: href });
  }
});

document.getElementById("tabs")!.addEventListener("click", (e) => {
  const btn = (e.target as HTMLElement).closest<HTMLButtonElement>(".tab");
  if (!btn) return;
  document.querySelectorAll(".tab").forEach((t) => t.classList.remove("is-active"));
  btn.classList.add("is-active");
  activeFilter = btn.dataset.filter as Filter;
  renderFeed();
});

document.getElementById("open-options")!.addEventListener("click", () => chrome.runtime.openOptionsPage());
document.getElementById("empty-cta")!.addEventListener("click", () => chrome.runtime.openOptionsPage());
document.getElementById("mark-all-read")!.addEventListener("click", async () => {
  await Promise.all(findings.filter((f) => !f.read).map((f) => send({ kind: "mark-read", findingId: f.id })));
  findings = findings.map((f) => ({ ...f, read: true }));
  renderFeed();
});

async function init() {
  const [{ findings: loaded }, { mode }] = await Promise.all([send<{ findings: Finding[] }>({ kind: "get-findings" }), send<{ mode: string }>({ kind: "get-bridge-status" })]);
  findings = loaded;
  renderStatus(mode);
  renderFeed();
}

init();

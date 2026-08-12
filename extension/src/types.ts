// Tipos compartilhados entre bridge, content script, background e as UIs.
// Mantidos num único arquivo de propósito — é um projeto pequeno e isso
// evita import circular entre as pastas.

/** Uma mensagem crua, do jeito que sai da ponte com o WhatsApp Web. */
export interface RawMessage {
  id: string;
  chatId: string;
  chatName: string;
  isGroup: boolean;
  authorName: string;
  body: string;
  /** epoch ms */
  timestamp: number;
  fromMe: boolean;
  type: "chat" | "image" | "video" | "document" | "other";
  /** Como a mensagem foi capturada — importante pra UI explicar limitações. */
  source: "store" | "dom";
}

export interface WatchedGroup {
  chatId: string;
  name: string;
  addedAt: number;
  active: boolean;
}

export type FindingCategory = "lancamento" | "promocao_especial";
export type ConfidenceSource = "regras" | "ia" | "regras+ia";
export type FindingOrigin = "whatsapp" | "ads";

export interface Finding {
  id: string;
  /** grupo/chat de origem (WhatsApp) ou nome do anunciante (Biblioteca de Anúncios) */
  chatId: string;
  chatName: string;
  messageId: string;
  body: string;
  timestamp: number;
  detectedAt: number;
  category: FindingCategory;
  /** 0–100 */
  score: number;
  confidenceSource: ConfidenceSource;
  matchedKeywords: string[];
  specialDateLabel?: string;
  reason?: string;
  read: boolean;
  dismissed: boolean;
  /** de onde veio o achado — grupo de WhatsApp já monitorado, ou anúncio achado na Biblioteca */
  origin: FindingOrigin;
  /** só quando origin === "ads": link direto pro grupo de WhatsApp anunciado, se achado */
  groupLink?: string;
  /** só quando origin === "ads": nome de quem anuncia e o ID da biblioteca de anúncios */
  advertiser?: string;
  adLibraryId?: string;
}

export interface SpecialDate {
  id: string;
  label: string;
  /** 1–12 */
  month: number;
  /** 1–31 */
  day: number;
  /** dias antes/depois da data que também contam como "janela especial" */
  windowDays: number;
}

export interface Settings {
  watchlist: WatchedGroup[];
  monitorAllGroups: boolean;
  includeKeywords: string[];
  excludeKeywords: string[];
  specialDates: SpecialDate[];
  /** 0 (só o óbvio) – 100 (pega tudo que tiver qualquer sinal) */
  sensitivity: number;
  aiEnabled: boolean;
  aiEndpoint: string;
  aiAnonKey: string;
  notificationsEnabled: boolean;
  minConfidenceForNotification: number;
  recurringSuppressionEnabled: boolean;
}

export const DEFAULT_SPECIAL_DATES: SpecialDate[] = [
  { id: "black-friday", label: "Black Friday", month: 11, day: 28, windowDays: 4 },
  { id: "natal", label: "Natal", month: 12, day: 25, windowDays: 3 },
  { id: "ano-novo", label: "Ano Novo", month: 1, day: 1, windowDays: 2 },
  { id: "dia-dos-namorados", label: "Dia dos Namorados", month: 6, day: 12, windowDays: 2 },
  { id: "dia-das-maes", label: "Dia das Mães", month: 5, day: 11, windowDays: 3 },
  { id: "dia-dos-pais", label: "Dia dos Pais", month: 8, day: 10, windowDays: 3 },
  { id: "cyber-monday", label: "Cyber Monday", month: 12, day: 1, windowDays: 1 },
];

export const DEFAULT_INCLUDE_KEYWORDS = [
  "lançamento",
  "lançou",
  "chegou",
  "disponível agora",
  "só hoje",
  "só até hoje",
  "última chance",
  "últimas vagas",
  "esgotando",
  "vagas limitadas",
  "condição especial",
  "preço de lançamento",
  "cupom exclusivo",
  "oferta relâmpago",
  "promoção especial",
  "edição limitada",
  "pré-venda",
  "abriu o carrinho",
  "carrinho aberto",
];

export const DEFAULT_EXCLUDE_KEYWORDS = [
  "toda segunda",
  "toda terça",
  "toda quarta",
  "toda quinta",
  "toda sexta",
  "todo sábado",
  "todo domingo",
  "toda semana",
  "todo mês",
  "todo dia",
  "diariamente",
  "semanalmente",
  "mensalmente",
  "sempre",
  "de segunda a sexta",
  "promoção da semana",
  "clube de assinatura",
];

export const DEFAULT_SETTINGS: Settings = {
  watchlist: [],
  monitorAllGroups: false,
  includeKeywords: DEFAULT_INCLUDE_KEYWORDS,
  excludeKeywords: DEFAULT_EXCLUDE_KEYWORDS,
  specialDates: DEFAULT_SPECIAL_DATES,
  sensitivity: 55,
  aiEnabled: true,
  aiEndpoint: "https://bxlemuyjwvofcshsfoeo.supabase.co/functions/v1/whatsapp-classify",
  aiAnonKey: "sb_publishable_Yvflz4AasrfJUeyhEbWMzw_Sz1t-MbL",
  notificationsEnabled: true,
  minConfidenceForNotification: 65,
  recurringSuppressionEnabled: true,
};

/** Anúncio cru, do jeito que sai da varredura da Biblioteca de Anúncios (Meta). */
export interface RawAd {
  /** "Identificação da biblioteca" — único, estável, usado pra dedupe */
  adLibraryId: string;
  advertiser: string;
  body: string;
  /** links de WhatsApp achados no card/detalhe do anúncio (chat.whatsapp.com, wa.me, api.whatsapp.com/send) */
  whatsappLinks: string[];
  /** o anúncio mostrava o ícone de WhatsApp entre as plataformas veiculadas */
  hasWhatsAppPlatformIcon: boolean;
  pageUrl: string;
}

// ---- Mensagens de runtime (content script <-> background <-> popup/options) ----

export type RuntimeMessage =
  | { kind: "wa:new-message"; message: RawMessage }
  | { kind: "wa:chat-list"; chats: { chatId: string; name: string; isGroup: boolean }[] }
  | { kind: "wa:bridge-status"; mode: "store" | "dom" | "unavailable" }
  | { kind: "ads:new-ad"; ad: RawAd }
  | { kind: "get-findings"; unreadOnly?: boolean }
  | { kind: "mark-read"; findingId: string }
  | { kind: "dismiss-finding"; findingId: string }
  | { kind: "get-settings" }
  | { kind: "save-settings"; settings: Settings }
  | { kind: "get-bridge-status" }
  | { kind: "get-known-chats" };

export interface ClassifyCandidate {
  id: string;
  chatName: string;
  body: string;
  ruleScore: number;
  matchedKeywords: string[];
}

export interface ClassifyVerdict {
  id: string;
  isSpecialEvent: boolean;
  confidence: number;
  category: FindingCategory | null;
  reason: string;
}

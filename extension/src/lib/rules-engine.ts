// Motor de regras: primeira triagem, 100% local e instantânea. Decide três
// coisas pra cada mensagem: (1) ignorar, (2) aceitar direto como achado, ou
// (3) mandar pra IA revisar por estar em zona cinzenta. Isso mantém o uso da
// IA barato (só mensagens ambíguas) e faz a extensão funcionar mesmo com a
// IA desligada.
import type { FindingCategory, RawMessage, Settings } from "../types";
import { matchSpecialDate, mentionsConcreteDate } from "./dates";
import { hashTemplate, isRecurringPattern, normalizeTemplate } from "./template";
import type { TemplateStat } from "./storage";

const LAUNCH_TERMS = [
  "lançamento",
  "lançou",
  "chegou",
  "disponível agora",
  "pré-venda",
  "pre-venda",
  "abriu o carrinho",
  "carrinho aberto",
  "edição limitada",
  "novidade",
];

const URGENCY_EMOJI = ["🚨", "🔥", "⏰", "⚡", "🎉", "🛒", "⌛", "❗"];

export type RulesDecision = "ignorar" | "aceitar" | "revisar-com-ia";

export interface RulesResult {
  score: number;
  decision: RulesDecision;
  category: FindingCategory;
  matchedKeywords: string[];
  specialDateLabel?: string;
  templateHash: string;
  suppressedByRecurrence: boolean;
  reason: string;
}

const IGNORE_BELOW = 20;
const AUTO_ACCEPT_AT = 82;

export function scoreMessage(msg: RawMessage, settings: Settings, existingTemplateStat: TemplateStat | undefined): RulesResult {
  const text = msg.body || "";
  const lower = text.toLowerCase();
  const matchedInclude = settings.includeKeywords.filter((k) => lower.includes(k.toLowerCase()));
  const matchedExclude = settings.excludeKeywords.filter((k) => lower.includes(k.toLowerCase()));

  let score = 0;
  const reasons: string[] = [];

  score += matchedInclude.length * 18;
  if (matchedInclude.length > 0) reasons.push(`${matchedInclude.length} palavra(s)-chave de interesse`);

  const specialDate = matchSpecialDate(msg.timestamp, settings.specialDates);
  if (specialDate) {
    score += 35;
    reasons.push(`dentro da janela de "${specialDate.label}"`);
  }

  if (mentionsConcreteDate(text)) {
    score += 10;
    reasons.push("menciona data/urgência concreta");
  }

  const urgencyEmojiHits = URGENCY_EMOJI.filter((e) => text.includes(e)).length;
  if (urgencyEmojiHits > 0) {
    score += Math.min(urgencyEmojiHits * 6, 18);
    reasons.push("emojis de urgência");
  }

  if (/r\$\s?\d/i.test(text) && /(de\s+r\$|por\s+r\$|%\s?off|desconto)/i.test(lower)) {
    score += 12;
    reasons.push("menção de preço com desconto");
  }

  // Exclusão: mensagens que se auto-descrevem como recorrentes tomam uma
  // penalidade forte — é exatamente o tipo de promoção genérica que o
  // usuário não quer ver.
  if (matchedExclude.length > 0) {
    score -= matchedExclude.length * 30;
    reasons.push(`${matchedExclude.length} termo(s) de recorrência genérica`);
  }

  // Recorrência aprendida: o grupo já mandou uma mensagem com molde muito
  // parecido várias vezes, em dias da semana diferentes -> rotina, não
  // evento especial único.
  const templateHash = hashTemplate(normalizeTemplate(text));
  let suppressedByRecurrence = false;
  if (settings.recurringSuppressionEnabled && existingTemplateStat) {
    if (isRecurringPattern(existingTemplateStat.count, existingTemplateStat.weekdaysSeen)) {
      score -= 45;
      suppressedByRecurrence = true;
      reasons.push("padrão repetido reconhecido como recorrente");
    }
  }

  score = Math.max(0, Math.min(100, score));

  const isLaunch = LAUNCH_TERMS.some((t) => lower.includes(t));
  const category: FindingCategory = isLaunch ? "lancamento" : "promocao_especial";

  let decision: RulesDecision;
  if (score < IGNORE_BELOW || score < settings.sensitivity - 20) {
    decision = "ignorar";
  } else if (score >= AUTO_ACCEPT_AT) {
    decision = "aceitar";
  } else if (score >= settings.sensitivity) {
    decision = settings.aiEnabled ? "revisar-com-ia" : "aceitar";
  } else {
    decision = "ignorar";
  }

  return {
    score,
    decision,
    category,
    matchedKeywords: matchedInclude,
    specialDateLabel: specialDate?.label,
    templateHash,
    suppressedByRecurrence,
    reason: reasons.join("; ") || "sem sinais relevantes",
  };
}

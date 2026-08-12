// Pontuação de anúncios da Biblioteca — reaproveita as mesmas palavras-chave
// de incluir/excluir configuradas pro WhatsApp (o critério de "lançamento"
// vs "promoção especial de um dia" vs "genérica" é o mesmo, muda só a
// origem do texto).
import type { FindingCategory, RawAd, Settings } from "../types";

export type AdDecision = "ignorar" | "aceitar" | "revisar-com-ia";

export interface AdRulesResult {
  score: number;
  decision: AdDecision;
  category: FindingCategory;
  matchedKeywords: string[];
  reason: string;
}

const LAUNCH_TERMS = ["lançamento", "lançou", "chegou", "disponível agora", "pré-venda", "pre-venda", "novidade"];

export function scoreAd(ad: RawAd, settings: Settings): AdRulesResult {
  // Sem sinal de WhatsApp, o anúncio não interessa pra essa funcionalidade
  // (existe outro fluxo pra grupos já monitorados) — descarta cedo.
  if (ad.whatsappLinks.length === 0 && !ad.hasWhatsAppPlatformIcon) {
    return { score: 0, decision: "ignorar", category: "promocao_especial", matchedKeywords: [], reason: "sem link/ícone de WhatsApp" };
  }

  const lower = ad.body.toLowerCase();
  const matchedInclude = settings.includeKeywords.filter((k) => lower.includes(k.toLowerCase()));
  const matchedExclude = settings.excludeKeywords.filter((k) => lower.includes(k.toLowerCase()));

  let score = 30; // já parte de uma base por ter link/ícone de WhatsApp — é o sinal mais forte aqui
  const reasons: string[] = ["anúncio com WhatsApp"];

  score += matchedInclude.length * 15;
  if (matchedInclude.length > 0) reasons.push(`${matchedInclude.length} palavra(s)-chave de interesse`);

  if (ad.whatsappLinks.length > 0) {
    score += 20;
    reasons.push("link direto de grupo/contato encontrado");
  }

  score -= matchedExclude.length * 25;
  if (matchedExclude.length > 0) reasons.push(`${matchedExclude.length} termo(s) de recorrência genérica`);

  score = Math.max(0, Math.min(100, score));

  const isLaunch = LAUNCH_TERMS.some((t) => lower.includes(t));
  const category: FindingCategory = isLaunch ? "lancamento" : "promocao_especial";

  let decision: AdDecision;
  if (score < 25) decision = "ignorar";
  else if (score >= 75) decision = "aceitar";
  else decision = settings.aiEnabled ? "revisar-com-ia" : "aceitar";

  return { score, decision, category, matchedKeywords: matchedInclude, reason: reasons.join("; ") };
}

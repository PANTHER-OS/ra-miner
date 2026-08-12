// Pontuação de anúncios da Biblioteca — reaproveita as mesmas palavras-chave
// de incluir/excluir configuradas pro WhatsApp (o critério de "lançamento"
// vs "promoção especial de um dia" vs "genérica" é o mesmo, muda só a
// origem do texto).
//
// Decisão 100% síncrona e local (sem IA): o card fechado da Biblioteca não
// costuma mostrar o link do grupo de WhatsApp — só aparece depois de abrir
// "Ver detalhes do anúncio" — então um link visível é tratado como BÔNUS,
// nunca como exigência. Isso evita o problema de "não encontra nada" quando
// nenhum anúncio da tela mostra o link de cara.
import type { FindingCategory, RawAd, Settings } from "../types";

const LAUNCH_TERMS = ["lançamento", "lançou", "chegou", "disponível agora", "pré-venda", "pre-venda", "novidade"];

export interface AdVerdict {
  relevant: boolean;
  score: number;
  category: FindingCategory;
  matchedKeywords: string[];
  reason: string;
  groupLink?: string;
}

export function scoreAd(ad: RawAd, settings: Settings): AdVerdict {
  const lower = ad.body.toLowerCase();
  const matchedInclude = settings.includeKeywords.filter((k) => lower.includes(k.toLowerCase()));
  const matchedExclude = settings.excludeKeywords.filter((k) => lower.includes(k.toLowerCase()));

  let score = matchedInclude.length * 22;
  const reasons: string[] = [];
  if (matchedInclude.length > 0) reasons.push(`${matchedInclude.length} palavra(s)-chave de interesse`);

  if (ad.whatsappLinks.length > 0 || ad.hasWhatsAppPlatformIcon) {
    score += 20;
    reasons.push("sinal de WhatsApp no anúncio");
  }

  score -= matchedExclude.length * 30;
  if (matchedExclude.length > 0) reasons.push(`${matchedExclude.length} termo(s) de recorrência genérica`);

  score = Math.max(0, Math.min(100, score));

  const isLaunch = LAUNCH_TERMS.some((t) => lower.includes(t));
  const category: FindingCategory = isLaunch ? "lancamento" : "promocao_especial";

  // reaproveita o mesmo slider de sensibilidade das configurações — mais
  // baixo = mais rígido, mais alto = pega mais coisa.
  const relevant = score >= settings.sensitivity && matchedInclude.length > 0;

  return {
    relevant,
    score,
    category,
    matchedKeywords: matchedInclude,
    reason: reasons.join("; ") || "sem palavra-chave configurada encontrada",
    groupLink: ad.whatsappLinks[0],
  };
}

// Normaliza uma mensagem pro "molde" dela (removendo números, datas, links e
// emojis) e gera um hash curto. Serve pra reconhecer quando um grupo manda
// "a mesma mensagem" em padrão recorrente (ex.: todo dia a mesma promoção
// trocando só o preço/data) — isso é o que alimenta a supressão automática
// de recorrência em rules-engine.ts.

export function normalizeTemplate(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // remove acentos (marcas diacríticas após NFD)
    .replace(/https?:\/\/\S+/g, "")
    .replace(/\d+/g, "#")
    .replace(/[^\p{L}#]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** FNV-1a de 32 bits — rápido, sem dependências, suficiente pra chave de agrupamento. */
export function hashTemplate(normalized: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < normalized.length; i++) {
    hash ^= normalized.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36);
}

/**
 * Um template é considerado "recorrente" quando já apareceu várias vezes
 * espalhado em pelo menos 2 dias da semana diferentes (indício de rotina:
 * "toda segunda", "toda sexta"...) — uma promoção especial de verdade tende
 * a aparecer 1x, com texto praticamente único.
 */
export function isRecurringPattern(count: number, weekdaysSeen: number[]): boolean {
  return count >= 3 && weekdaysSeen.length >= 2;
}

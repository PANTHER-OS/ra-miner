// Helpers de formatação usados só pela página /lucro2x. Tudo em centavos pra
// evitar erro de ponto flutuante.

export function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function formatBRLNoSymbol(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// Percentual de desconto entre o preço de ancoragem e o preço atual,
// arredondado pra inteiro (é assim que desconto costuma ser comunicado —
// "-67%", não "-66,63%"). Só faz sentido chamar quando anchorCents existe.
export function discountPercent(anchorCents: number, priceCents: number): number {
  return Math.round(100 - (priceCents / anchorCents) * 100);
}

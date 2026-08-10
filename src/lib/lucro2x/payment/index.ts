// Ponto único de entrada pro pagamento — a rota de API só chama
// `getPixGateway()`. Trocar de provedor no futuro é mudar essa lista, não
// caçar import espalhado.
import { blackCatGateway } from "./blackcat";
import { mercadoPagoGateway } from "./mercadopago";
import type { PixGateway } from "./types";

// Ordem importa: o primeiro configurado (isConfigured() === true) é usado.
// BlackCat é o gateway ativo do lançamento — Mercado Pago fica como
// referência/fallback, caso um dia se queira trocar de volta.
const gateways: PixGateway[] = [blackCatGateway, mercadoPagoGateway];

export function getPixGateway(): PixGateway | null {
  return gateways.find((g) => g.isConfigured()) ?? null;
}

export type { PixChargeInput, PixChargeResult, PixGateway } from "./types";

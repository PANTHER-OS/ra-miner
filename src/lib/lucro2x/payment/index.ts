// Ponto único de entrada pro pagamento — a rota de API só chama
// `getPixGateway()`. Trocar de provedor no futuro é mudar essa lista, não
// caçar import espalhado.
import { mercadoPagoGateway } from "./mercadopago";
import type { PixGateway } from "./types";

const gateways: PixGateway[] = [mercadoPagoGateway];

export function getPixGateway(): PixGateway | null {
  return gateways.find((g) => g.isConfigured()) ?? null;
}

export type { PixChargeInput, PixChargeResult, PixGateway } from "./types";

// Adaptador de referência: Mercado Pago (API de Pagamentos, método "pix").
// https://www.mercadopago.com.br/developers/pt/reference/payments/_payments/post
//
// Lê o token SOMENTE de variável de ambiente do servidor
// (MERCADOPAGO_ACCESS_TOKEN) — nunca do código, nunca do cliente. Configure
// em: Vercel → Project Settings → Environment Variables.
import type { PixChargeInput, PixChargeResult, PixGateway } from "./types";

const API_URL = "https://api.mercadopago.com/v1/payments";

export const mercadoPagoGateway: PixGateway = {
  name: "mercadopago",

  isConfigured() {
    return Boolean(process.env.MERCADOPAGO_ACCESS_TOKEN);
  },

  async createCharge(input: PixChargeInput): Promise<PixChargeResult> {
    const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!token) {
      throw new Error("MERCADOPAGO_ACCESS_TOKEN não configurado");
    }

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        // Evita cobrança duplicada em caso de retry de rede.
        "X-Idempotency-Key": crypto.randomUUID(),
      },
      body: JSON.stringify({
        transaction_amount: Math.round(input.amountCents) / 100,
        description: input.description,
        payment_method_id: "pix",
        payer: {
          email: input.payer.email,
          first_name: input.payer.firstName,
          last_name: input.payer.lastName,
          identification: {
            type: "CPF",
            number: input.payer.cpf,
          },
        },
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Mercado Pago retornou ${response.status}: ${body}`);
    }

    const data = await response.json();
    const tx = data?.point_of_interaction?.transaction_data;

    if (!tx?.qr_code || !tx?.qr_code_base64) {
      throw new Error("Mercado Pago não retornou os dados do Pix esperados");
    }

    return {
      chargeId: String(data.id),
      copyPasteCode: tx.qr_code,
      qrCodeBase64: tx.qr_code_base64,
      expiresAt: data.date_of_expiration ?? new Date(Date.now() + 30 * 60_000).toISOString(),
    };
  },
};

// Adaptador: BlackCat (https://docs.blackcatoficial.com/) — endpoint de
// vendas, método "pix".
//
// Lê a chave SOMENTE de variável de ambiente do servidor
// (BLACKCAT_API_KEY) — nunca do código, nunca do cliente. Configure em:
// Vercel → Project Settings → Environment Variables.
//
// Duas particularidades observadas em teste direto contra a API (não estão
// na documentação):
// 1) O endpoint falha de forma intermitente com 500 genérico, sem relação
//    com o valor cobrado — parece rotear entre provedores diferentes por
//    trás. Por isso `createCharge` tenta de novo algumas vezes antes de
//    desistir.
// 2) Mesmo numa resposta de sucesso, `qrCodeBase64` às vezes vem vazio
//    (só o código copia-e-cola, sem imagem). Por isso geramos a imagem do
//    QR aqui mesmo, a partir do copia-e-cola, quando isso acontece — o
//    comprador nunca fica sem QR pra escanear.
import QRCode from "qrcode";
import type { PixChargeInput, PixChargeResult, PixGateway } from "./types";

const API_URL = "https://api.blackcatoficial.com/api/sales/create-sale";
const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 800;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function requestCharge(input: PixChargeInput, apiKey: string) {
  const fullName = `${input.payer.firstName} ${input.payer.lastName}`.trim();

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": apiKey,
    },
    body: JSON.stringify({
      amount: Math.round(input.amountCents),
      paymentMethod: "pix",
      items: [
        {
          title: input.description,
          quantity: 1,
          unitPrice: Math.round(input.amountCents),
        },
      ],
      customer: {
        name: fullName,
        email: input.payer.email,
        phone: input.payer.phone,
        document: {
          number: input.payer.cpf,
          type: "cpf",
        },
      },
      // Identificador nosso, útil pra conciliar com o webhook e evitar
      // duplicidade em caso de retry de rede.
      externalRef: crypto.randomUUID(),
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`BlackCat retornou ${response.status}: ${body}`);
  }

  const data = await response.json();
  const tx = data?.data;
  const pix = tx?.paymentData;

  if (!data?.success || !tx?.transactionId || !pix?.copyPaste) {
    throw new Error("BlackCat não retornou os dados de Pix esperados");
  }

  return { tx, pix };
}

export const blackCatGateway: PixGateway = {
  name: "blackcat",

  isConfigured() {
    return Boolean(process.env.BLACKCAT_API_KEY);
  },

  async createCharge(input: PixChargeInput): Promise<PixChargeResult> {
    const apiKey = process.env.BLACKCAT_API_KEY;
    if (!apiKey) {
      throw new Error("BLACKCAT_API_KEY não configurado");
    }

    let lastError: unknown;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        const { tx, pix } = await requestCharge(input, apiKey);

        // A API às vezes devolve o QR como data URI
        // (`data:image/png;base64,...`) e às vezes não devolve nenhuma
        // imagem — só o código copia-e-cola. O resto do código
        // (CheckoutForm) espera sempre um base64 puro, sem prefixo.
        let qrCodeBase64: string = pix.qrCodeBase64
          ? String(pix.qrCodeBase64).replace(/^data:image\/\w+;base64,/, "")
          : "";

        if (!qrCodeBase64) {
          const dataUrl = await QRCode.toDataURL(pix.copyPaste, {
            errorCorrectionLevel: "M",
            margin: 1,
            width: 512,
          });
          qrCodeBase64 = dataUrl.replace(/^data:image\/\w+;base64,/, "");
        }

        return {
          chargeId: tx.transactionId,
          copyPasteCode: pix.copyPaste,
          qrCodeBase64,
          expiresAt: pix.expiresAt || new Date(Date.now() + 24 * 60 * 60_000).toISOString(),
        };
      } catch (err) {
        lastError = err;
        if (attempt < MAX_ATTEMPTS) {
          console.warn(
            `[blackcat] tentativa ${attempt}/${MAX_ATTEMPTS} falhou, tentando de novo:`,
            err,
          );
          await sleep(RETRY_DELAY_MS * attempt);
        }
      }
    }

    throw lastError instanceof Error
      ? lastError
      : new Error("BlackCat: falha desconhecida ao gerar Pix");
  },
};

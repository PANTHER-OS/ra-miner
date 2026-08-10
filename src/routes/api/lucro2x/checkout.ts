import { createFileRoute } from "@tanstack/react-router";
import { pricing, programInfo } from "@/lib/lucro2x/config";
import { getPixGateway } from "@/lib/lucro2x/payment";
import {
  isValidCPF,
  isValidEmail,
  isValidPhone,
  onlyDigits,
  splitFullName,
} from "@/lib/lucro2x/validation";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// Roda só no servidor (Nitro) — é por isso que ler process.env aqui é
// seguro: esse arquivo nunca é enviado pro navegador. Recebe nome/CPF/
// e-mail/telefone, valida, e pede o Pix pro gateway configurado. Sem
// gateway configurado, devolve `not_configured` em vez de inventar um QR
// Code falso.
export const Route = createFileRoute("/api/lucro2x/checkout")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: {
          fullName?: string;
          cpf?: string;
          email?: string;
          phone?: string;
        };

        try {
          body = await request.json();
        } catch {
          return json({ error: "invalid_json" }, 400);
        }

        const fullName = (body.fullName ?? "").trim();
        const cpf = onlyDigits(body.cpf ?? "");
        const email = (body.email ?? "").trim();
        const phone = onlyDigits(body.phone ?? "");

        const errors: Record<string, string> = {};
        if (fullName.length < 3) errors.fullName = "Nome completo é obrigatório.";
        if (!isValidCPF(cpf)) errors.cpf = "CPF inválido.";
        if (!isValidEmail(email)) errors.email = "E-mail inválido.";
        if (!isValidPhone(phone)) errors.phone = "Telefone inválido.";

        if (Object.keys(errors).length > 0) {
          return json({ error: "validation", fields: errors }, 400);
        }

        const gateway = getPixGateway();
        if (!gateway) {
          // Estrutura pronta, só falta a chave — não fabricamos QR Code.
          return json({ error: "not_configured" }, 503);
        }

        const { firstName, lastName } = splitFullName(fullName);

        try {
          const charge = await gateway.createCharge({
            amountCents: pricing.fullPriceCents,
            description: `${programInfo.name} — condição de lançamento`,
            payer: { firstName, lastName, email, cpf, phone },
          });
          return json({ charge });
        } catch (e) {
          console.error("[lucro2x/checkout] falha ao gerar Pix:", e);
          return json({ error: "gateway_error" }, 502);
        }
      },
    },
  },
});

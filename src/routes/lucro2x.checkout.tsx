import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { CheckoutForm } from "@/components/lucro2x/CheckoutForm";
import { guarantee, pricing, programInfo } from "@/lib/lucro2x/config";
import { formatBRL } from "@/lib/lucro2x/format";

// Tela pra onde todo CTA de "comprar" leva — formulário (nome/CPF/e-mail/
// telefone) que gera um Pix (QR Code + copia-e-cola) via /api/lucro2x/checkout.
// Rota própria (não modal) pra funcionar bem com botão voltar, compartilhamento
// e sem complexidade de acessibilidade de modal.
export const Route = createFileRoute("/lucro2x/checkout")({
  head: () => ({
    meta: [
      { title: `Finalizar — ${programInfo.name}` },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: CheckoutPage,
});

function CheckoutPage() {
  return (
    <div className="relative min-h-screen">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] opacity-70"
        style={{ background: "var(--gradient-aurora)" }}
      />

      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 py-10 sm:py-14">
        <Link
          to="/lucro2x"
          className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar pra oferta
        </Link>

        <div className="surface-card mt-6 rounded-3xl p-6 shadow-[var(--shadow-panel)] sm:p-8">
          <p className="text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {programInfo.name}
          </p>
          <div className="mt-2 flex flex-col items-center">
            <span className="font-display text-4xl font-semibold tracking-tight text-foreground">
              {formatBRL(pricing.fullPriceCents)}
            </span>
            <span className="mt-1 text-xs text-muted-foreground">
              via Pix · condição de lançamento
            </span>
          </div>

          <div className="mt-7">
            <CheckoutForm />
          </div>
        </div>

        <p className="mx-auto mt-5 flex max-w-xs items-center gap-1.5 text-center text-xs text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-primary" strokeWidth={1.75} />
          Garantia incondicional de {guarantee.days} dias — {guarantee.rule}.
        </p>
      </div>
    </div>
  );
}

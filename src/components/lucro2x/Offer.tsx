import { Check, ShieldCheck } from "lucide-react";
import { guarantee, offerWindow, pricing, programInfo } from "@/lib/lucro2x/config";
import { formatBRL } from "@/lib/lucro2x/format";
import { CtaButton } from "./CtaButton";
import { Countdown } from "./Countdown";
import { Section, Eyebrow } from "./Section";

function installmentValueCents() {
  const { count, valueCentsOverride } = pricing.installments;
  return valueCentsOverride ?? Math.round(pricing.fullPriceCents / count);
}

const included = [
  "Acesso ao programa completo — os 4 pilares",
  "Condição exclusiva apresentada neste lançamento",
];

export function Offer() {
  return (
    <Section id="oferta" className="bg-surface/40">
      <div className="mx-auto max-w-xl text-center">
        <Eyebrow>Condição de lançamento</Eyebrow>
        <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Tudo isso por
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
          O que está em jogo não é o preço do programa — é o custo de continuar decidindo lucro e
          patrimônio sem uma estrutura clara pra isso.
        </p>
      </div>

      <div className="surface-card relative mx-auto mt-8 max-w-xl overflow-hidden rounded-3xl p-7 shadow-[var(--shadow-panel)] sm:p-10">
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="pointer-events-none absolute inset-0 h-full w-full opacity-70"
          aria-hidden
        >
          <defs>
            <radialGradient id="offer-glow" cx="50%" cy="0%" r="75%">
              <stop offset="0%" stopColor="oklch(0.82 0.14 78 / 0.16)" />
              <stop offset="100%" stopColor="oklch(0.82 0.14 78 / 0)" />
            </radialGradient>
          </defs>
          <rect width="100" height="100" fill="url(#offer-glow)" />
          {[18, 34, 50].map((r) => (
            <circle
              key={r}
              cx="50"
              cy="0"
              r={r}
              fill="none"
              stroke="var(--border)"
              strokeWidth="0.15"
            />
          ))}
        </svg>

        <div className="relative">
          <p className="text-center text-sm font-medium uppercase tracking-wide text-muted-foreground">
            {programInfo.name}
          </p>

          <div className="mt-4 flex flex-col items-center">
            <span className="font-display text-5xl font-semibold tracking-tight text-foreground sm:text-6xl">
              {formatBRL(pricing.fullPriceCents)}
            </span>
            <span className="mt-2 text-sm text-muted-foreground">à vista</span>
            <span className="mt-1 text-sm text-muted-foreground">
              ou {pricing.installments.count}x de {formatBRL(installmentValueCents())}
            </span>
          </div>

          <ul className="mt-6 space-y-2.5">
            {included.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm text-foreground/90">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" strokeWidth={2.25} />
                {item}
              </li>
            ))}
          </ul>

          <div className="mt-7 flex flex-col items-center gap-4">
            <CtaButton location="oferta" className="w-full justify-center sm:w-auto">
              Quero a condição especial
            </CtaButton>

            <Countdown />

            {offerWindow.seatsLimit != null && (
              <p className="text-xs text-muted-foreground">
                Limitado a {offerWindow.seatsLimit} vagas nesta condição.
              </p>
            )}

            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" strokeWidth={1.75} />
              Garantia incondicional de {guarantee.days} dias — {guarantee.rule}.
            </p>
          </div>
        </div>
      </div>
    </Section>
  );
}

import { Check } from "lucide-react";
import { offerWindow, pricing, programInfo } from "@/lib/lucro2x/config";
import { formatBRL } from "@/lib/lucro2x/format";
import { CtaButton } from "./CtaButton";
import { Countdown } from "./Countdown";
import { Section, Eyebrow } from "./Section";

function installmentValueCents() {
  const { count, valueCentsOverride } = pricing.installments;
  return valueCentsOverride ?? Math.round(pricing.fullPriceCents / count);
}

const included = [
  "Acesso ao programa completo",
  "Todos os bônus da condição de lançamento",
  "Condição exclusiva apresentada neste lançamento",
];

export function Offer() {
  return (
    <Section id="oferta" className="bg-surface/40">
      <div className="mx-auto max-w-xl">
        <div className="text-center">
          <Eyebrow>Condição de lançamento</Eyebrow>
          <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Tudo isso por
          </h2>
        </div>

        <div className="surface-card mt-8 rounded-3xl p-7 shadow-[var(--shadow-panel)] sm:p-10">
          <p className="text-center text-sm font-medium uppercase tracking-wide text-muted-foreground">
            {programInfo.checkoutName}
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

          <ul className="mt-7 space-y-2.5">
            {included.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm text-foreground/90">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" strokeWidth={2.25} />
                {item}
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-col items-center gap-4">
            <CtaButton location="oferta" className="w-full justify-center sm:w-auto">
              Quero a condição especial
            </CtaButton>

            <Countdown />

            {offerWindow.seatsLimit != null && (
              <p className="text-xs text-muted-foreground">
                Limitado a {offerWindow.seatsLimit} vagas nesta condição.
              </p>
            )}
          </div>
        </div>
      </div>
    </Section>
  );
}

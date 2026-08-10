import { pricing } from "@/lib/lucro2x/config";
import { formatBRL } from "@/lib/lucro2x/format";
import { Section, Eyebrow } from "./Section";

export function Anchor() {
  return (
    <Section>
      <div className="mx-auto max-w-2xl text-center">
        <Eyebrow>Valor vs. investimento</Eyebrow>
        <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          O que está em jogo não é o preço do programa.
        </h2>
        <p className="mt-5 text-base leading-relaxed text-muted-foreground sm:text-lg">
          É o custo de continuar tomando decisões de lucro, custo e patrimônio sem uma estrutura
          clara para isso — mês após mês, dentro de uma empresa que já fatura.
        </p>

        {pricing.anchorPriceCents != null && (
          <div className="mx-auto mt-8 flex max-w-xs items-center justify-center gap-4 rounded-2xl border border-border bg-surface/60 px-6 py-5">
            <div className="text-left">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Preço oficial anterior
              </p>
              <p className="font-display text-xl font-semibold text-muted-foreground line-through decoration-destructive/60">
                {formatBRL(pricing.anchorPriceCents)}
              </p>
            </div>
          </div>
        )}
      </div>
    </Section>
  );
}

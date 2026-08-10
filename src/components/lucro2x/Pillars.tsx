import { pillars } from "@/lib/lucro2x/config";
import { Section, Eyebrow } from "./Section";

export function Pillars() {
  return (
    <Section>
      <div className="mx-auto max-w-2xl text-center">
        <Eyebrow>Os 4 pilares</Eyebrow>
        <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Uma estrutura, quatro frentes de trabalho.
        </h2>
      </div>

      <div className="mt-10 grid gap-5 sm:grid-cols-2">
        {pillars.map((pillar) => (
          <div key={pillar.number} className="hover-lift surface-card rounded-2xl p-6">
            <div className="flex items-baseline gap-3">
              <span className="font-display text-2xl font-semibold text-primary/70">
                {pillar.number}
              </span>
              <h3 className="font-display text-lg font-semibold text-foreground">{pillar.name}</h3>
            </div>

            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{pillar.insight}</p>

            <div className="mt-4 border-t border-border/70 pt-4">
              <p className="text-sm font-medium text-foreground/90">{pillar.delivery}</p>
              <p className="mt-1 text-sm text-muted-foreground">{pillar.benefit}</p>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

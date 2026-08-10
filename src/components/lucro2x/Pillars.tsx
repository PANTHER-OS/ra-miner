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

      <div className="mt-12 grid gap-5 sm:grid-cols-2">
        {pillars.map((pillar) => (
          <div
            key={pillar.number}
            className="hover-lift surface-card flex flex-col gap-4 rounded-2xl p-6 sm:p-7"
          >
            <div className="flex items-baseline gap-3">
              <span className="font-display text-3xl font-semibold text-primary/70">
                {pillar.number}
              </span>
              <h3 className="font-display text-xl font-semibold text-foreground">{pillar.name}</h3>
            </div>

            <dl className="space-y-3 text-sm leading-relaxed">
              <div>
                <dt className="font-medium text-foreground/80">O problema</dt>
                <dd className="mt-1 text-muted-foreground">{pillar.problem}</dd>
              </div>
              <div>
                <dt className="font-medium text-foreground/80">O princípio</dt>
                <dd className="mt-1 text-muted-foreground">{pillar.principle}</dd>
              </div>
              <div>
                <dt className="font-medium text-foreground/80">O que será trabalhado</dt>
                <dd className="mt-1 text-muted-foreground/70 italic">{pillar.whatIsWorked}</dd>
              </div>
              <div>
                <dt className="font-medium text-foreground/80">O benefício prático</dt>
                <dd className="mt-1 text-muted-foreground">{pillar.benefit}</dd>
              </div>
            </dl>
          </div>
        ))}
      </div>
    </Section>
  );
}

import { ArrowRight } from "lucide-react";
import { Section, Eyebrow } from "./Section";

const problems = [
  "Faturamento não significa lucro.",
  "Lucro não significa patrimônio.",
  "Crescer pode aumentar a complexidade mais rápido que o resultado.",
  "Empresa e patrimônio pessoal podem acabar misturados.",
];

const chain = ["Receita", "Eficiência", "Margem", "Lucro", "Alocação", "Patrimônio"];

// Junta "o problema" e "a nova forma de enxergar" numa seção só — as duas
// são a mesma ideia (o modelo mental que a maioria usa é raso demais) vista
// de dois ângulos, e separá-las só duplicava título e respiro na página.
export function Shift() {
  return (
    <Section className="bg-surface/40">
      <div className="mx-auto max-w-2xl text-center">
        <Eyebrow>A virada</Eyebrow>
        <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Faturar, lucrar e acumular patrimônio são três coisas diferentes.
        </h2>
      </div>

      <div className="mx-auto mt-8 grid max-w-2xl gap-3 sm:grid-cols-2">
        {problems.map((item) => (
          <div
            key={item}
            className="flex items-start gap-2.5 rounded-xl border border-border bg-surface/60 px-4 py-3"
          >
            <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
            <p className="text-sm leading-relaxed text-foreground/90">{item}</p>
          </div>
        ))}
      </div>

      <div className="mx-auto mt-10 flex max-w-2xl flex-wrap items-center justify-center gap-y-2">
        {chain.map((step, i) => (
          <div key={step} className="flex items-center">
            <span className="rounded-full border border-border bg-surface-elevated/80 px-3.5 py-1.5 text-sm font-medium text-foreground/90">
              {step}
            </span>
            {i < chain.length - 1 && (
              <ArrowRight className="mx-1.5 h-4 w-4 shrink-0 text-primary/70" />
            )}
          </div>
        ))}
      </div>

      <p className="mx-auto mt-6 max-w-lg text-center text-sm text-muted-foreground">
        O programa trabalha essa cadeia de forma integrada — não como três temas separados, mas como
        uma única sequência de decisão.
      </p>
    </Section>
  );
}

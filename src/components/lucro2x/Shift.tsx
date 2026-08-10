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

      {/* Painel do mecanismo: a mesma cadeia Receita→Patrimônio, agora sobre
          uma curva ascendente gerada (SVG) em vez de só uma fileira de
          pílulas soltas — vira peça gráfica, não lista. */}
      <div className="surface-card relative mx-auto mt-10 max-w-2xl overflow-hidden rounded-2xl px-5 py-8 sm:px-10">
        <svg
          viewBox="0 0 100 36"
          preserveAspectRatio="none"
          className="pointer-events-none absolute inset-0 h-full w-full opacity-80"
          aria-hidden
        >
          <defs>
            <linearGradient id="shift-curve" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0%" stopColor="oklch(0.72 0.16 55 / 0.35)" />
              <stop offset="100%" stopColor="oklch(0.88 0.17 85)" />
            </linearGradient>
            <radialGradient id="shift-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="oklch(0.88 0.17 85 / 0.5)" />
              <stop offset="100%" stopColor="oklch(0.88 0.17 85 / 0)" />
            </radialGradient>
          </defs>
          <path
            d="M 2 28 C 20 26, 30 22, 42 20 S 62 12, 74 10 S 92 4, 98 3"
            fill="none"
            stroke="url(#shift-curve)"
            strokeWidth="0.6"
            strokeLinecap="round"
          />
          <circle cx="98" cy="3" r="9" fill="url(#shift-glow)" />
        </svg>

        <div className="relative flex flex-wrap items-center justify-center gap-y-2">
          {chain.map((step, i) => (
            <div key={step} className="flex items-center">
              <span
                className={
                  i === chain.length - 1
                    ? "rounded-full border border-primary/50 bg-surface-elevated px-3.5 py-1.5 text-sm font-semibold text-primary shadow-[0_0_20px_-4px_oklch(0.82_0.14_78_/_0.6)]"
                    : "rounded-full border border-border bg-surface-elevated/80 px-3.5 py-1.5 text-sm font-medium text-foreground/90"
                }
              >
                {step}
              </span>
              {i < chain.length - 1 && (
                <ArrowRight className="mx-1.5 h-4 w-4 shrink-0 text-primary/70" />
              )}
            </div>
          ))}
        </div>

        <p className="relative mx-auto mt-6 max-w-lg text-center text-sm text-muted-foreground">
          O programa trabalha essa cadeia de forma integrada — não como três temas separados, mas
          como uma única sequência de decisão.
        </p>
      </div>
    </Section>
  );
}

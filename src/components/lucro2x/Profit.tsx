import { Section, Eyebrow } from "./Section";

const levers = [
  "Aumento de margem",
  "Eficiência operacional",
  "Redução de desperdícios",
  "Melhoria de processos",
  "Tomada de decisão",
  "Estruturação financeira",
  "Escala sustentável",
];

export function Profit() {
  return (
    <Section>
      <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-16">
        <div>
          <Eyebrow>Multiplicação de lucro</Eyebrow>
          <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            O objetivo não é vender mais. É fazer sobrar mais do que já é vendido.
          </h2>
          <p className="mt-5 text-base leading-relaxed text-muted-foreground">
            O trabalho aqui é sobre estrutura, não sobre promessa de resultado. A cada alavanca
            trabalhada, o objetivo é que a empresa consiga reter mais do que fatura — sem depender
            de crescer a qualquer custo.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          {levers.map((lever) => (
            <span
              key={lever}
              className="rounded-full border border-border bg-surface/70 px-4 py-2 text-sm font-medium text-foreground/90"
            >
              {lever}
            </span>
          ))}
        </div>
      </div>
    </Section>
  );
}

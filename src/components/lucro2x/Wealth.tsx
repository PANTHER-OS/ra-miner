import { Section, Eyebrow } from "./Section";

const principles = [
  "Separação entre empresa e patrimônio pessoal",
  "Organização financeira",
  "Visão de longo prazo",
  "Alocação inteligente do que sobra",
  "Proteção patrimonial",
  "Patrimônio construído fora da operação",
];

export function Wealth() {
  return (
    <Section className="bg-surface/40">
      <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-16">
        <div className="order-2 flex flex-wrap gap-2.5 lg:order-1">
          {principles.map((item) => (
            <span
              key={item}
              className="rounded-full border border-border bg-surface-elevated/80 px-4 py-2 text-sm font-medium text-foreground/90"
            >
              {item}
            </span>
          ))}
        </div>

        <div className="order-1 lg:order-2">
          <Eyebrow>Construção de patrimônio</Eyebrow>
          <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Lucro que fica na empresa não é patrimônio.
          </h2>
          <p className="mt-5 text-base leading-relaxed text-muted-foreground">
            Uma parte do trabalho é conceitual: entender a diferença entre o dinheiro que sustenta a
            operação e o dinheiro que deveria estar construindo patrimônio fora dela. Isso não
            substitui aconselhamento financeiro personalizado nem recomenda investimentos
            específicos — é uma visão de estrutura, para que cada decisão de alocação seja tomada
            com mais clareza.
          </p>
        </div>
      </div>
    </Section>
  );
}

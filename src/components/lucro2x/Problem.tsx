import { Section, Eyebrow } from "./Section";

const problems = [
  "Faturamento não significa lucro.",
  "Lucro não significa patrimônio.",
  "Crescer pode aumentar a complexidade mais rápido do que o resultado.",
  "Dinheiro pode estar sendo perdido em ineficiências que ninguém revisita.",
  "Decisões financeiras podem estar sendo tomadas sem estrutura clara.",
  "Empresa e patrimônio pessoal podem acabar misturados.",
  "Crescer sem controle pode destruir margem.",
];

export function Problem() {
  return (
    <Section>
      <div className="mx-auto max-w-2xl text-center">
        <Eyebrow>O problema</Eyebrow>
        <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          A maioria das empresas que crescem não fica mais rica — fica mais ocupada.
        </h2>
      </div>

      <div className="mx-auto mt-12 grid max-w-3xl gap-3 sm:grid-cols-2">
        {problems.map((item) => (
          <div
            key={item}
            className="flex items-start gap-3 rounded-xl border border-border bg-surface/60 px-5 py-4"
          >
            <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
            <p className="text-sm leading-relaxed text-foreground/90">{item}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

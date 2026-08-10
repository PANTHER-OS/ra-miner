import { Section, Eyebrow } from "./Section";

// Antes eram duas seções cheias (lucro / patrimônio) — juntas em duas
// colunas curtas, cortam metade da rolagem sem perder nenhuma das duas
// ideias centrais do briefing.
export function ProfitWealth() {
  return (
    <Section className="bg-surface/40">
      <div className="mx-auto max-w-2xl text-center">
        <Eyebrow>Lucro e patrimônio, na prática</Eyebrow>
      </div>

      <div className="mx-auto mt-8 grid max-w-3xl gap-6 sm:grid-cols-2">
        <div className="surface-card rounded-2xl p-6">
          <h3 className="font-display text-lg font-semibold text-foreground">
            Multiplicação de lucro
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            O objetivo não é vender mais — é fazer sobrar mais do que já é vendido. O trabalho é
            sobre margem, eficiência e redução de desperdício, sem depender de crescer a qualquer
            custo.
          </p>
        </div>

        <div className="surface-card rounded-2xl p-6">
          <h3 className="font-display text-lg font-semibold text-foreground">
            Construção de patrimônio
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Lucro que fica só na empresa não é patrimônio. A parte conceitual do programa separa o
            dinheiro que sustenta a operação do dinheiro que deveria construir patrimônio fora dela
            — sem substituir aconselhamento financeiro personalizado.
          </p>
        </div>
      </div>
    </Section>
  );
}

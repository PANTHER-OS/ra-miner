import { ArrowDown, ArrowRight } from "lucide-react";
import { Section, Eyebrow } from "./Section";

const chain = ["Receita", "Eficiência", "Margem", "Lucro", "Alocação", "Patrimônio"];

export function Mechanism() {
  return (
    <Section className="bg-surface/40">
      <div className="mx-auto max-w-2xl text-center">
        <Eyebrow>A nova forma de enxergar</Eyebrow>
        <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Faturar, lucrar e acumular patrimônio são três coisas diferentes.
        </h2>
        <p className="mt-5 text-base leading-relaxed text-muted-foreground sm:text-lg">
          O programa trabalha essa cadeia de forma integrada — não como três temas separados, mas
          como uma única sequência de decisão, do dinheiro que entra na empresa até o patrimônio que
          fica com você.
        </p>
      </div>

      <div className="mx-auto mt-14 flex max-w-3xl flex-col items-center gap-1 sm:flex-row sm:justify-center sm:gap-0">
        {chain.map((step, i) => (
          <div key={step} className="flex flex-col items-center sm:flex-row">
            <div className="hover-lift surface-card flex h-24 w-40 flex-col items-center justify-center gap-1 rounded-2xl text-center sm:h-28 sm:w-36">
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="font-display text-base font-semibold text-foreground sm:text-lg">
                {step}
              </span>
            </div>
            {i < chain.length - 1 && (
              <>
                <ArrowDown className="my-1 h-5 w-5 shrink-0 text-primary sm:hidden" />
                <ArrowRight className="mx-2 hidden h-5 w-5 shrink-0 text-primary sm:block" />
              </>
            )}
          </div>
        ))}
      </div>

      <p className="mx-auto mt-10 max-w-xl text-center text-sm text-muted-foreground">
        A pessoa não sai daqui pensando "fiz mais um curso". Sai com uma forma diferente de olhar
        para o próprio negócio.
      </p>
    </Section>
  );
}

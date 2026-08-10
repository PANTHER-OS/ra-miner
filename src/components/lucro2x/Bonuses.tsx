import { Gift } from "lucide-react";
import { bonuses } from "@/lib/lucro2x/config";
import { formatBRL } from "@/lib/lucro2x/format";
import { Section, Eyebrow } from "./Section";

export function Bonuses() {
  return (
    <Section className="bg-surface/40">
      <div className="mx-auto max-w-2xl text-center">
        <Eyebrow>Bônus</Eyebrow>
        <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Quem entrar na condição de lançamento também recebe
        </h2>
      </div>

      <div className="mx-auto mt-12 grid max-w-3xl gap-4 sm:grid-cols-3">
        {bonuses.map((bonus, i) => (
          <div
            key={bonus.name}
            className="hover-lift surface-card flex flex-col items-center gap-3 rounded-2xl p-6 text-center"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-primary">
              <Gift className="h-4.5 w-4.5" strokeWidth={1.75} />
            </span>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Bônus #{i + 1}
            </p>
            <p className="font-display text-base font-semibold text-foreground">{bonus.name}</p>
            {bonus.perceivedValueCents != null && (
              <p className="text-sm text-muted-foreground">
                Valor percebido: {formatBRL(bonus.perceivedValueCents)}
              </p>
            )}
          </div>
        ))}
      </div>
    </Section>
  );
}

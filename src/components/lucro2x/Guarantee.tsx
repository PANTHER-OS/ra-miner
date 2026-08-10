import { ShieldCheck } from "lucide-react";
import { guarantee } from "@/lib/lucro2x/config";
import { Section } from "./Section";

export function Guarantee() {
  const hasConfirmedGuarantee = guarantee.days != null;

  return (
    <Section>
      <div className="surface-card mx-auto flex max-w-2xl flex-col items-center gap-4 rounded-2xl p-8 text-center sm:p-10">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/15 text-primary">
          <ShieldCheck className="h-5 w-5" strokeWidth={1.75} />
        </span>

        <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground">
          Garantia
        </h2>

        {hasConfirmedGuarantee ? (
          <p className="max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
            Você tem {guarantee.days} dias para conhecer o programa.
            {guarantee.rule ? ` ${guarantee.rule}.` : ""}
          </p>
        ) : (
          <p className="max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
            [POLÍTICA DE GARANTIA OFICIAL] — o prazo e as regras de garantia serão exibidos aqui
            assim que confirmados.
          </p>
        )}
      </div>
    </Section>
  );
}

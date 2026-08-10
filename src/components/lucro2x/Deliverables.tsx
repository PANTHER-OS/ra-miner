import { deliverables } from "@/lib/lucro2x/config";
import { Section, Eyebrow } from "./Section";

export function Deliverables() {
  return (
    <Section>
      <div className="mx-auto max-w-2xl text-center">
        <Eyebrow>Você recebe</Eyebrow>
        <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          O que compõe o programa
        </h2>
      </div>

      <div className="mt-12 space-y-4">
        {deliverables.map((item, i) => (
          <div
            key={item.name}
            className="surface-card grid gap-4 rounded-2xl p-6 sm:grid-cols-[auto_1fr] sm:items-start sm:gap-6 sm:p-7"
          >
            <div className="flex items-center gap-3 sm:flex-col sm:items-start">
              <span className="font-display text-2xl font-semibold text-primary/70">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="font-display text-lg font-semibold text-foreground sm:mt-1">
                {item.name}
              </h3>
            </div>

            <dl className="grid gap-3 text-sm leading-relaxed sm:grid-cols-3">
              <div>
                <dt className="font-medium text-foreground/80">O que é</dt>
                <dd className="mt-1 text-muted-foreground/70 italic">{item.what}</dd>
              </div>
              <div>
                <dt className="font-medium text-foreground/80">Por que importa</dt>
                <dd className="mt-1 text-muted-foreground/70 italic">{item.whyItMatters}</dd>
              </div>
              <div>
                <dt className="font-medium text-foreground/80">Transformação buscada</dt>
                <dd className="mt-1 text-muted-foreground/70 italic">{item.transformation}</dd>
              </div>
            </dl>
          </div>
        ))}
      </div>
    </Section>
  );
}

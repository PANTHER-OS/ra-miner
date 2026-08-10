import { objections } from "@/lib/lucro2x/config";
import { Section, Eyebrow } from "./Section";

export function Objections() {
  return (
    <Section>
      <div className="mx-auto max-w-2xl text-center">
        <Eyebrow>Antes de entrar</Eyebrow>
        <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Talvez você esteja pensando…
        </h2>
      </div>

      <div className="mx-auto mt-12 max-w-2xl space-y-5">
        {objections.map((item) => (
          <div key={item.objection} className="border-l-2 border-primary/60 pl-5">
            <p className="font-display text-lg font-medium text-foreground">"{item.objection}"</p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.response}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

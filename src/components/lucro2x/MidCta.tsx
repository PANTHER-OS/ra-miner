import { CtaButton } from "./CtaButton";
import { Section } from "./Section";

export function MidCta({
  headline,
  location,
  label,
}: {
  headline: string;
  location: string;
  label: string;
}) {
  return (
    <Section className="py-12 sm:py-16">
      <div className="surface-card mx-auto flex max-w-3xl flex-col items-center gap-6 rounded-3xl p-8 text-center sm:flex-row sm:justify-between sm:p-10 sm:text-left">
        <h3 className="font-display text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          {headline}
        </h3>
        <CtaButton location={location} size="default" className="shrink-0">
          {label}
        </CtaButton>
      </div>
    </Section>
  );
}

import { faq } from "@/lib/lucro2x/config";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Section, Eyebrow } from "./Section";

export function Faq() {
  return (
    <Section className="bg-surface/40">
      <div className="mx-auto max-w-2xl text-center">
        <Eyebrow>Perguntas frequentes</Eyebrow>
        <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Antes de decidir
        </h2>
      </div>

      <div className="surface-card mx-auto mt-10 max-w-2xl rounded-2xl px-6 sm:px-8">
        <Accordion type="single" collapsible className="w-full">
          {faq.map((item, i) => (
            <AccordionItem key={item.question} value={`item-${i}`} className="border-border/70">
              <AccordionTrigger className="text-left text-base font-medium text-foreground hover:no-underline">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </Section>
  );
}

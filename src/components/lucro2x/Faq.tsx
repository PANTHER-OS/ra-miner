import { useId, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { faq } from "@/lib/lucro2x/config";
import { Section, Eyebrow } from "./Section";

const EASE = [0.16, 1, 0.3, 1] as const;

// Accordion próprio (não o Radix/shadcn) — a altura anima via
// framer-motion medindo "auto" de verdade, em vez do keyframe CSS
// genérico do Radix, que ficava com uma "batida" perceptível na abertura.
export function Faq() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <Section className="bg-surface/40">
      <div className="mx-auto max-w-2xl text-center">
        <Eyebrow>Perguntas frequentes</Eyebrow>
        <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Antes de decidir
        </h2>
      </div>

      <div className="surface-card mx-auto mt-10 max-w-2xl rounded-2xl px-6 sm:px-8">
        {faq.map((item, i) => (
          <FaqRow
            key={item.question}
            question={item.question}
            answer={item.answer}
            isOpen={openIndex === i}
            onToggle={() => setOpenIndex((curr) => (curr === i ? null : i))}
            isLast={i === faq.length - 1}
          />
        ))}
      </div>
    </Section>
  );
}

function FaqRow({
  question,
  answer,
  isOpen,
  onToggle,
  isLast,
}: {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
  isLast: boolean;
}) {
  const contentId = useId();

  return (
    <div className={isLast ? "" : "border-b border-border/70"}>
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={contentId}
        onClick={onToggle}
        className="flex w-full cursor-pointer items-center justify-between gap-4 py-4 text-left text-base font-medium text-foreground"
      >
        {question}
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.35, ease: EASE }}
          className="shrink-0 text-muted-foreground"
        >
          <ChevronDown className="h-4 w-4" />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            id={contentId}
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{
              height: { duration: 0.4, ease: EASE },
              opacity: { duration: 0.3, ease: EASE },
            }}
            className="overflow-hidden"
          >
            <p className="pb-4 text-sm leading-relaxed text-muted-foreground">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

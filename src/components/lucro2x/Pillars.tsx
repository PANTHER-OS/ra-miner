import { motion } from "framer-motion";
import { PiggyBank, Settings2, TrendingUp, Users2 } from "lucide-react";
import { pillars } from "@/lib/lucro2x/config";
import { Section, Eyebrow } from "./Section";

const icons = [TrendingUp, Settings2, PiggyBank, Users2];

export function Pillars() {
  return (
    <Section>
      <div className="mx-auto max-w-2xl text-center">
        <Eyebrow>Os 4 pilares</Eyebrow>
        <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Uma estrutura, quatro frentes de trabalho.
        </h2>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {pillars.map((pillar, i) => {
          const Icon = icons[i];
          return (
            <motion.div
              key={pillar.number}
              className="hover-lift surface-card rounded-2xl p-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                  <Icon className="h-4.5 w-4.5" strokeWidth={1.75} />
                </span>
                <h3 className="font-display text-lg font-semibold text-foreground">
                  {pillar.name}
                </h3>
              </div>

              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{pillar.insight}</p>
              <p className="mt-3 border-t border-border/70 pt-3 text-sm font-medium text-foreground/90">
                {pillar.takeaway}
              </p>
            </motion.div>
          );
        })}
      </div>
    </Section>
  );
}

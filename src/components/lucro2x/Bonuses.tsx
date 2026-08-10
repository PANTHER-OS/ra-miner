import { motion } from "framer-motion";
import { FileSpreadsheet, ListChecks, MessagesSquare, Video } from "lucide-react";
import { bonuses } from "@/lib/lucro2x/config";
import { Section, Eyebrow } from "./Section";

const icons = [FileSpreadsheet, ListChecks, Video, MessagesSquare];

export function Bonuses() {
  return (
    <Section className="bg-surface/40">
      <div className="mx-auto max-w-2xl text-center">
        <Eyebrow>Bônus</Eyebrow>
        <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Quem entrar agora também recebe
        </h2>
      </div>

      <div className="mx-auto mt-10 grid max-w-3xl gap-4 sm:grid-cols-2">
        {bonuses.map((bonus, i) => {
          const Icon = icons[i];
          return (
            <motion.div
              key={bonus.name}
              className="surface-card flex items-start gap-3.5 rounded-2xl p-5"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                <Icon className="h-4.5 w-4.5" strokeWidth={1.75} />
              </span>
              <div>
                <h3 className="font-display text-base font-semibold text-foreground">
                  {bonus.name}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {bonus.description}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </Section>
  );
}

import { motion, type Variants } from "framer-motion";
import { programInfo, pricing } from "@/lib/lucro2x/config";
import { formatBRL } from "@/lib/lucro2x/format";
import { CtaButton } from "./CtaButton";
import { Countdown } from "./Countdown";
import { HeroVisual } from "./HeroVisual";

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } },
};

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-14 sm:pt-20">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[480px] opacity-70"
        style={{ background: "var(--gradient-aurora)" }}
      />

      <div className="mx-auto grid w-full max-w-4xl items-center gap-10 px-5 pb-14 sm:px-8 sm:pb-20 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14">
        <motion.div variants={container} initial="hidden" animate="show">
          <motion.p
            variants={item}
            className="text-sm font-semibold uppercase tracking-[0.2em] text-primary"
          >
            {programInfo.name}
          </motion.p>

          <motion.h1
            variants={item}
            className="mt-3 font-display text-4xl font-semibold leading-[1.08] tracking-tight text-foreground sm:text-5xl"
          >
            Transforme o lucro da sua empresa em{" "}
            <span className="gold-text">crescimento e patrimônio</span>.
          </motion.h1>

          <motion.p
            variants={item}
            className="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground"
          >
            Uma estrutura para decidir, com clareza, onde o dinheiro da empresa deve trabalhar —
            para crescer com margem e construir patrimônio fora da operação.
          </motion.p>

          <motion.div
            variants={item}
            className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center"
          >
            <CtaButton location="hero">Quero conhecer o programa</CtaButton>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
              <span>Condição de lançamento</span>
              {pricing.anchorPriceCents != null && (
                <span className="line-through decoration-2 opacity-70">
                  {formatBRL(pricing.anchorPriceCents)}
                </span>
              )}
              <span className="font-semibold text-foreground">
                {formatBRL(pricing.fullPriceCents)}
              </span>
            </div>
          </motion.div>

          <motion.div variants={item} className="mt-6">
            <Countdown />
          </motion.div>
        </motion.div>

        <motion.div
          className="mx-auto w-full max-w-xs lg:max-w-none"
          initial={{ opacity: 0, scale: 0.94, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
        >
          <HeroVisual />
        </motion.div>
      </div>
    </section>
  );
}

import { eventInfo, programInfo, pricing } from "@/lib/lucro2x/config";
import { formatBRL } from "@/lib/lucro2x/format";
import { CtaButton } from "./CtaButton";
import { Countdown } from "./Countdown";
import { HeroVisual } from "./HeroVisual";
import { Eyebrow } from "./Section";

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-14 sm:pt-20">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[480px] opacity-70"
        style={{ background: "var(--gradient-aurora)" }}
      />

      <div className="mx-auto grid w-full max-w-4xl items-center gap-10 px-5 pb-14 sm:px-8 sm:pb-20 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14">
        <div>
          <Eyebrow>Continuação de {eventInfo.liveLabel} · Condição exclusiva do lançamento</Eyebrow>

          <p className="mt-5 text-sm font-semibold uppercase tracking-[0.2em] text-primary">
            {programInfo.name}
          </p>

          <h1 className="mt-3 font-display text-4xl font-semibold leading-[1.08] tracking-tight text-foreground sm:text-5xl">
            Transforme o lucro da sua empresa em{" "}
            <span className="gold-text">crescimento e patrimônio</span>.
          </h1>

          <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
            Uma estrutura para decidir, com clareza, onde o dinheiro da empresa deve trabalhar —
            para crescer com margem e construir patrimônio fora da operação.
          </p>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
            <CtaButton location="hero">Quero conhecer o programa</CtaButton>
            <div className="text-sm text-muted-foreground">
              Condição de lançamento
              <span className="ml-1.5 font-semibold text-foreground">
                {formatBRL(pricing.fullPriceCents)}
              </span>
            </div>
          </div>

          <div className="mt-6">
            <Countdown />
          </div>
        </div>

        <div className="mx-auto w-full max-w-xs lg:max-w-none">
          <HeroVisual />
        </div>
      </div>
    </section>
  );
}

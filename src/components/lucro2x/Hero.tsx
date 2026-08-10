import { eventInfo, programInfo, pricing } from "@/lib/lucro2x/config";
import { formatBRL } from "@/lib/lucro2x/format";
import { CtaButton } from "./CtaButton";
import { Countdown } from "./Countdown";
import { PlaceholderImage } from "./PlaceholderImage";
import { Eyebrow } from "./Section";

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-14 sm:pt-20">
      {/* Glow decorativo, puramente visual — não compete com o texto */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[560px] opacity-70"
        style={{ background: "var(--gradient-aurora)" }}
      />

      <div className="mx-auto grid w-full max-w-5xl items-center gap-12 px-5 pb-16 sm:px-8 sm:pb-24 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
        <div>
          <Eyebrow>Continuação de {eventInfo.liveLabel} · Condição exclusiva do lançamento</Eyebrow>

          <p className="mt-6 text-sm font-semibold uppercase tracking-[0.2em] text-primary">
            {programInfo.name}
          </p>

          <h1 className="mt-3 font-display text-4xl font-semibold leading-[1.08] tracking-tight text-foreground sm:text-5xl lg:text-[3.4rem]">
            Transforme o lucro da sua empresa em{" "}
            <span className="gold-text">crescimento e patrimônio</span>.
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
            Uma estrutura para empresários que já faturam e querem decidir, com clareza, onde o
            dinheiro da empresa deve trabalhar — para crescer com margem e construir patrimônio fora
            da operação.
          </p>

          <p className="mt-4 max-w-xl text-sm font-medium text-foreground/80">
            Não é mais um curso sobre empreender. É um sistema para quem já empreende decidir
            melhor.
          </p>

          <div className="mt-9 flex flex-col gap-4 sm:flex-row sm:items-center">
            <CtaButton location="hero">Quero conhecer o programa</CtaButton>
            <div className="text-sm text-muted-foreground">
              Condição especial de lançamento
              <span className="ml-1.5 font-semibold text-foreground">
                {formatBRL(pricing.fullPriceCents)}
              </span>
            </div>
          </div>

          <div className="mt-6">
            <Countdown />
          </div>
        </div>

        <div className="mx-auto w-full max-w-sm lg:max-w-none">
          <PlaceholderImage
            label="[IMAGEM PRINCIPAL OFICIAL]"
            aspect="aspect-[4/5]"
            className="surface-card shadow-[var(--shadow-panel)]"
          />
        </div>
      </div>
    </section>
  );
}

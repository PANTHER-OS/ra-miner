import { Hero } from "./Hero";
import { Shift } from "./Shift";
import { Pillars } from "./Pillars";
import { Bonuses } from "./Bonuses";
import { Offer } from "./Offer";
import { Faq } from "./Faq";
import { MidCta } from "./MidCta";
import { StickyCta } from "./StickyCta";
import { Footer } from "./Footer";

// Sequência enxuta: contexto (no hero) → virada de mentalidade → solução
// (pilares) → bônus → oferta → dúvidas (FAQ, já incluindo as objeções
// principais) → CTA final. Cada seção lê o conteúdo editável de
// src/lib/lucro2x/config.ts.
export function Lucro2xPage() {
  return (
    <div className="min-h-screen">
      <Hero />
      <Shift />
      <Pillars />
      <Bonuses />
      <Offer />
      <Faq />
      <MidCta
        headline="Pronto para transformar lucro em patrimônio, com estrutura?"
        location="final"
        label="Quero entrar"
      />
      <Footer />
      <StickyCta />
    </div>
  );
}

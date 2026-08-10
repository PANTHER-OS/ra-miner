import { Hero } from "./Hero";
import { EventContext } from "./EventContext";
import { Problem } from "./Problem";
import { Mechanism } from "./Mechanism";
import { Pillars } from "./Pillars";
import { MidCta } from "./MidCta";
import { Profit } from "./Profit";
import { Wealth } from "./Wealth";
import { Deliverables } from "./Deliverables";
import { Bonuses } from "./Bonuses";
import { Anchor } from "./Anchor";
import { Offer } from "./Offer";
import { Guarantee } from "./Guarantee";
import { Faq } from "./Faq";
import { Objections } from "./Objections";
import { StickyCta } from "./StickyCta";
import { Footer } from "./Footer";

// Sequência de copy definida no briefing: contexto → problema → nova visão →
// mecanismo → solução (pilares) → entregáveis → prova → oferta → redução de
// risco → CTA. Cada seção é isolada e lê o conteúdo editável de
// src/lib/lucro2x/config.ts — reordenar ou remover uma seção aqui não
// quebra nenhuma outra.
export function Lucro2xPage() {
  return (
    <div className="min-h-screen">
      <Hero />
      <EventContext />
      <Problem />
      <Mechanism />
      <Pillars />
      <MidCta
        headline="Pronto para transformar essa visão em execução?"
        location="mid_pilares"
        label="Quero entrar"
      />
      <Profit />
      <Wealth />
      <Deliverables />
      <Bonuses />
      <Anchor />
      <Offer />
      <Guarantee />
      <Faq />
      <Objections />
      <MidCta
        headline="Transforme lucro em patrimônio, com estrutura."
        location="final"
        label="Quero transformar lucro em patrimônio"
      />
      <Footer />
      <StickyCta />
    </div>
  );
}

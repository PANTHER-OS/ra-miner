import { motion } from "framer-motion";
import { pricing } from "@/lib/lucro2x/config";
import { formatBRL } from "@/lib/lucro2x/format";
import { CtaButton } from "./CtaButton";

// Barra fixa no rodapé, só em telas pequenas — a maior parte do tráfego
// chega pelo link do WhatsApp, então o CTA precisa estar sempre acessível
// sem depender de rolar até a seção de oferta.
export function StickyCta() {
  return (
    <motion.div
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-4 py-3 backdrop-blur-md sm:hidden"
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.6, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="leading-tight">
          <p className="text-[11px] text-muted-foreground">Condição de lançamento</p>
          <p className="text-sm font-semibold text-foreground">
            {formatBRL(pricing.fullPriceCents)}
          </p>
        </div>
        <CtaButton location="sticky_mobile" size="default" className="px-5 py-3 text-sm">
          Entrar agora
        </CtaButton>
      </div>
    </motion.div>
  );
}

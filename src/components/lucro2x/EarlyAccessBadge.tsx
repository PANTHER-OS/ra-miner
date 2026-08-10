import { motion } from "framer-motion";
import { eventInfo } from "@/lib/lucro2x/config";

// Badge de topo do hero — lidera com o que isso realmente é (acesso
// antecipado), não com a logística do evento. O ponto pulsando é a única
// animação em loop da página (o resto é só entrada) — dá vida sem cansar.
export function EarlyAccessBadge() {
  return (
    <span className="inline-flex max-w-full flex-wrap items-center gap-x-2 gap-y-1 rounded-full border border-primary/30 bg-primary/10 py-1.5 pl-2.5 pr-3.5">
      <span className="inline-flex shrink-0 items-center gap-2">
        <span className="relative flex h-2 w-2">
          <motion.span
            className="absolute inset-0 rounded-full bg-primary"
            animate={{ scale: [1, 2.2], opacity: [0.6, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
          />
          <span className="relative h-2 w-2 rounded-full bg-primary" />
        </span>
        <span className="whitespace-nowrap text-xs font-semibold uppercase tracking-wider text-primary">
          Acesso antecipado
        </span>
      </span>
      <span className="hidden text-xs text-muted-foreground sm:inline">
        · exclusivo pra quem acompanhou a live de {eventInfo.liveLabel}
      </span>
    </span>
  );
}

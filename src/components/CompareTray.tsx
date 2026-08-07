import { motion, AnimatePresence } from "framer-motion";
import { GitCompare, X } from "lucide-react";
import type { Country } from "@/lib/countries";
import { getPtName } from "@/lib/countries";

interface Props {
  countries: Country[];
  onOpen: () => void;
  onRemove: (cca2: string) => void;
  onClear: () => void;
}

// Barra flutuante que junta os países marcados pra comparar (botão de
// balança no CountryPanel) — só aparece com pelo menos 1 selecionado, e
// "Comparar" só habilita com 2+ (comparar 1 país sozinho não faz sentido).
// Fica em cima de tudo (z-[70]) menos o próprio CompareView (z-[80]), pra
// nunca ficar escondida atrás do painel de país.
export function CompareTray({ countries, onOpen, onRemove, onClear }: Props) {
  return (
    <AnimatePresence>
      {countries.length > 0 && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
          className="fixed inset-x-0 bottom-4 z-[70] flex justify-center px-4"
        >
          <div className="flex items-center gap-3 rounded-full border border-border bg-surface-elevated/95 py-2 pl-2 pr-3 shadow-panel backdrop-blur-xl">
            <div className="flex items-center -space-x-2">
              {countries.map((c) => (
                <button
                  key={c.cca2}
                  onClick={() => onRemove(c.cca2)}
                  title={`Remover ${getPtName(c)} da comparação`}
                  className="group relative grid h-9 w-9 place-items-center overflow-hidden rounded-full border-2 border-surface-elevated bg-surface shadow-sm transition hover:z-10 hover:scale-105"
                >
                  <img
                    src={c.flags.png}
                    alt=""
                    className="h-full w-full object-cover transition group-hover:opacity-30"
                  />
                  <X className="absolute h-3.5 w-3.5 text-foreground opacity-0 transition group-hover:opacity-100" />
                </button>
              ))}
              {Array.from({ length: 3 - countries.length }).map((_, i) => (
                <span
                  key={i}
                  className="grid h-9 w-9 place-items-center rounded-full border-2 border-dashed border-border bg-surface/40 text-[10px] text-muted-foreground/50"
                >
                  +
                </span>
              ))}
            </div>

            <button
              onClick={onOpen}
              disabled={countries.length < 2}
              className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-glow transition enabled:hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <GitCompare className="h-3.5 w-3.5" />
              Comparar {countries.length > 1 ? `(${countries.length})` : ""}
            </button>

            <button
              onClick={onClear}
              aria-label="Limpar comparação"
              className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-muted-foreground transition hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

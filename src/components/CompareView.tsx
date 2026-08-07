import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, GitCompare, X } from "lucide-react";
import type { Country } from "@/lib/countries";
import {
  formatPopulation,
  getPtName,
  getRegionPt,
  getSubregionPt,
  translateCurrency,
  translateLanguage,
} from "@/lib/countries";
import { localTimeFor } from "@/lib/sensory";

interface Props {
  open: boolean;
  countries: Country[];
  onClose: () => void;
  onRemove: (cca2: string) => void;
  onOpenCountry: (c: Country) => void;
}

interface Row {
  label: string;
  render: (c: Country, now: Date) => React.ReactNode;
}

// Cada linha é uma função — em vez de pré-computar um objeto "linha x
// país", deixa o dado sempre fresco (hora local batendo o segundo) sem
// precisar recalcular a tabela inteira a cada tick, só o que depende de
// `now`.
const ROWS: Row[] = [
  {
    label: "Capital",
    render: (c) => c.capital?.[0] ?? "—",
  },
  {
    label: "População",
    render: (c) => formatPopulation(c.population),
  },
  {
    label: "Área",
    render: (c) => (c.area ? `${formatPopulation(Math.round(c.area))} km²` : "—"),
  },
  {
    label: "Densidade",
    render: (c) =>
      c.area && c.area > 0
        ? `${formatPopulation(Math.round(c.population / c.area))} hab/km²`
        : "—",
  },
  {
    label: "Idioma(s)",
    render: (c) =>
      c.languages ? Object.values(c.languages).map(translateLanguage).join(", ") : "—",
  },
  {
    label: "Moeda",
    render: (c) =>
      c.currencies
        ? Object.values(c.currencies)
            .map((cur) => `${translateCurrency(cur.name)}${cur.symbol ? ` (${cur.symbol})` : ""}`)
            .join(", ")
        : "—",
  },
  {
    label: "Hora local",
    render: (c, now) => {
      const t = localTimeFor(c.timezone, now);
      return t ? (
        <span className="font-mono tabular-nums">
          {t.hh}:{t.mm} <span className="text-[10px] text-muted-foreground">{t.label}</span>
        </span>
      ) : (
        "—"
      );
    },
  },
];

// Painel de comparação lado a lado — aberto pela CompareTray depois que o
// usuário marca 2-3 países (botão de balança no CountryPanel). Mesma família
// visual do TravelQuiz (modal full-bleed no mobile, centralizado no
// desktop), mas em tabela em vez de cards, porque comparar É basicamente
// ler colunas alinhadas.
export function CompareView({ open, countries, onClose, onRemove, onOpenCountry }: Props) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    if (!open) return;
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, [open]);

  return (
    <AnimatePresence>
      {open && countries.length > 0 && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-end justify-center bg-black/75 backdrop-blur-md sm:items-center sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            initial={{ y: 48, opacity: 0, scale: 0.97 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 48, opacity: 0, scale: 0.97 }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className="relative flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl border border-border bg-surface shadow-2xl sm:rounded-3xl"
          >
            <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
              <div className="flex items-center gap-2.5">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/15 text-primary shadow-glow">
                  <GitCompare className="h-4 w-4" />
                </span>
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    Lado a lado
                  </div>
                  <div className="text-sm font-semibold text-foreground">
                    Comparando {countries.length} países
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="grid h-9 w-9 place-items-center rounded-full border border-border text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
                aria-label="Fechar comparação"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-auto px-5 py-5">
              <div className="min-w-[560px]">
                {/* Cabeçalho: bandeira + nome de cada país, com botão de remover */}
                <div
                  className="grid gap-2"
                  style={{ gridTemplateColumns: `120px repeat(${countries.length}, 1fr)` }}
                >
                  <div />
                  {countries.map((c) => (
                    <div key={c.cca2} className="relative rounded-2xl border border-border bg-surface/50 p-3 text-center">
                      <button
                        onClick={() => onRemove(c.cca2)}
                        aria-label={`Remover ${getPtName(c)}`}
                        className="absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full text-muted-foreground/70 transition hover:bg-background/60 hover:text-foreground"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                      <img
                        src={c.flags.png}
                        alt={c.flags.alt ?? ""}
                        className="mx-auto h-10 w-14 rounded object-cover ring-1 ring-border"
                      />
                      <div className="mt-2 truncate text-sm font-semibold text-foreground">
                        {getPtName(c)}
                      </div>
                      <div className="truncate text-[10px] uppercase tracking-wide text-muted-foreground">
                        {getSubregionPt(c.subregion) ?? getRegionPt(c.region)}
                      </div>
                      <button
                        onClick={() => onOpenCountry(c)}
                        className="mt-2 text-[11px] font-medium text-primary/80 transition hover:text-primary"
                      >
                        Ver perfil completo →
                      </button>
                    </div>
                  ))}
                </div>

                {/* Linhas de atributos */}
                <div className="mt-3 flex flex-col gap-1.5">
                  {ROWS.map((row) => (
                    <div
                      key={row.label}
                      className="grid items-center gap-2"
                      style={{ gridTemplateColumns: `120px repeat(${countries.length}, 1fr)` }}
                    >
                      <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
                        {row.label === "Hora local" && <Clock className="h-3 w-3 text-primary/70" />}
                        {row.label}
                      </div>
                      {countries.map((c) => (
                        <div
                          key={c.cca2}
                          className="rounded-lg border border-border/60 bg-background/40 px-2.5 py-2 text-center text-xs font-medium text-foreground"
                        >
                          {row.render(c, now)}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

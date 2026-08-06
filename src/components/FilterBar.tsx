import { motion } from "framer-motion";

/** Modo de visualização do passaporte aplicado ao mapa. */
export type ViewMode = "all" | "visited" | "wishlist" | "unmarked";

const REGIONS = [
  { key: "all", label: "Todos" },
  { key: "Americas", label: "Américas" },
  { key: "Europe", label: "Europa" },
  { key: "Africa", label: "África" },
  { key: "Asia", label: "Ásia" },
  { key: "Oceania", label: "Oceania" },
];

const VIEWS: { key: ViewMode; label: string }[] = [
  { key: "all", label: "Tudo" },
  { key: "visited", label: "Visitei" },
  { key: "wishlist", label: "Quero ir" },
  { key: "unmarked", label: "Falta" },
];

interface Props {
  region: string;
  onRegion: (r: string) => void;
  view: ViewMode;
  onView: (v: ViewMode) => void;
}

export function FilterBar({ region, onRegion, view, onView }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
      <div className="flex flex-wrap items-center gap-1.5">
        {REGIONS.map((r) => {
          const active = region === r.key;
          return (
            <button
              key={r.key}
              onClick={() => onRegion(r.key)}
              className={`relative rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                active ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {active && (
                <motion.span
                  layoutId="region-pill"
                  className="absolute inset-0 rounded-full bg-primary"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative">{r.label}</span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2 text-xs">
        <span className="text-muted-foreground">Destacar:</span>
        <div className="flex items-center gap-1 rounded-full border border-border bg-surface/60 p-1 backdrop-blur">
          {VIEWS.map((s) => {
            const active = view === s.key;
            return (
              <button
                key={s.key}
                onClick={() => onView(s.key)}
                className={`relative rounded-full px-3 py-1 font-medium transition-colors ${
                  active ? "text-background" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="view-pill"
                    className="absolute inset-0 rounded-full bg-foreground"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative">{s.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

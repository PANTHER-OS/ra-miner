import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n/context";
import type { Translations } from "@/lib/i18n/translations";

/** Modo de visualização do passaporte aplicado ao mapa. */
export type ViewMode = "all" | "visited" | "wishlist" | "unmarked";

const REGIONS: { key: string; labelKey: keyof Translations }[] = [
  { key: "all", labelKey: "filterAll" },
  { key: "Americas", labelKey: "filterAmericas" },
  { key: "Europe", labelKey: "filterEurope" },
  { key: "Africa", labelKey: "filterAfrica" },
  { key: "Asia", labelKey: "filterAsia" },
  { key: "Oceania", labelKey: "filterOceania" },
];

const VIEWS: { key: ViewMode; labelKey: keyof Translations }[] = [
  { key: "all", labelKey: "viewAll" },
  { key: "visited", labelKey: "viewVisited" },
  { key: "wishlist", labelKey: "viewWishlist" },
  { key: "unmarked", labelKey: "viewUnmarked" },
];

interface Props {
  region: string;
  onRegion: (r: string) => void;
  view: ViewMode;
  onView: (v: ViewMode) => void;
}

export function FilterBar({ region, onRegion, view, onView }: Props) {
  const { t } = useI18n();
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
              <span className="relative">{t(r.labelKey)}</span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2 text-xs">
        <span className="text-muted-foreground">{t("filterHighlight")}</span>
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
                <span className="relative">{t(s.labelKey)}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MapPin, ExternalLink, Loader2, Compass, BookOpen } from "lucide-react";
import type { Country } from "@/lib/countries";
import { getPtName } from "@/lib/countries";
import type { CityEntry } from "@/lib/cities";
import { formatCityPop } from "@/lib/cities";
import { fetchAttractions, type Attraction } from "@/lib/attractions";

interface Props {
  city: CityEntry | null;
  country: Country | null;
  onClose: () => void;
}

export function CityPanel({ city, country, onClose }: Props) {
  const [attractions, setAttractions] = useState<Attraction[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!city) return;
    let cancelled = false;
    setAttractions(null);
    setError(false);
    fetchAttractions(city.lat, city.lng)
      .then((data) => {
        if (!cancelled) setAttractions(data);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [city]);

  useEffect(() => {
    if (!city) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [city, onClose]);

  return (
    <AnimatePresence>
      {city && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={onClose}
            className="fixed inset-0 z-[55] bg-background/70 backdrop-blur-sm"
            aria-hidden
          />

          <motion.aside
            key={`${city.name}-${city.lat}`}
            initial={{ x: "100%", opacity: 0.5 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 32 }}
            className="fixed inset-x-0 bottom-0 top-auto z-[56] flex max-h-[88vh] flex-col overflow-hidden rounded-t-3xl border-t border-border bg-surface-elevated/95 shadow-panel backdrop-blur-xl sm:inset-y-0 sm:right-0 sm:left-auto sm:top-0 sm:h-full sm:max-h-none sm:w-full sm:max-w-md sm:rounded-l-3xl sm:rounded-tr-none sm:border-l sm:border-t-0"
            role="dialog"
            aria-labelledby="city-panel-title"
          >
            {/* Cabeçalho */}
            <div className="relative overflow-hidden border-b border-border/70 px-5 pb-5 pt-6">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    "radial-gradient(ellipse 90% 70% at 20% -10%, oklch(0.82 0.14 78 / 0.14), transparent 60%)",
                }}
              />
              <button
                onClick={onClose}
                aria-label="Fechar painel da cidade"
                className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full border border-border bg-surface/80 text-muted-foreground backdrop-blur transition-colors hover:border-primary/50 hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="relative flex items-center gap-2.5">
                {country && (
                  <img
                    src={country.flags.svg}
                    alt=""
                    className="h-5 w-7 shrink-0 rounded-sm object-cover ring-1 ring-border"
                  />
                )}
                <p className="truncate text-[11px] uppercase tracking-[0.18em] text-primary/90">
                  {country ? getPtName(country) : "Cidade"}
                  {city.capital ? " · capital" : ""}
                </p>
              </div>
              <h2
                id="city-panel-title"
                className="relative mt-1 text-3xl font-semibold leading-tight text-foreground sm:text-4xl"
              >
                {city.name}
              </h2>
              <p className="relative mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 text-primary/80" />
                {formatCityPop(city.pop)} habitantes · {city.lat.toFixed(2)}°, {city.lng.toFixed(2)}°
              </p>
            </div>

            {/* Conteúdo */}
            <div className="flex-1 overflow-y-auto px-5 pb-8 pt-4">
              <header className="mb-3 flex items-center gap-2">
                <Compass className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Principais atrações
                </h3>
              </header>

              {attractions === null && !error && (
                <div className="flex flex-col items-center gap-3 py-10 text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span className="text-xs">Buscando o que há de melhor por perto...</span>
                </div>
              )}

              {error && (
                <p className="rounded-xl border border-border bg-surface/40 p-4 text-sm text-muted-foreground">
                  Não deu pra carregar as atrações agora. Tente novamente em instantes.
                </p>
              )}

              {attractions !== null && attractions.length === 0 && !error && (
                <p className="rounded-xl border border-border bg-surface/40 p-4 text-sm text-muted-foreground">
                  Ainda não há pontos turísticos catalogados por perto na Wikipédia.
                </p>
              )}

              {attractions && attractions.length > 0 && (
                <ul className="space-y-2.5">
                  {attractions.map((a, i) => (
                    <motion.li
                      key={a.url}
                      initial={{ opacity: 0, x: 14 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.04 + i * 0.045, duration: 0.35 }}
                    >
                      <a
                        href={a.url}
                        target="_blank"
                        rel="noreferrer"
                        className="group flex gap-3 rounded-xl border border-border bg-surface/40 p-3 transition-colors hover:border-primary/50 hover:bg-surface/70"
                      >
                        {a.thumbnail ? (
                          <img
                            src={a.thumbnail}
                            alt=""
                            loading="lazy"
                            className="h-16 w-16 shrink-0 rounded-lg object-cover ring-1 ring-border"
                          />
                        ) : (
                          <span className="grid h-16 w-16 shrink-0 place-items-center rounded-lg bg-muted/50 ring-1 ring-border">
                            <Compass className="h-5 w-5 text-muted-foreground/60" />
                          </span>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <h4 className="truncate text-sm font-medium text-foreground group-hover:text-primary">
                              {a.title}
                            </h4>
                            <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground/60" />
                          </div>
                          {a.extract && (
                            <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                              {a.extract}
                            </p>
                          )}
                          <p className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground/60">
                            {a.distanceKm < 1
                              ? `${Math.round(a.distanceKm * 1000)} m do centro`
                              : `${a.distanceKm.toFixed(1)} km do centro`}
                            {a.lang === "en" ? " · via Wikipédia (EN)" : ""}
                          </p>
                        </div>
                      </a>
                    </motion.li>
                  ))}
                </ul>
              )}

              {attractions && attractions.length > 0 && (
                <p className="mt-4 flex items-center gap-1.5 text-[10px] text-muted-foreground/60">
                  <BookOpen className="h-3 w-3" />
                  Dados ao vivo da Wikipédia, por proximidade geográfica.
                </p>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

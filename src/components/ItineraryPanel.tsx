import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, MapPin, Lightbulb, Route } from "lucide-react";
import type { Country } from "@/lib/countries";
import { getItinerary, type ItineraryStop } from "@/lib/itinerary";

const PERIOD_EMOJI: Record<ItineraryStop["period"], string> = {
  amanhecer: "🌅",
  manha: "☀️",
  almoco: "🍽️",
  tarde: "🌤️",
  entardecer: "🌇",
  jantar: "🍷",
  noite: "🌙",
};

export function ItineraryPanel({ country }: { country: Country }) {
  const itinerary = getItinerary(country);
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <section className="mt-5">
      <header className="mb-3 flex items-center gap-2">
        <Route className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Roteiro de 24 horas
        </h3>
      </header>

      <div className="mb-3 rounded-xl border border-primary/20 bg-primary/5 p-3">
        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.14em] text-primary/90">
          <MapPin className="h-3 w-3" />
          {itinerary.city}
          {!itinerary.curated && (
            <span className="ml-auto rounded-full bg-muted/40 px-2 py-0.5 text-[9px] normal-case tracking-normal text-muted-foreground">
              sugestão
            </span>
          )}
        </div>
        <p className="mt-1 text-xs leading-relaxed text-foreground/85">
          {itinerary.intro}
        </p>
      </div>

      <ol className="relative space-y-1.5 border-l border-border/60 pl-4">
        {itinerary.stops.map((stop, i) => {
          const isOpen = openIdx === i;
          return (
            <li key={i} className="relative">
              <span className="absolute -left-[21px] top-2 grid h-3 w-3 place-items-center rounded-full border-2 border-background bg-primary shadow-glow" />

              <button
                onClick={() => setOpenIdx(isOpen ? null : i)}
                className={`w-full rounded-xl border p-3 text-left transition-all ${
                  isOpen
                    ? "border-primary/50 bg-primary/10"
                    : "border-border bg-surface/40 hover:border-primary/30"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base leading-none">{PERIOD_EMOJI[stop.period]}</span>
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold tabular-nums text-primary">
                    <Clock className="h-3 w-3" />
                    {stop.time}
                  </div>
                  <div className="ml-auto text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                    {stop.period}
                  </div>
                </div>
                <div className="mt-1.5 text-sm font-medium text-foreground">
                  {stop.title}
                </div>
                <div className="mt-0.5 text-xs text-primary/90">
                  {stop.place}
                </div>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: [0.2, 0.8, 0.2, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="pt-2.5">
                        {stop.where && (
                          <div className="mb-1.5 flex items-start gap-1.5 text-[11px] text-muted-foreground">
                            <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
                            <span>{stop.where}</span>
                          </div>
                        )}
                        <p className="text-xs leading-relaxed text-foreground/85">
                          {stop.why}
                        </p>
                        {stop.tip && (
                          <div className="mt-2 flex items-start gap-1.5 rounded-lg border border-primary/20 bg-primary/5 p-2 text-[11px] leading-relaxed text-foreground/85">
                            <Lightbulb className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
                            <span>
                              <span className="font-semibold text-primary">Dica: </span>
                              {stop.tip}
                            </span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

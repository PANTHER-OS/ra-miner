import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MapPin, Users, Landmark, Languages, Coins, Sparkles, Plane, MapPinned, ShieldAlert, Compass, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import type { Country } from "@/lib/countries";
import { formatPopulation, getPtName, getPtOfficialName, getRegionPt, getSubregionPt, translateCurrency, translateLanguage } from "@/lib/countries";
import { getCuriosities } from "@/lib/curiosities";
import { toggleStatus, usePassport } from "@/lib/passport";
import { getCitiesForCountry, formatCityPop, type CityEntry } from "@/lib/cities";
import { SensoryPanel } from "./SensoryPanel";
import { ItineraryPanel } from "./ItineraryPanel";
import { PhrasebookPanel } from "./PhrasebookPanel";
import { StampPanel } from "./StampPanel";
import { HoldToConfirm } from "./HoldToConfirm";



interface Props {
  country: Country | null;
  onClose: () => void;
  onOpenCity?: (city: CityEntry) => void;
}

export function CountryPanel({ country, onClose, onOpenCity }: Props) {
  const passport = usePassport();
  const [confirmUnverify, setConfirmUnverify] = useState(false);

  useEffect(() => {
    setConfirmUnverify(false);
  }, [country?.cca2]);

  const status: "visited" | "wishlist" | "none" = !country
    ? "none"
    : passport.visited.includes(country.cca2)
    ? "visited"
    : passport.wishlist.includes(country.cca2)
    ? "wishlist"
    : "none";

  useEffect(() => {
    if (!country) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [country]);

  useEffect(() => {
    if (!country) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [country, onClose]);

  const applyToggle = (target: "visited" | "wishlist") => {
    if (!country) return;
    const wasVerified = Boolean(passport.stamps?.[country.cca2]);
    const next = toggleStatus(country.cca2, target);
    const name = getPtName(country);
    if (next === "visited") {
      toast.success(`${name} carimbado no passaporte`, {
        description: "Adicionado à sua coleção de países visitados.",
      });
    } else if (next === "wishlist") {
      toast(`${name} salvo na sua lista`, {
        description: "Um novo destino esperando você.",
      });
    } else {
      toast(`${name} removido`, {
        description: wasVerified
          ? "O carimbo verificado por GPS também foi apagado."
          : "Sem marcação no seu passaporte.",
      });
    }
  };

  const handleToggle = (target: "visited" | "wishlist") => {
    if (!country) return;
    const isVerified = Boolean(passport.stamps?.[country.cca2]);
    // Desmarcar um país com carimbo verificado apaga a prova de GPS: pede confirmação.
    if (target === "visited" && status === "visited" && isVerified) {
      setConfirmUnverify(true);
      return;
    }
    applyToggle(target);
  };


  return (
    <AnimatePresence>
      {country && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-background/70 backdrop-blur-sm"
            aria-hidden
          />

          {/* Panel */}
          <motion.aside
            key={country.cca2}
            initial={{ x: "100%", opacity: 0.5 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 30 }}
            className="fixed inset-x-0 bottom-0 top-auto z-50 flex max-h-[92vh] flex-col overflow-hidden rounded-t-3xl border-t border-border bg-surface-elevated/95 shadow-panel backdrop-blur-xl sm:inset-y-0 sm:right-0 sm:left-auto sm:top-0 sm:h-full sm:max-h-none sm:w-full sm:max-w-md sm:rounded-l-3xl sm:rounded-tr-none sm:border-l sm:border-t-0"
            role="dialog"
            aria-labelledby="country-panel-title"
          >
            {/* Hero: flag */}
            <div className="relative">
              <div className="relative h-40 overflow-hidden sm:h-52">
                <motion.img
                  key={country.flags.svg}
                  src={country.flags.svg}
                  alt={country.flags.alt ?? `Bandeira de ${getPtName(country)}`}
                  initial={{ scale: 1.15, filter: "blur(8px)" }}
                  animate={{ scale: 1.02, filter: "blur(0px)" }}
                  transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-surface-elevated via-surface-elevated/60 to-transparent" />
              </div>

              <button
                onClick={onClose}
                aria-label="Fechar painel"
                className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full border border-border bg-surface/80 text-muted-foreground backdrop-blur transition-colors hover:border-primary/50 hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="absolute left-3 top-3 flex gap-1.5">
                <button
                  onClick={() => handleToggle("visited")}
                  aria-label={status === "visited" ? "Remover de visitados" : "Marcar como visitado"}
                  className={`group grid h-9 w-9 place-items-center rounded-full border backdrop-blur transition-all ${
                    status === "visited"
                      ? "border-primary/70 bg-primary text-primary-foreground shadow-glow"
                      : "border-border bg-surface/80 text-muted-foreground hover:border-primary/50 hover:text-primary"
                  }`}
                  title="Já visitei"
                >
                  <Plane className={`h-4 w-4 transition-transform ${status === "visited" ? "scale-110" : "group-hover:-rotate-12"}`} />
                </button>
                <button
                  onClick={() => handleToggle("wishlist")}
                  aria-label={status === "wishlist" ? "Remover da lista" : "Adicionar à lista de desejos"}
                  className={`grid h-9 w-9 place-items-center rounded-full border backdrop-blur transition-all ${
                    status === "wishlist"
                      ? "border-primary/60 bg-primary/25 text-primary shadow-glow"
                      : "border-border bg-surface/80 text-muted-foreground hover:border-primary/50 hover:text-primary"
                  }`}
                  title="Quero visitar"
                >
                  <MapPinned className={`h-4 w-4 ${status === "wishlist" ? "fill-current" : ""}`} />
                </button>
              </div>

              <div className="absolute inset-x-5 bottom-3">
                <p className="text-[11px] uppercase tracking-[0.18em] text-primary/90">
                  {getRegionPt(country.region)}
                  {country.subregion ? ` · ${getSubregionPt(country.subregion)}` : ""}
                </p>
                <h2
                  id="country-panel-title"
                  className="mt-1 text-3xl font-semibold leading-tight text-foreground sm:text-4xl"
                >
                  {getPtName(country)}
                </h2>
                <p className="mt-0.5 text-xs italic text-muted-foreground line-clamp-1">
                  {getPtOfficialName(country)}
                </p>
              </div>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-5 pb-8 pt-4">
              {/* Facts grid */}
              <ul className="grid grid-cols-2 gap-2">
                <Fact
                  icon={<Landmark className="h-4 w-4" />}
                  label="Capital"
                  value={country.capital?.[0] ?? "—"}
                />
                <Fact
                  icon={<Users className="h-4 w-4" />}
                  label="População"
                  value={formatPopulation(country.population)}
                />
                <Fact
                  icon={<Languages className="h-4 w-4" />}
                  label="Idioma(s)"
                  value={
                    country.languages
                      ? Object.values(country.languages).slice(0, 3).map(translateLanguage).join(", ")
                      : "—"
                  }
                />
                <Fact
                  icon={<Coins className="h-4 w-4" />}
                  label="Moeda"
                  value={
                    country.currencies
                      ? Object.values(country.currencies)
                          .map((c) => `${translateCurrency(c.name)}${c.symbol ? ` (${c.symbol})` : ""}`)
                          .join(", ")
                      : "—"
                  }
                />
                {country.latlng && (
                  <Fact
                    icon={<MapPin className="h-4 w-4" />}
                    label="Localização"
                    value={`${country.latlng[0].toFixed(1)}°, ${country.latlng[1].toFixed(1)}°`}
                    className="col-span-2"
                  />
                )}
              </ul>

              {/* Vitrine sensorial */}
              <SensoryPanel country={country} />

              {/* Carimbo verificado por GPS */}
              <StampPanel country={country} />



              {/* Roteiro de 24h */}
              <ItineraryPanel country={country} />

              {/* Aprenda uma frase */}
              <PhrasebookPanel country={country} />

              {/* Principais cidades */}
              {onOpenCity && getCitiesForCountry(country.cca2).length > 0 && (
                <section className="mt-5">
                  <header className="mb-3 flex items-center gap-2">
                    <Compass className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      Principais cidades
                    </h3>
                  </header>
                  <ul className="space-y-2">
                    {getCitiesForCountry(country.cca2).map((city, i) => (
                      <motion.li
                        key={city.name}
                        initial={{ opacity: 0, x: 14 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.05 + i * 0.04, duration: 0.35 }}
                      >
                        <button
                          onClick={() => onOpenCity(city)}
                          className="group flex w-full items-center gap-3 rounded-xl border border-border bg-surface/40 p-3 text-left transition-colors hover:border-primary/50 hover:bg-surface/70"
                        >
                          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/15 text-primary">
                            <MapPin className="h-4 w-4" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-1.5">
                              <span className="truncate text-sm font-medium text-foreground group-hover:text-primary">
                                {city.name}
                              </span>
                              {city.capital && (
                                <span className="rounded-full bg-primary/15 px-1.5 py-0 text-[9px] font-semibold uppercase tracking-wide text-primary">
                                  capital
                                </span>
                              )}
                            </span>
                            <span className="block text-xs text-muted-foreground">
                              {formatCityPop(city.pop)} habitantes · ver atrações
                            </span>
                          </span>
                          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                        </button>
                      </motion.li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Curiosities */}
              <section className="mt-5">
                <header className="mb-3 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Curiosidades & destaques
                  </h3>
                </header>
                <ul className="space-y-2.5">
                  {getCuriosities(country).map((f, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: 14 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05 + i * 0.05, duration: 0.4 }}
                      className="relative rounded-xl border border-border bg-surface/40 p-3 pl-9 text-sm leading-relaxed text-foreground/90"
                    >
                      <span className="absolute left-3 top-3.5 grid h-4 w-4 place-items-center rounded-full bg-primary/20 text-[10px] font-bold text-primary">
                        {i + 1}
                      </span>
                      {f}
                    </motion.li>
                  ))}
                </ul>
              </section>
            </div>
          </motion.aside>

          {/* Confirmação: desmarcar visitado apaga o carimbo verificado */}
          <AnimatePresence>
            {confirmUnverify && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[60] grid place-items-center bg-background/80 p-5 backdrop-blur-sm"
                onClick={() => setConfirmUnverify(false)}
                role="alertdialog"
                aria-modal="true"
              >
                <motion.div
                  initial={{ scale: 0.94, y: 12, opacity: 0 }}
                  animate={{ scale: 1, y: 0, opacity: 1 }}
                  exit={{ scale: 0.96, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 26 }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full max-w-sm rounded-2xl border border-destructive/40 bg-surface-elevated p-5 shadow-panel"
                >
                  <div className="flex items-start gap-3">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-destructive/50 bg-destructive/15 text-destructive">
                      <ShieldAlert className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-semibold text-foreground">
                        Apagar {getPtName(country)} do passaporte?
                      </h4>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                        Este país tem um <span className="font-semibold text-primary">carimbo verificado por GPS</span>.
                        Ao desmarcar, a prova de presença, a data e a anotação do diário são apagadas
                        para sempre.
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <HoldToConfirm
                      label="Segure para apagar tudo"
                      holdingLabel="Continue segurando…"
                      doneLabel="Apagado"
                      duration={1600}
                      onConfirm={() => {
                        applyToggle("visited");
                        setTimeout(() => setConfirmUnverify(false), 450);
                      }}
                    />
                    <button
                      onClick={() => setConfirmUnverify(false)}
                      className="w-full rounded-xl border border-border bg-surface/50 py-2.5 text-xs font-semibold text-foreground/85 transition-colors hover:border-primary/50 hover:text-primary"
                    >
                      Manter meu carimbo
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

    </AnimatePresence>
  );
}

function Fact({
  icon,
  label,
  value,
  className,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <li
      className={`rounded-xl border border-border bg-surface/40 p-3 ${className ?? ""}`}
    >
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
        <span className="text-primary/80">{icon}</span>
        {label}
      </div>
      <div className="mt-1 text-sm font-medium text-foreground line-clamp-2">
        {value}
      </div>
    </li>
  );
}

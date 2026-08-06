import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import { Toaster } from "sonner";
import { motion } from "framer-motion";
import { Globe2, Compass } from "lucide-react";

import { fetchCountries, getPtName } from "@/lib/countries";
import type { Country } from "@/lib/countries";
import { WorldMap } from "@/components/WorldMap";
import { SearchBar } from "@/components/SearchBar";
import { FilterBar, type ViewMode } from "@/components/FilterBar";
import { CountryPanel } from "@/components/CountryPanel";
import { MapSkeleton } from "@/components/CountrySkeleton";
import { TravelQuiz } from "@/components/TravelQuiz";
import { PassportStats } from "@/components/PassportStats";
import { usePassport } from "@/lib/passport";
import type { PassportStatus } from "@/lib/passport";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const { data: countries, isLoading } = useQuery({
    queryKey: ["countries"],
    queryFn: fetchCountries,
    staleTime: 1000 * 60 * 60,
  });

  const [selected, setSelected] = useState<Country | null>(null);
  const [region, setRegion] = useState("all");
  const [view, setView] = useState<ViewMode>("all");
  const [quizOpen, setQuizOpen] = useState(false);
  const passport = usePassport();

  const verifiedSet = useMemo(
    () => new Set(Object.keys(passport.stamps ?? {})),
    [passport],
  );

  const statusMap = useMemo(() => {

    const m = new Map<string, PassportStatus>();
    for (const code of passport.visited) m.set(code, "visited");
    for (const code of passport.wishlist) if (!m.has(code)) m.set(code, "wishlist");
    return m;
  }, [passport]);

  // Referência estável: evita que o mapa (memoizado) perca o memo e
  // reconstrua tudo sempre que a Home re-renderiza por um motivo que não
  // tem nada a ver com o mapa (abrir o quiz, trocar filtro, etc.).
  const handleSelectCountry = useCallback((c: Country | null) => setSelected(c), []);
  const handleClosePanel = useCallback(() => setSelected(null), []);

  return (
    <div className="min-h-screen">
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: "oklch(0.23 0.025 260)",
            color: "oklch(0.96 0.01 90)",
            border: "1px solid oklch(0.3 0.02 260 / 0.6)",
          },
        }}
      />

      {/* Header */}
      <header className="mx-auto flex max-w-7xl flex-col gap-4 px-4 pt-6 sm:px-8 sm:pt-8 lg:pt-10">
        <div className="flex items-center justify-between gap-4">
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-2.5"
          >
            <span className="grid h-9 w-9 place-items-center rounded-xl border border-border bg-surface/70 text-primary shadow-glow">
              <Globe2 className="h-5 w-5 animate-pulse-glow" />
            </span>
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                Explorador global
              </div>
              <h1 className="text-lg font-semibold leading-tight text-foreground sm:text-xl">
                Mundo em <span className="gold-text">Foco</span>
              </h1>
            </div>
          </motion.div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setQuizOpen(true)}
              className="group flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/20 sm:px-3.5 sm:py-2"
            >
              <Compass className="h-3.5 w-3.5 transition group-hover:rotate-12" />
              <span className="hidden xs:inline">Quiz</span>
              <span className="xs:hidden">Quiz</span>
              <span className="hidden sm:inline">de compatibilidade</span>
            </button>
            <div className="hidden text-right text-xs text-muted-foreground sm:block">
              {countries ? (
                <>
                  <span className="font-semibold text-foreground">{countries.length}</span>{" "}
                  países
                </>
              ) : (
                "carregando..."
              )}
            </div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="max-w-xl"
        >
          <SearchBar
            countries={countries ?? []}
            onPick={handleSelectCountry}
          />
        </motion.div>

        <FilterBar
          region={region}
          onRegion={setRegion}
          view={view}
          onView={setView}
        />
      </header>

      {/* Main */}
      <main className="mx-auto flex max-w-7xl flex-col gap-6 px-4 pb-16 pt-6 sm:px-8 sm:pt-8">
        {countries && <PassportStats countries={countries} />}

        {isLoading || !countries ? (
          <MapSkeleton />
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <WorldMap
              countries={countries}
              selectedCode={selected?.cca2 ?? null}
              onSelect={handleSelectCountry}
              filterRegion={region}
              statusMap={statusMap}
              verifiedSet={verifiedSet}
              viewMode={view}

            />
          </motion.div>
        )}

        <p className="text-center text-xs text-muted-foreground/70">
          Dados abertos de países · seu passaporte fica salvo só neste aparelho
        </p>
      </main>

      <CountryPanel country={selected} onClose={handleClosePanel} />

      <TravelQuiz
        open={quizOpen}
        onClose={() => setQuizOpen(false)}
        countries={countries ?? []}
        onOpenCountry={handleSelectCountry}
      />
    </div>
  );
}

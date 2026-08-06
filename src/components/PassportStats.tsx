import { useMemo } from "react";
import { motion } from "framer-motion";
import { Plane, MapPinned, Compass, Globe, BadgeCheck } from "lucide-react";
import type { Country } from "@/lib/countries";
import { getRegionPt } from "@/lib/countries";
import { computeStats, usePassport } from "@/lib/passport";
import { AnimatedCounter } from "./AnimatedCounter";

interface Props {
  countries: Country[];
}

const HEMI_LABELS: { key: "north" | "south" | "east" | "west"; label: string }[] = [
  { key: "north", label: "N" },
  { key: "south", label: "S" },
  { key: "east", label: "L" },
  { key: "west", label: "O" },
];

export function PassportStats({ countries }: Props) {
  const passport = usePassport();
  const stats = useMemo(() => computeStats(passport, countries), [passport, countries]);

  if (!countries.length) return null;

  const hasAny = stats.visitedCount > 0 || stats.wishlistCount > 0;

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.08 }}
      className="relative overflow-hidden rounded-2xl border border-border bg-surface-elevated/70 p-4 shadow-card backdrop-blur"
      aria-label="Meu passaporte"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(ellipse 60% 80% at 100% 0%, oklch(0.82 0.14 78 / 0.10), transparent 60%)",
        }}
      />

      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary/90">
            <Compass className="h-3 w-3" />
            Meu passaporte
          </div>

          {!hasAny ? (
            <p className="mt-2 text-sm leading-relaxed text-foreground/85">
              Marque países como <span className="font-semibold text-primary">visitados</span> ou{" "}
              <span className="font-semibold text-foreground">quero visitar</span> — o mapa pinta a
              sua história pessoal.
            </p>
          ) : (
            <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <AnimatedCounter
                value={stats.visitedCount}
                className="text-3xl font-bold tabular-nums text-foreground"
              />
              <span className="text-xs text-muted-foreground">
                de {stats.totalCountries} países ·{" "}
                <span className="font-semibold text-primary">
                  {stats.worldPct.toFixed(1)}%
                </span>{" "}
                do mundo
              </span>
              {stats.verifiedCount > 0 && (
                <span className="flex items-center gap-1 rounded-full border border-primary/50 bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">
                  <BadgeCheck className="h-3 w-3" />
                  {stats.verifiedCount} verificado{stats.verifiedCount > 1 ? "s" : ""} por GPS
                </span>
              )}
            </div>

          )}
        </div>

        {hasAny && (
          <div className="hidden shrink-0 items-center gap-3 sm:flex">
            <MiniStat
              icon={<Plane className="h-3 w-3" />}
              value={stats.visitedCount}
              label="visitei"
            />
            <MiniStat
              icon={<MapPinned className="h-3 w-3" />}
              value={stats.wishlistCount}
              label="quero"
            />
          </div>
        )}
      </div>

      {hasAny && (
        <>
          {/* Barra de progresso */}
          <div className="relative mt-3 h-1.5 w-full overflow-hidden rounded-full bg-surface/60">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(stats.worldPct, 100)}%` }}
              transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
              className="h-full rounded-full bg-gradient-to-r from-primary/70 to-primary shadow-glow"
            />
          </div>

          {/* Detalhes */}
          <div className="relative mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Globe className="h-3 w-3 text-primary/80" />
              <span>
                <span className="font-semibold text-foreground">
                  {stats.continentsCompleted}
                </span>
                /{stats.continents.length} continentes completos
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-primary/80">◐</span>
              <span>
                <span className="font-semibold text-foreground">
                  {stats.hemisphereCount}
                </span>
                /4 hemisférios
              </span>
              <div className="ml-1 flex gap-0.5">
                {HEMI_LABELS.map((h) => (
                  <span
                    key={h.key}
                    className={`grid h-4 w-4 place-items-center rounded-full text-[9px] font-bold transition-colors ${
                      stats.hemispheres[h.key]
                        ? "bg-primary/25 text-primary"
                        : "bg-surface/60 text-muted-foreground/50"
                    }`}
                    title={h.label}
                  >
                    {h.label}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {stats.continents.map((c) => {
                const pct = c.total ? (c.visited / c.total) * 100 : 0;
                const done = pct === 100;
                return (
                  <span
                    key={c.name}
                    className={`rounded-full border px-2 py-0.5 text-[10px] transition-colors ${
                      done
                        ? "border-primary/50 bg-primary/15 text-primary"
                        : c.visited > 0
                        ? "border-primary/25 bg-primary/5 text-foreground/85"
                        : "border-border bg-surface/40 text-muted-foreground"
                    }`}
                  >
                    {getRegionPt(c.name)} {c.visited}/{c.total}
                  </span>
                );
              })}
            </div>
          </div>
        </>
      )}
    </motion.section>
  );
}

function MiniStat({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
}) {
  return (
    <div className="flex flex-col items-end">
      <div className="flex items-center gap-1 text-primary">
        {icon}
        <AnimatedCounter
          value={value}
          className="text-base font-semibold tabular-nums text-foreground"
        />
      </div>
      <span className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </span>
    </div>
  );
}

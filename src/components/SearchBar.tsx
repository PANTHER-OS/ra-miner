import { useEffect, useMemo, useRef, useState } from "react";
import Fuse from "fuse.js";
import { Search, X, MapPin, Globe2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import type { Country } from "@/lib/countries";
import { getPtName, getRegionPt } from "@/lib/countries";
import { getAllCities, formatCityMeta, type CityWithCountry } from "@/lib/cities";
import { useI18n } from "@/lib/i18n/context";

interface Props {
  countries: Country[];
  onPick: (c: Country) => void;
  onPickCity?: (city: CityWithCountry, country: Country) => void;
}

type Result =
  | { kind: "country"; country: Country; score: number }
  | { kind: "city"; city: CityWithCountry; country: Country; score: number };

export function SearchBar({ countries, onPick, onPickCity }: Props) {
  const { t } = useI18n();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const countryByCca2 = useMemo(() => {
    const m = new Map<string, Country>();
    for (const c of countries) m.set(c.cca2, c);
    return m;
  }, [countries]);

  // Enrich data with ptName so Fuse indexes it
  const enrichedCountries = useMemo(
    () => countries.map((c) => ({ ...c, ptName: getPtName(c) })),
    [countries],
  );

  const allCities = useMemo(() => getAllCities(), []);

  const results = useMemo<Result[]>(() => {
    const query = q.trim();
    if (!query) return [];

    const countryFuse = new Fuse(enrichedCountries, {
      keys: [
        { name: "ptName", weight: 2 },
        { name: "name.common", weight: 1 },
        { name: "cca2", weight: 0.5 },
        { name: "cca3", weight: 0.5 },
      ],
      threshold: 0.35,
      ignoreLocation: true,
      includeScore: true,
    });
    const cityFuse = new Fuse(allCities, {
      keys: [{ name: "name", weight: 2 }],
      threshold: 0.3,
      ignoreLocation: true,
      includeScore: true,
    });

    const countryHits: Result[] = countryFuse
      .search(query)
      .map((r) => ({ kind: "country" as const, country: r.item, score: r.score ?? 1 }));

    const cityHits: Result[] = cityFuse
      .search(query)
      .map((r): Result | null => {
        const country = countryByCca2.get(r.item.cca2);
        return country
          ? { kind: "city" as const, city: r.item, country, score: (r.score ?? 1) + 0.02 }
          : null;
      })
      .filter((r): r is Result => r !== null);

    return [...countryHits, ...cityHits].sort((a, b) => a.score - b.score).slice(0, 8);
  }, [q, enrichedCountries, allCities, countryByCca2]);

  useEffect(() => {
    setActive(0);
  }, [q]);

  useEffect(() => {
    function onDown(e: Event) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, []);

  const pickResult = (r: Result) => {
    if (r.kind === "country") {
      onPick(r.country);
    } else {
      onPick(r.country);
      onPickCity?.(r.city, r.country);
    }
    setOpen(false);
    setQ("");
    inputRef.current?.blur();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || results.length === 0) {
      if (e.key === "Escape") setOpen(false);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i - 1 + results.length) % results.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const r = results[active] ?? results[0];
      if (r) pickResult(r);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div ref={wrapRef} className="relative w-full">
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          enterKeyHint="search"
          autoComplete="off"
          role="combobox"
          aria-expanded={open && results.length > 0}
          aria-autocomplete="list"
          placeholder={t("searchPlaceholder")}
          className="h-11 w-full rounded-full border border-border bg-surface/70 pl-11 pr-10 text-sm font-medium text-foreground placeholder:text-muted-foreground/70 backdrop-blur transition-all focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-ring"
          aria-label={t("searchAriaLabel")}
        />
        {q && (
          <button
            onClick={() => {
              setQ("");
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label={t("searchClear")}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {open && results.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 mt-2 w-full overflow-hidden rounded-2xl border border-border bg-surface-elevated p-1.5 shadow-panel"
          >
            {results.map((r, i) => {
              const key = r.kind === "country" ? r.country.cca2 : `${r.city.cca2}-${r.city.name}`;
              return (
                <li key={key}>
                  <button
                    onMouseEnter={() => setActive(i)}
                    onClick={() => pickResult(r)}
                    aria-selected={i === active}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                      i === active ? "bg-muted/70" : "hover:bg-muted/60"
                    }`}
                  >
                    {r.kind === "country" ? (
                      <img
                        src={r.country.flags.svg}
                        alt=""
                        className="h-5 w-7 shrink-0 rounded-sm object-cover ring-1 ring-border"
                        loading="lazy"
                      />
                    ) : (
                      <span className="grid h-5 w-7 shrink-0 place-items-center">
                        <MapPin className="h-4 w-4 text-primary" />
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 truncate text-sm font-medium text-foreground">
                        {r.kind === "country" ? getPtName(r.country) : r.city.name}
                        {r.kind === "city" && r.city.capital && (
                          <span className="rounded-full bg-primary/15 px-1.5 py-0 text-[9px] font-semibold uppercase tracking-wide text-primary">
                            capital
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                        {r.kind === "country" ? (
                          <>
                            {r.country.capital?.[0] ?? "—"} · {getRegionPt(r.country.region)}
                          </>
                        ) : (
                          <>
                            <Globe2 className="h-3 w-3 shrink-0" />
                            {getPtName(r.country)} · {formatCityMeta(r.city)}
                          </>
                        )}
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

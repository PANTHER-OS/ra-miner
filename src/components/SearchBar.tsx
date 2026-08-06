import { useEffect, useMemo, useRef, useState } from "react";
import Fuse from "fuse.js";
import { Search, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import type { Country } from "@/lib/countries";
import { getPtName, getRegionPt } from "@/lib/countries";

interface Props {
  countries: Country[];
  onPick: (c: Country) => void;
}

export function SearchBar({ countries, onPick }: Props) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const fuse = useMemo(
    () =>
      new Fuse(countries, {
        keys: [
          { name: "ptName", weight: 2 },
          { name: "name.common", weight: 1.5 },
          { name: "name.official", weight: 0.5 },
          { name: "cca2", weight: 0.5 },
          { name: "cca3", weight: 0.5 },
        ],
        threshold: 0.35,
        ignoreLocation: true,
      }),
    [countries],
  );

  // Enrich data with ptName so Fuse indexes it
  const enriched = useMemo(
    () => countries.map((c) => ({ ...c, ptName: getPtName(c) })),
    [countries],
  );

  const results = useMemo(() => {
    if (!q.trim()) return [];
    const fuseWithPt = new Fuse(enriched, {
      keys: [
        { name: "ptName", weight: 2 },
        { name: "name.common", weight: 1 },
        { name: "cca2", weight: 0.5 },
        { name: "cca3", weight: 0.5 },
      ],
      threshold: 0.35,
      ignoreLocation: true,
    });
    return fuseWithPt.search(q).slice(0, 8).map((r) => r.item);
  }, [q, enriched]);
  void fuse;

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

  const pick = (c: Country) => {
    onPick(c);
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
      const c = results[active] ?? results[0];
      if (c) pick(c);
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
          placeholder="Buscar país..."
          className="h-11 w-full rounded-full border border-border bg-surface/70 pl-11 pr-10 text-sm font-medium text-foreground placeholder:text-muted-foreground/70 backdrop-blur transition-all focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-ring"
          aria-label="Buscar país"
        />
        {q && (
          <button
            onClick={() => {
              setQ("");
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Limpar busca"
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
            {results.map((c, i) => (
              <li key={c.cca2}>
                <button
                  onMouseEnter={() => setActive(i)}
                  onClick={() => pick(c)}
                  aria-selected={i === active}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                    i === active ? "bg-muted/70" : "hover:bg-muted/60"
                  }`}
                >
                  <img
                    src={c.flags.svg}
                    alt=""
                    className="h-5 w-7 rounded-sm object-cover ring-1 ring-border"
                    loading="lazy"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-foreground">
                      {getPtName(c)}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      {c.capital?.[0] ?? "—"} · {getRegionPt(c.region)}
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

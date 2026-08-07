import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPinned, Plane as PlaneIcon, Sparkles, X } from "lucide-react";
import type { Country } from "@/lib/countries";
import { getPtName } from "@/lib/countries";
import {
  groupWishlistIntoTrips,
  setPlan,
  setStatus,
  usePassport,
  type TripGroup,
  type TripPlan,
} from "@/lib/passport";

interface Props {
  open: boolean;
  onClose: () => void;
  countries: Country[];
  onOpenCountry: (c: Country) => void;
}

const MONTHS_PT = [
  "jan", "fev", "mar", "abr", "mai", "jun",
  "jul", "ago", "set", "out", "nov", "dez",
];

function formatIso(iso: string): { day: string; month: string } {
  const [, m, d] = iso.split("-");
  return { day: String(Number(d)), month: MONTHS_PT[Number(m) - 1] };
}

// "10–20 dez" (mesmo mês) ou "28 dez – 3 jan" (vira o mês/ano).
function formatRange(start: string, end: string): string {
  const a = formatIso(start);
  const b = formatIso(end);
  if (start === end) return `${a.day} ${a.month}`;
  if (a.month === b.month) return `${a.day}–${b.day} ${a.month}`;
  return `${a.day} ${a.month} – ${b.day} ${b.month}`;
}

// Lista de desejos vira roteiro: cada país pode ganhar datas e uma nota, e
// países com datas próximas (ver TRIP_GAP_TOLERANCE_DAYS em lib/passport.ts)
// se agrupam sozinhos numa "viagem" — sem precisar criar/nomear nada à
// mão. Mesma família visual dos outros modais (TravelQuiz, CompareView).
export function WishlistPanel({ open, onClose, countries, onOpenCountry }: Props) {
  const passport = usePassport();

  const countryByCode = useMemo(() => {
    const m = new Map<string, Country>();
    for (const c of countries) m.set(c.cca2, c);
    return m;
  }, [countries]);

  const { groups, unplanned } = useMemo(
    () => groupWishlistIntoTrips(passport.wishlist, passport.plans ?? {}),
    [passport.wishlist, passport.plans],
  );

  const openProfile = (code: string) => {
    const c = countryByCode.get(code);
    if (!c) return;
    onClose();
    setTimeout(() => onOpenCountry(c), 250);
  };

  return (
    <AnimatePresence>
      {open && (
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
            className="relative flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border border-border bg-surface shadow-2xl sm:rounded-3xl"
          >
            <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
              <div className="flex items-center gap-2.5">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/15 text-primary shadow-glow">
                  <MapPinned className="h-4 w-4" />
                </span>
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    Lista de desejos
                  </div>
                  <div className="text-sm font-semibold text-foreground">Meu roteiro</div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="grid h-9 w-9 place-items-center rounded-full border border-border text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
                aria-label="Fechar lista de desejos"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5">
              {passport.wishlist.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">
                  Sua lista está vazia — toque no ícone de{" "}
                  <MapPinned className="inline h-3.5 w-3.5 align-[-2px] text-primary" /> em
                  qualquer país pra adicionar.
                </p>
              ) : (
                <div className="flex flex-col gap-6">
                  {groups.map((g, i) => (
                    <TripGroupSection
                      key={g.start + i}
                      group={g}
                      countryByCode={countryByCode}
                      onOpenProfile={openProfile}
                    />
                  ))}

                  {unplanned.length > 0 && (
                    <section>
                      <header className="mb-3 flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-muted-foreground" />
                        <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                          Ainda sem data
                        </h3>
                      </header>
                      <div className="flex flex-col gap-2">
                        {unplanned.map((code) => {
                          const c = countryByCode.get(code);
                          if (!c) return null;
                          return (
                            <WishlistItem
                              key={code}
                              country={c}
                              onOpenProfile={() => openProfile(code)}
                            />
                          );
                        })}
                      </div>
                    </section>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function TripGroupSection({
  group,
  countryByCode,
  onOpenProfile,
}: {
  group: TripGroup;
  countryByCode: Map<string, Country>;
  onOpenProfile: (code: string) => void;
}) {
  return (
    <section>
      <header className="mb-3 flex items-center gap-2">
        <PlaneIcon className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">
          Viagem · <span className="gold-text">{formatRange(group.start, group.end)}</span>
        </h3>
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
          {group.codes.length} {group.codes.length > 1 ? "países" : "país"}
        </span>
      </header>
      <div className="flex flex-col gap-2">
        {group.codes.map((code) => {
          const c = countryByCode.get(code);
          if (!c) return null;
          return (
            <WishlistItem key={code} country={c} onOpenProfile={() => onOpenProfile(code)} />
          );
        })}
      </div>
    </section>
  );
}

function WishlistItem({
  country,
  onOpenProfile,
}: {
  country: Country;
  onOpenProfile: () => void;
}) {
  const passport = usePassport();
  const plan = passport.plans?.[country.cca2] ?? {};

  const update = (patch: Partial<TripPlan>) => {
    setPlan(country.cca2, { ...plan, ...patch });
  };

  return (
    <div className="rounded-xl border border-border bg-surface/40 p-3">
      <div className="flex items-center gap-3">
        <img
          src={country.flags.png}
          alt=""
          className="h-8 w-11 shrink-0 rounded object-cover ring-1 ring-border"
        />
        <button
          onClick={onOpenProfile}
          className="min-w-0 flex-1 truncate text-left text-sm font-semibold text-foreground hover:text-primary"
        >
          {getPtName(country)}
        </button>
        <button
          onClick={() => setStatus(country.cca2, "none")}
          aria-label={`Remover ${getPtName(country)} da lista`}
          title="Remover da lista"
          className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-muted-foreground/70 transition hover:bg-background/60 hover:text-destructive"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          De
          <input
            type="date"
            value={plan.start ?? ""}
            onChange={(e) => update({ start: e.target.value || undefined })}
            className="rounded-lg border border-border bg-background/60 px-2 py-1 text-[11px] text-foreground [color-scheme:dark]"
          />
        </label>
        <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          até
          <input
            type="date"
            value={plan.end ?? ""}
            min={plan.start}
            onChange={(e) => update({ end: e.target.value || undefined })}
            className="rounded-lg border border-border bg-background/60 px-2 py-1 text-[11px] text-foreground [color-scheme:dark]"
          />
        </label>
      </div>

      <input
        type="text"
        value={plan.note ?? ""}
        onChange={(e) => update({ note: e.target.value || undefined })}
        placeholder="Anotação (ex: ficar na região de Trastevere, alugar carro...)"
        className="mt-2 w-full rounded-lg border border-border/60 bg-background/40 px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary/50 focus:outline-none"
      />
    </div>
  );
}

// Card com as informações de um estado/província/região que a pessoa
// clicou no mapa: nome, sigla, país, área e as cidades/lugares dele.
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { geoArea } from "d3-geo";
import { Crown, MapPin, Star, X } from "lucide-react";
import type { Country } from "@/lib/countries";
import { getPtName } from "@/lib/countries";
import { getPlacesForCountry, type Place } from "@/lib/places";
import type { GeoGeometry } from "@/lib/countryLabels";
import { pointInGeometry } from "@/lib/geometryHit";
import { useI18n } from "@/lib/i18n/context";

export interface SelectedDivision {
  id: string;
  name: string;
  abbr: string;
  geometry: GeoGeometry;
  countryCode: string;
}

const EARTH_RADIUS_KM = 6371.0088;

interface Props {
  division: SelectedDivision;
  country: Country | undefined;
  onClose: () => void;
  onOpenCountry: (c: Country) => void;
  onSelectPlace: (p: Place, countryCode: string) => void;
}

export function AdminDivisionCard({ division, country, onClose, onOpenCountry, onSelectPlace }: Props) {
  const { t, locale } = useI18n();

  const areaKm2 = useMemo(() => {
    // Os polígonos da fonte vêm com o sentido de giro "invertido" pro d3: ele
    // então devolve o COMPLEMENTO (esfera inteira menos o estado). Por isso
    // calcula polígono a polígono e, se passar de meia esfera, usa 4π - área.
    const geo = division.geometry as unknown as { type: string; coordinates: unknown };
    const polygons =
      geo.type === "Polygon"
        ? [geo.coordinates as number[][][]]
        : geo.type === "MultiPolygon"
          ? (geo.coordinates as number[][][][])
          : [];
    let sr = 0;
    for (const coordinates of polygons) {
      const a = geoArea({ type: "Polygon", coordinates } as never);
      sr += a > 2 * Math.PI ? 4 * Math.PI - a : a;
    }
    return sr * EARTH_RADIUS_KM * EARTH_RADIUS_KM;
  }, [division]);

  const [countryPlaces, setCountryPlaces] = useState<Place[] | null>(null);
  useEffect(() => {
    let cancelled = false;
    setCountryPlaces(null);
    getPlacesForCountry(division.countryCode).then((p) => {
      if (!cancelled) setCountryPlaces(p);
    });
    return () => {
      cancelled = true;
    };
  }, [division.countryCode]);

  // Lugares do país que caem dentro deste estado/província: capital do estado
  // primeiro, depois por população.
  const cities = useMemo(() => {
    if (!countryPlaces) return [];
    return countryPlaces
      .filter((p) => pointInGeometry([p.lng, p.lat], division.geometry))
      .sort((a, b) => Number(b.capital === 1 || b.capital === 2) - Number(a.capital === 1 || a.capital === 2) || b.pop - a.pop);
  }, [countryPlaces, division]);

  const numberFmt = useMemo(() => new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }), [locale]);
  const compactFmt = useMemo(
    () => new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 1 }),
    [locale],
  );

  return (
    <motion.aside
      initial={{ opacity: 0, y: -8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.98 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className="absolute left-3 top-3 z-30 flex max-h-[calc(100%-1.5rem)] w-[min(21rem,calc(100%-4.75rem))] flex-col overflow-hidden rounded-2xl border border-border bg-surface-elevated/95 shadow-panel backdrop-blur-xl"
      // Não deixa o clique/arrasto no card chegar no mapa por baixo.
      onPointerDown={(e) => e.stopPropagation()}
      onWheel={(e) => e.stopPropagation()}
    >
      <header className="flex items-start gap-3 p-4 pb-3">
        {country?.flags?.svg && (
          <img
            src={country.flags.svg}
            alt=""
            className="mt-0.5 h-6 w-9 shrink-0 rounded-[3px] object-cover shadow-sm ring-1 ring-border"
          />
        )}
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-display text-lg font-semibold leading-tight text-foreground">
            {division.name}
          </h3>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="rounded-md border border-border bg-surface px-1.5 py-px font-semibold tracking-wide text-primary">
              {division.abbr}
            </span>
            <span className="truncate">{country ? getPtName(country) : division.countryCode}</span>
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={t("close")}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </header>

      <dl className="mx-4 grid grid-cols-2 gap-2 border-t border-border py-3 text-xs">
        <div>
          <dt className="text-muted-foreground">{t("divisionArea")}</dt>
          <dd className="mt-0.5 text-sm font-semibold tabular-nums text-foreground">
            {numberFmt.format(areaKm2)} km²
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">{t("divisionCities")}</dt>
          <dd className="mt-0.5 text-sm font-semibold tabular-nums text-foreground">
            {countryPlaces ? cities.length : "…"}
          </dd>
        </div>
      </dl>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-1">
        {countryPlaces && cities.length === 0 ? (
          <p className="pb-3 text-xs text-muted-foreground">{t("divisionNoCities")}</p>
        ) : (
          <ul className="pb-3">
            {cities.slice(0, 14).map((c) => (
              <li key={`${c.name}:${c.lat}:${c.lng}`}>
                <button
                  type="button"
                  onClick={() => onSelectPlace(c, division.countryCode)}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition-colors hover:bg-surface"
                >
                  {c.capital === 2 ? (
                    <Crown className="h-3.5 w-3.5 shrink-0 text-primary" />
                  ) : c.capital === 1 ? (
                    <Star className="h-3.5 w-3.5 shrink-0 text-primary/80" />
                  ) : (
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  )}
                  <span className="min-w-0 flex-1 truncate text-foreground">{c.name}</span>
                  {c.pop > 0 ? (
                    <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                      {compactFmt.format(c.pop)}
                    </span>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="px-4 pb-1 text-[10px] text-muted-foreground/70">Lugares: GeoNames · Natural Earth</p>

      {country && (
        <button
          type="button"
          onClick={() => onOpenCountry(country)}
          className="m-3 mt-1 rounded-xl border border-primary/40 bg-primary/10 px-3 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/20"
        >
          {t("divisionOpenCountry")}
        </button>
      )}
    </motion.aside>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import timezones from "@/data/timezones.json";

// Fontes:
// - mledoze/countries: dados oficiais completos (a base do REST Countries).
// - samayo/country-json: dataset de população por nome do país.
// - timezones.json: fuso IANA por país, gerado localmente em build (ver
//   scripts/gen-timezones.mjs) a partir do GeoNames — a mledoze/countries
//   removeu o campo `timezones` da base inteira (confirmado: nenhum dos 250
//   países mais vem com esse campo), então isso substitui a fonte antiga.
// Cache no processo por 12h para evitar re-fetch.

const MLEDOZE_URL =
  "https://raw.githubusercontent.com/mledoze/countries/master/countries.json";
const POP_URL =
  "https://raw.githubusercontent.com/samayo/country-json/master/src/country-by-population.json";
const TZ_MAP = timezones as Record<string, string>;

interface Ml {
  name: {
    common: string;
    official: string;
    native?: Record<string, { common: string; official: string }>;
  };
  cca2: string;
  cca3: string;
  ccn3: string;
  capital?: string[];
  region: string;
  subregion?: string;
  languages?: Record<string, string>;
  currencies?: Record<string, { name: string; symbol?: string }>;
  latlng?: [number, number];
  area?: number;
  translations?: Record<string, { common: string; official: string }>;
}

let cache: { at: number; body: string } | null = null;
const TTL = 1000 * 60 * 60 * 12;

export const Route = createFileRoute("/api/public/countries")({
  server: {
    handlers: {
      GET: async () => {
        if (cache && Date.now() - cache.at < TTL) {
          return respond(cache.body);
        }
        try {
          const [mlRes, popRes] = await Promise.all([
            fetch(MLEDOZE_URL, { headers: { Accept: "application/json" } }),
            fetch(POP_URL, { headers: { Accept: "application/json" } }),
          ]);
          if (!mlRes.ok || !popRes.ok) {
            return new Response(
              JSON.stringify({ error: "Falha ao carregar dados de países" }),
              { status: 502, headers: { "Content-Type": "application/json" } },
            );
          }
          const ml = (await mlRes.json()) as Ml[];
          const pops = (await popRes.json()) as { country: string; population: number | null }[];
          const popMap = new Map<string, number>();
          for (const p of pops) {
            if (p.population != null) popMap.set(norm(p.country), p.population);
          }

          const normalized = ml
            .filter((c) => c.cca2 && c.ccn3)
            .map((c) => ({
              cca2: c.cca2,
              cca3: c.cca3,
              ccn3: c.ccn3,
              name: c.name,
              capital: c.capital,
              region: c.region,
              subregion: c.subregion,
              population:
                popMap.get(norm(c.name.common)) ??
                popMap.get(norm(c.name.official)) ??
                0,
              languages: c.languages,
              currencies: c.currencies,
              flags: {
                svg: `https://flagcdn.com/${c.cca2.toLowerCase()}.svg`,
                png: `https://flagcdn.com/w320/${c.cca2.toLowerCase()}.png`,
                alt: `Bandeira de ${c.name.common}`,
              },
              latlng: c.latlng,
              area: c.area,
              translations: c.translations,
              timezone: TZ_MAP[c.cca2],
            }));

          const body = JSON.stringify(normalized);
          cache = { at: Date.now(), body };
          return respond(body);
        } catch (e) {
          return new Response(
            JSON.stringify({ error: String(e) }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }
      },
    },
  },
});

function respond(body: string) {
  return new Response(body, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600",
    },
  });
}

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

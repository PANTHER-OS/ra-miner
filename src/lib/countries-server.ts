// Busca + normalização de países — roda só no servidor (usa `fetch` pra
// fontes externas e mantém cache em processo). Extraído da rota
// /api/public/countries pra também poder ser chamado DIRETO, em processo,
// pelos `loader`s das páginas /pais/$cca2 (SSR das meta tags por país) —
// assim as duas coisas usam a mesma fonte e o mesmo cache, sem a página do
// país precisar fazer uma volta HTTP pra si mesma só pra se ler.
//
// `getCountriesServerData` é exportada como `createServerFn`: os `loader`s
// chamam ela tanto no SSR (primeira carga de /pais/:cca2) quanto em
// navegações client-side (clicar num país já com o app aberto) — sem o
// wrapper, essa segunda chamada rodaria ESTE módulo (com os `fetch`s pra
// GitHub e o cache) direto no navegador, o que falha (CORS/rede) e é
// redundante já que o navegador já tem os países via /api/public/countries.
// Com `createServerFn`, o TanStack Start troca a chamada do lado do cliente
// por uma requisição RPC pro servidor automaticamente.
//
// Fontes:
// - mledoze/countries: dados oficiais completos (a base do REST Countries).
// - samayo/country-json: dataset de população por nome do país.
// - timezones.json: fuso IANA por país, gerado localmente em build (ver
//   scripts/gen-timezones.mjs) a partir do GeoNames — a mledoze/countries
//   removeu o campo `timezones` da base inteira (confirmado: nenhum dos 250
//   países mais vem com esse campo), então isso substitui a fonte antiga.
import { createServerFn } from "@tanstack/react-start";
import timezones from "@/data/timezones.json";
import { PT_BR_COMMON_NAME_FIXES } from "@/lib/countries";

const MLEDOZE_URL = "https://raw.githubusercontent.com/mledoze/countries/master/countries.json";
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

export interface ServerCountry {
  cca2: string;
  cca3: string;
  ccn3: string;
  name: { common: string; official: string; nativeName?: Record<string, { common: string; official: string }> };
  capital?: string[];
  region: string;
  subregion?: string;
  population: number;
  languages?: Record<string, string>;
  currencies?: Record<string, { name: string; symbol?: string }>;
  flags: { svg: string; png: string; alt?: string };
  latlng?: [number, number];
  area?: number;
  translations?: Record<string, { common: string; official: string }>;
  timezone?: string;
}

let cache: { at: number; data: ServerCountry[] } | null = null;
const TTL = 1000 * 60 * 60 * 12;

export const getCountriesServerData = createServerFn({ method: "GET" }).handler(
  async (): Promise<ServerCountry[]> => {
    if (cache && Date.now() - cache.at < TTL) return cache.data;

    const [mlRes, popRes] = await Promise.all([
      fetch(MLEDOZE_URL, { headers: { Accept: "application/json" } }),
      fetch(POP_URL, { headers: { Accept: "application/json" } }),
    ]);
    if (!mlRes.ok || !popRes.ok) {
      throw new Error("Falha ao carregar dados de países");
    }
    const ml = (await mlRes.json()) as Ml[];
    const pops = (await popRes.json()) as { country: string; population: number | null }[];
    const popMap = new Map<string, number>();
    for (const p of pops) {
      if (p.population != null) popMap.set(norm(p.country), p.population);
    }

    const normalized: ServerCountry[] = ml
      .filter((c) => c.cca2 && c.ccn3)
      .map((c) => ({
        cca2: c.cca2,
        cca3: c.cca3,
        ccn3: c.ccn3,
        name: c.name,
        capital: c.capital,
        region: c.region,
        subregion: c.subregion,
        population: popMap.get(norm(c.name.common)) ?? popMap.get(norm(c.name.official)) ?? 0,
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

    cache = { at: Date.now(), data: normalized };
    return normalized;
  },
);

export function getPtNameServer(c: Pick<ServerCountry, "cca2" | "translations" | "name">): string {
  return PT_BR_COMMON_NAME_FIXES[c.cca2] ?? c.translations?.por?.common ?? c.name.common;
}

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

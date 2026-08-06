// Principais atrações de cada cidade, ao vivo, via API pública da Wikipédia
// (GeoSearch — CORS liberado, sem chave de API). Não inventamos pontos
// turísticos: cada resultado é um artigo real e próximo às coordenadas
// pedidas, com miniatura e resumo quando disponíveis. Tenta primeiro a
// Wikipédia em português; se a cobertura local for pobre, completa com a
// versão em inglês (cobertura global muito mais ampla) e sinaliza a fonte.
import { distanceKm } from "./cities";

export interface Attraction {
  title: string;
  extract: string;
  thumbnail: string | null;
  lat: number;
  lng: number;
  distanceKm: number;
  url: string;
  lang: "pt" | "en";
}

interface WikiPage {
  title: string;
  extract?: string;
  thumbnail?: { source: string };
  coordinates?: { lat: number; lon: number }[];
  fullurl?: string;
  pageid: number;
}

async function geosearch(
  lang: "pt" | "en",
  lat: number,
  lng: number,
  radius: number,
  limit: number,
): Promise<WikiPage[]> {
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    formatversion: "2",
    generator: "geosearch",
    ggscoord: `${lat}|${lng}`,
    ggsradius: String(radius),
    ggslimit: String(limit),
    prop: "coordinates|pageimages|extracts|info",
    exintro: "1",
    explaintext: "1",
    exchars: "240",
    pithumbsize: "400",
    inprop: "url",
    origin: "*",
  });
  const res = await fetch(`https://${lang}.wikipedia.org/w/api.php?${params}`);
  if (!res.ok) return [];
  const json = await res.json();
  const pages = json?.query?.pages as WikiPage[] | undefined;
  return pages ?? [];
}

function toAttraction(p: WikiPage, lang: "pt" | "en", origin: [number, number]): Attraction | null {
  const coord = p.coordinates?.[0];
  if (!coord || !p.fullurl) return null;
  return {
    title: p.title,
    extract: (p.extract ?? "").trim(),
    thumbnail: p.thumbnail?.source ?? null,
    lat: coord.lat,
    lng: coord.lon,
    distanceKm: distanceKm(origin, [coord.lat, coord.lon]),
    url: p.fullurl,
    lang,
  };
}

const cache = new Map<string, { at: number; data: Attraction[] }>();
const TTL = 1000 * 60 * 60 * 6; // 6h — conteúdo enciclopédico muda pouco.
const MIN_RESULTS_BEFORE_FALLBACK = 5;

export async function fetchAttractions(
  lat: number,
  lng: number,
  radiusM = 10000,
): Promise<Attraction[]> {
  const key = `${lat.toFixed(3)},${lng.toFixed(3)},${radiusM}`;
  const cached = cache.get(key);
  if (cached && Date.now() - cached.at < TTL) return cached.data;

  const origin: [number, number] = [lat, lng];
  const ptPages = await geosearch("pt", lat, lng, radiusM, 16);
  let results = ptPages
    .map((p) => toAttraction(p, "pt", origin))
    .filter((a): a is Attraction => a !== null);

  if (results.length < MIN_RESULTS_BEFORE_FALLBACK) {
    const enPages = await geosearch("en", lat, lng, radiusM, 16);
    const seen = new Set(results.map((a) => normalizeTitle(a.title)));
    const enExtra = enPages
      .map((p) => toAttraction(p, "en", origin))
      .filter((a): a is Attraction => a !== null && !seen.has(normalizeTitle(a.title)));
    results = [...results, ...enExtra];
  }

  results.sort((a, b) => a.distanceKm - b.distanceKm);
  results = results.slice(0, 12);

  cache.set(key, { at: Date.now(), data: results });
  return results;
}

function normalizeTitle(t: string): string {
  return t
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

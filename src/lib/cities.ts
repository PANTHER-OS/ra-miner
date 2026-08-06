// Cidades por país, pré-processadas a partir do GeoNames (cities5000,
// licença CC BY 4.0 — geonames.org). Para os principais destinos turísticos
// do mundo, a ordem é curada por relevância real (ex: Marbella entra na
// Espanha mesmo sem ser das mais populosas, Lençóis Maranhenses entra pelo
// Parque Nacional e não por população); os demais países usam as cidades
// mais populosas como aproximação honesta de "principais cidades".
// Coordenadas e nomes vêm todos do dataset (ou da própria Wikipédia, no caso
// de marcos naturais sem população) — nada é inventado.
import { geoEqualEarth } from "d3-geo";
import raw from "@/data/cities.json";

export interface CityEntry {
  name: string;
  lat: number;
  lng: number;
  pop?: number;
  capital?: boolean;
  // Marco natural (parque, formação geológica...) em vez de cidade — não
  // tem população, então a UI mostra "marco natural" em vez de habitantes.
  landmark?: boolean;
}

const DATA = raw as Record<string, CityEntry[]>;

// Mesma projeção (e mesma escala) usada pelo <ComposableMap> — ver
// PROJECTION_SCALE em WorldMap.tsx. Mantida aqui só para pré-calcular a
// posição de cada cidade em "espaço de projeção" uma única vez, e assim
// decidir com matemática simples (sem invert) quais cidades estão dentro da
// área visível atual do mapa, em qualquer zoom/posição.
export const PROJECTION_SCALE = 165;
const projection = geoEqualEarth().translate([400, 300]).scale(PROJECTION_SCALE);

export function getCitiesForCountry(cca2: string | null | undefined): CityEntry[] {
  if (!cca2) return [];
  return DATA[cca2.toUpperCase()] ?? [];
}

export function hasCityData(cca2: string | null | undefined): boolean {
  return getCitiesForCountry(cca2).length > 0;
}

// Todas as cidades do dataset, achatadas — usado na busca global e na
// revelação por zoom no mapa. `rank` é a posição da cidade dentro da lista
// do seu país (0 = mais relevante) — é o que decide se ela é uma das
// "principais" (aparece cedo) ou uma das "menos relevantes, mas ainda
// principais" (só aparece com mais zoom). `px`/`py` é a posição já
// projetada, pra filtrar por área visível sem reprojetar em todo render.
export interface CityWithCountry extends CityEntry {
  cca2: string;
  rank: number;
  px: number;
  py: number;
}

let flatCache: CityWithCountry[] | null = null;
export function getAllCities(): CityWithCountry[] {
  if (flatCache) return flatCache;
  const out: CityWithCountry[] = [];
  for (const [cca2, list] of Object.entries(DATA)) {
    list.forEach((c, rank) => {
      const [px, py] = projection([c.lng, c.lat]) ?? [0, 0];
      out.push({ ...c, cca2, rank, px, py });
    });
  }
  flatCache = out;
  return out;
}

// Projeta um ponto [lng, lat] com a mesma projeção do mapa — usado pra
// achar onde o CENTRO atual do mapa cai em "espaço de projeção" antes de
// filtrar quais cidades estão dentro da área visível.
export function projectPoint(lng: number, lat: number): [number, number] {
  return (projection([lng, lat]) as [number, number]) ?? [0, 0];
}

// Cidades dentro da área visível atual do mapa (retângulo ao redor do
// centro projetado, do tamanho da viewBox 800x600 dividido pelo zoom),
// limitadas a quem está dentro do "rank" liberado pelo zoom atual — ou
// seja: só as mais relevantes aparecem de longe, e conforme se aproxima
// mais, cidades um pouco menos centrais (mas ainda entre as principais do
// país) vão entrando.
export function getVisibleCities(
  centerPx: number,
  centerPy: number,
  zoom: number,
  maxRank: number,
  limit = 60,
): CityWithCountry[] {
  const halfW = 400 / zoom;
  const halfH = 300 / zoom;
  const minX = centerPx - halfW;
  const maxX = centerPx + halfW;
  const minY = centerPy - halfH;
  const maxY = centerPy + halfH;

  const inView = getAllCities().filter(
    (c) => c.rank <= maxRank && c.px >= minX && c.px <= maxX && c.py >= minY && c.py <= maxY,
  );
  inView.sort((a, b) => a.rank - b.rank);
  return inView.slice(0, limit);
}

export function formatCityPop(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")} mi`;
  if (n >= 1_000) return `${Math.round(n / 1000)} mil`;
  return String(n);
}

// Linha curta pra usar embaixo do nome da cidade — cobre o caso de marcos
// naturais (parques, dunas...) que não têm população cadastrada.
export function formatCityMeta(city: { pop?: number; landmark?: boolean }): string {
  if (city.landmark || !city.pop) return "marco natural";
  return `${formatCityPop(city.pop)} habitantes`;
}

// Distância haversine em km entre dois pontos [lat, lng].
export function distanceKm(a: [number, number], b: [number, number]): number {
  const R = 6371;
  const [lat1, lng1] = a;
  const [lat2, lng2] = b;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

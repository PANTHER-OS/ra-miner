// Cidades por país, pré-processadas a partir do GeoNames (cities5000,
// licença CC BY 4.0 — geonames.org). Para os principais destinos turísticos
// do mundo, a ordem é curada por relevância real (ex: Marbella entra na
// Espanha mesmo sem ser das mais populosas); os demais países usam as
// cidades mais populosas como aproximação honesta de "principais cidades".
// Coordenadas e nomes vêm todos do dataset — nada é inventado.
import raw from "@/data/cities.json";

export interface CityEntry {
  name: string;
  lat: number;
  lng: number;
  pop: number;
  capital?: boolean;
}

const DATA = raw as Record<string, CityEntry[]>;

export function getCitiesForCountry(cca2: string | null | undefined): CityEntry[] {
  if (!cca2) return [];
  return DATA[cca2.toUpperCase()] ?? [];
}

export function hasCityData(cca2: string | null | undefined): boolean {
  return getCitiesForCountry(cca2).length > 0;
}

// Todas as cidades do dataset, achatadas — usado na busca global.
export interface CityWithCountry extends CityEntry {
  cca2: string;
}

let flatCache: CityWithCountry[] | null = null;
export function getAllCities(): CityWithCountry[] {
  if (flatCache) return flatCache;
  const out: CityWithCountry[] = [];
  for (const [cca2, list] of Object.entries(DATA)) {
    for (const c of list) out.push({ ...c, cca2 });
  }
  flatCache = out;
  return out;
}

export function formatCityPop(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")} mi`;
  if (n >= 1_000) return `${Math.round(n / 1000)} mil`;
  return String(n);
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

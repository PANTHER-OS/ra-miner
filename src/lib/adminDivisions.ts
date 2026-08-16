// Divisões administrativas de 1º nível (estados/províncias/regiões) por
// país — carregadas SÓ quando o país é selecionado (não faz sentido
// carregar isso pro mundo inteiro de uma vez: é gente demais, ninguém
// olha a divisão interna de um país que nem escolheu ainda). Fonte:
// Natural Earth 10m "admin-1 states/provinces" (domínio público) — mesma
// família de dados já usada pro contorno dos países (ver GEO_URL em
// WorldMap.tsx), só que no nível abaixo. Pré-processado uma vez (ver
// scripts/README abaixo) e dividido em um arquivo por país em
// public/admin1/{cca2 minúsculo}.json — assim cada país selecionado
// baixa só o próprio pedaço (alguns KB a ~300KB pros maiores, tipo
// Rússia), nunca o mundo inteiro.
//
// Nomes já vêm em português quando a fonte tem essa tradução (a grande
// maioria: ~99,8% das ~4600 divisões do mundo) — ver campo `name_pt` no
// dataset original. Cerca de 11 países da nossa lista são territórios
// pequenos demais/já são a própria menor unidade administrativa (Guiana
// Francesa, Reunião, Ilha Christmas...) e por isso não têm arquivo — não
// é erro, esses países simplesmente não têm uma divisão abaixo deles.
import type { GeoGeometry } from "./countryLabels";

export interface AdminDivision {
  id: string;
  name: string;
  geometry: GeoGeometry;
}

interface RawFeature {
  type: "Feature";
  properties: { id: string; name: string };
  geometry: GeoGeometry;
}

const cache = new Map<string, AdminDivision[] | null>();
const inflight = new Map<string, Promise<AdminDivision[] | null>>();

export async function fetchAdminDivisions(cca2: string): Promise<AdminDivision[] | null> {
  const key = cca2.toLowerCase();
  if (cache.has(key)) return cache.get(key) ?? null;
  const existing = inflight.get(key);
  if (existing) return existing;

  const promise = (async (): Promise<AdminDivision[] | null> => {
    try {
      const res = await fetch(`/admin1/${key}.json`);
      // 404 é o caso normal pra país sem divisão própria na fonte (ver
      // comentário acima) — não é falha, só "esse país não tem".
      if (!res.ok) {
        cache.set(key, null);
        return null;
      }
      const geojson = (await res.json()) as { features: RawFeature[] };
      const divisions: AdminDivision[] = geojson.features
        .filter((f) => f.properties?.name)
        .map((f, i) => ({
          id: `${key}-${i}`,
          name: f.properties.name,
          geometry: f.geometry,
        }));
      cache.set(key, divisions);
      return divisions;
    } catch {
      cache.set(key, null);
      return null;
    } finally {
      inflight.delete(key);
    }
  })();

  inflight.set(key, promise);
  return promise;
}

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
  /** Sigla curta (2-4 letras, ex: "SP", "TX") — sigla postal oficial da
   * fonte quando existe, senão derivada do nome; já sem colisão dentro do
   * mesmo país. É o PRIMEIRO nível do rótulo (aparece antes do nome
   * completo ao aproximar, igual ao Google Maps). */
  abbr: string;
  geometry: GeoGeometry;
}

interface RawFeature {
  type: "Feature";
  properties: { id: string; name: string; abbr?: string };
  geometry: GeoGeometry;
}

// Siglas (e poucas correções de nome da fonte) num arquivo único e pequeno,
// aplicado por cima dos arquivos por país — por índice da feature. Se falhar
// ao carregar, o rótulo cai pro nome (sem sigla), nunca quebra o mapa.
type AdminMeta = Record<string, { a: string[]; n?: Record<string, string> }>;
let metaPromise: Promise<AdminMeta> | null = null;
function loadAdminMeta(): Promise<AdminMeta> {
  if (!metaPromise) {
    metaPromise = fetch("/admin1-meta.json")
      .then((r) => (r.ok ? (r.json() as Promise<AdminMeta>) : {}))
      .catch(() => ({}));
  }
  return metaPromise;
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
      const meta = (await loadAdminMeta())[key];
      const divisions: AdminDivision[] = geojson.features
        .map((f, rawIndex) => ({ f, rawIndex }))
        .filter(({ f }) => f.properties?.name)
        .map(({ f, rawIndex }, i) => {
          const name = meta?.n?.[String(rawIndex)] ?? f.properties.name;
          return {
            id: `${key}-${i}`,
            name,
            abbr: meta?.a?.[rawIndex] || f.properties.abbr || name,
            geometry: f.geometry,
          };
        });
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

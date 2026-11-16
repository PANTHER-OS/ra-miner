// Linhas de divisa INTERNAS de um país: só as arestas que duas divisões
// (estados/províncias) dividem entre si. As arestas que aparecem uma única
// vez são o contorno do país (fronteira e costa) — esse contorno vem de
// outra base (as formas dos países) e é desenhado à parte; desenhar os dois
// resultava em DUAS linhas paralelas, alguns pixels uma da outra, em toda
// fronteira de perto.
//
// Funciona porque os arquivos por país foram simplificados juntos (topologia
// compartilhada): uma divisa entre dois estados é a MESMA sequência de
// vértices nos dois polígonos, só em sentido oposto.
import type { GeoGeometry } from "./countryLabels";

type Ring = [number, number][];

function ringsOf(geometry: GeoGeometry): Ring[] {
  const geo = geometry as unknown as { type: string; coordinates: unknown };
  if (geo.type === "Polygon") return geo.coordinates as Ring[];
  if (geo.type === "MultiPolygon") return (geo.coordinates as Ring[][]).flat();
  return [];
}

const SCALE = 1e4; // 0,0001° (~11 m) — os vértices compartilhados são idênticos

function vertexKey(p: [number, number]): string {
  return `${Math.round(p[0] * SCALE)},${Math.round(p[1] * SCALE)}`;
}

function edgeKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

/** MultiLineString com as divisas internas (arestas compartilhadas). */
export function computeInteriorLines(geometries: GeoGeometry[]): GeoGeometry {
  const rings = geometries.flatMap(ringsOf);
  const counts = new Map<string, number>();
  const keyed = rings.map((ring) => ring.map(vertexKey));
  for (const keys of keyed) {
    for (let i = 0; i < keys.length - 1; i++) {
      const k = edgeKey(keys[i], keys[i + 1]);
      counts.set(k, (counts.get(k) ?? 0) + 1);
    }
  }

  const lines: Ring[] = [];
  rings.forEach((ring, r) => {
    const keys = keyed[r];
    let run: Ring = [];
    for (let i = 0; i < ring.length - 1; i++) {
      const shared = (counts.get(edgeKey(keys[i], keys[i + 1])) ?? 0) >= 2;
      if (shared) {
        if (run.length === 0) run.push(ring[i]);
        run.push(ring[i + 1]);
      } else if (run.length > 0) {
        lines.push(run);
        run = [];
      }
    }
    if (run.length > 0) lines.push(run);
  });
  // Cada divisa compartilhada aparece 2x (uma por polígono vizinho); mantém
  // só uma cópia de cada trecho pra não desenhar a mesma linha em dobro.
  const seen = new Set<string>();
  const unique = lines.filter((ln) => {
    const a = vertexKey(ln[0]);
    const b = vertexKey(ln[ln.length - 1]);
    const id = `${edgeKey(a, b)}#${ln.length}`;
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
  return { type: "MultiLineString", coordinates: unique } as unknown as GeoGeometry;
}

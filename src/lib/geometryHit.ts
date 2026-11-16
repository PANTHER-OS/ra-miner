// Teste "este ponto [lng, lat] cai dentro desta geometria?" — usado pra
// achar em qual país/estado a pessoa clicou ou está olhando.
import { pointInPolygonRing, type GeoGeometry } from "./countryLabels";

/** Testa só o anel externo de cada polígono (ignora buracos internos) —
 * aproximação suficiente pra "mais ou menos que lugar é esse"; não precisa
 * de precisão de fronteira. */
export function pointInGeometry(point: [number, number], geometry: GeoGeometry): boolean {
  const geo = geometry as unknown as { type: string; coordinates: unknown };
  if (geo.type === "Polygon") {
    const rings = geo.coordinates as [number, number][][];
    return rings.length > 0 && pointInPolygonRing(point, rings[0]);
  }
  if (geo.type === "MultiPolygon") {
    const polys = geo.coordinates as [number, number][][][];
    return polys.some((poly) => poly.length > 0 && pointInPolygonRing(point, poly[0]));
  }
  return false;
}

const bboxCache = new WeakMap<object, [number, number, number, number]>();
function bboxOf(geometry: GeoGeometry): [number, number, number, number] {
  const cached = bboxCache.get(geometry);
  if (cached) return cached;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  const walk = (a: unknown): void => {
    const arr = a as unknown[];
    if (typeof arr[0] === "number") {
      const [x, y] = arr as number[];
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    } else {
      for (const b of arr) walk(b);
    }
  };
  walk((geometry as unknown as { coordinates: unknown }).coordinates);
  const box: [number, number, number, number] = [minX, minY, maxX, maxY];
  bboxCache.set(geometry, box);
  return box;
}

/** Qual divisão contém o ponto — se mais de uma (enclaves, sobreposição de
 * anéis externos), a de menor caixa, que é a mais específica. */
export function findDivisionAt<T extends { geometry: GeoGeometry }>(
  point: [number, number],
  divisions: T[],
): T | null {
  let best: T | null = null;
  let bestArea = Infinity;
  for (const d of divisions) {
    const [minX, minY, maxX, maxY] = bboxOf(d.geometry);
    if (point[0] < minX || point[0] > maxX || point[1] < minY || point[1] > maxY) continue;
    if (!pointInGeometry(point, d.geometry)) continue;
    const area = (maxX - minX) * (maxY - minY);
    if (area < bestArea) {
      best = d;
      bestArea = area;
    }
  }
  return best;
}

// Conversão entre o zoom do mapa vetorial (SVG, projeção Equal Earth — o
// "zoom 1×…16×" do badge) e o zoom do mapa de tiles em Web Mercator (o
// "z" do MapLibre/Google Maps) — usada pra trocar de um pro outro SEM o
// mapa "pular" de escala na transição.
//
// A escala horizontal (pixels por grau de longitude) é igualada NA LATITUDE
// DO CENTRO: a Equal Earth encolhe a escala horizontal com cos(lat) e a
// Mercator não, então igualar só no equador faria a Europa (lat ~48°)
// parecer ~1,5× menor/maior depois da troca.
import { projectLngLat } from "./countryLabels";

const MERCATOR_WORLD_PX_AT_Z0 = 512; // tileSize padrão do MapLibre
const VIEWBOX_WIDTH = 800; // ver ComposableMap em WorldMap.tsx

function viewBoxUnitsPerDegLng(lat: number): number {
  const a = projectLngLat(0, lat);
  const b = projectLngLat(1, lat);
  if (!a || !b) return 1;
  return Math.abs(b[0] - a[0]) || 1;
}

/** Zoom Mercator (MapLibre) que dá a mesma escala horizontal, na latitude
 * `lat`, que o zoom SVG `svgZoom` com o mapa de `mapWidthPx` de largura. */
export function svgZoomToDeepZoom(svgZoom: number, lat: number, mapWidthPx: number): number {
  const pxPerDeg = viewBoxUnitsPerDegLng(lat) * (mapWidthPx / VIEWBOX_WIDTH) * svgZoom;
  return Math.log2((pxPerDeg * 360) / MERCATOR_WORLD_PX_AT_Z0);
}

/** Inverso de svgZoomToDeepZoom. */
export function deepZoomToSvgZoom(deepZoom: number, lat: number, mapWidthPx: number): number {
  const pxPerDeg = (MERCATOR_WORLD_PX_AT_Z0 * 2 ** deepZoom) / 360;
  return pxPerDeg / (viewBoxUnitsPerDegLng(lat) * (mapWidthPx / VIEWBOX_WIDTH));
}

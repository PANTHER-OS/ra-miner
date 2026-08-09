// Rótulo de país sobre o próprio território — nome do país escrito dentro
// da sua forma real no mapa (não confundir com o alfinete + rótulo de
// cidade/país-sem-forma em cities.ts). Cresce/encolhe com o tamanho real do
// país no mapa e nunca "vaza" pra fora do contorno.
//
// Três problemas geométricos, resolvidos em ordem:
//  1) ONDE escrever — o centroide geográfico (d3.geoCentroid) cai fora da
//     forma em países bem comuns (arquipélagos como Indonésia/Filipinas,
//     formas em "L" ou côncavas). Usamos polylabel (o mesmo algoritmo do
//     Mapbox Studio pra rótulo de polígono): acha o ponto mais "no fundo"
//     do polígono, sempre dentro dele.
//  2) QUE TAMANHO de fonte — proporcional ao país: uma fração da MENOR
//     dimensão do contorno (garante que cabe até em país bem alongado, tipo
//     Chile) E nunca mais largo que o nome permitiria.
//  3) COMO GARANTIR que nunca ultrapasse a fronteira — o cinturão de
//     segurança de verdade não é a estimativa de largura (aproximação),
//     é um clip-path SVG com o contorno real do país: mesmo se a
//     estimativa errar, o texto é cortado exatamente na fronteira.
import { geoPath, geoEqualEarth } from "d3-geo";
import polylabel from "polylabel";
import { PROJECTION_SCALE } from "./cities";

// Mesma projeção (mesmo translate/scale) usada em cities.ts e no
// ComposableMap de WorldMap.tsx — precisa ser IDÊNTICA pra essas coordenadas
// caírem exatamente em cima da forma que o <Geography> desenha.
const projection = geoEqualEarth().translate([400, 300]).scale(PROJECTION_SCALE);
const pathGenerator = geoPath(projection);

export interface GeoGeometry {
  type: string;
  coordinates: unknown;
}

export interface CountryLabelLayout {
  x: number;
  y: number;
  /** Tamanho "natural" de fonte, em unidades do viewBox (800×600), medido a
   * zoom 1 — como o texto vive no mesmo espaço de coordenadas que a forma do
   * país, ele cresce junto dela quando o mapa dá zoom, sem precisar
   * recalcular nada (ver uso em WorldMap.tsx). */
  fontSize: number;
  /** Ângulo de rotação (graus) pro texto acompanhar o eixo principal de
   * países bem alongados (Chile, Vietnã, Itália, Noruega...). 0 = horizontal. */
  angle: number;
  /** `d` do contorno completo do país (mesmas coordenadas), usado como
   * clip-path — garante que o texto nunca ultrapassa a fronteira real. */
  clipPath: string;
}

type Ring = [number, number][];

function ringArea(ring: Ring): number {
  // Fórmula do "shoelace" — só precisa de uma medida RELATIVA de área pra
  // comparar anéis entre si (achar a maior "ilha" de um país com várias),
  // não precisa ser a área geográfica real.
  let sum = 0;
  for (let i = 0; i < ring.length; i++) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[(i + 1) % ring.length];
    sum += x1 * y2 - x2 * y1;
  }
  return Math.abs(sum) / 2;
}

function projectRing(ring: [number, number][]): Ring {
  const out: Ring = [];
  for (const pos of ring) {
    const p = projection(pos);
    if (p) out.push([p[0], p[1]]);
  }
  return out;
}

/** Acha o maior anel externo (a "ilha" principal) de um Polygon ou
 * MultiPolygon já projetado em coordenadas de tela — é nele que o rótulo
 * nasce, não numa média entre ilhas espalhadas (o que jogaria o texto no
 * meio do oceano em arquipélagos como Indonésia, Filipinas ou Japão). */
function largestOuterRingScreen(geometry: GeoGeometry): Ring | null {
  const polygons: [number, number][][][] =
    geometry.type === "Polygon"
      ? [geometry.coordinates as [number, number][][]]
      : geometry.type === "MultiPolygon"
        ? (geometry.coordinates as [number, number][][][])
        : [];
  let best: Ring | null = null;
  let bestArea = -1;
  for (const poly of polygons) {
    const outer = poly[0]; // primeiro anel = contorno externo; buracos vêm depois
    if (!outer || outer.length < 3) continue;
    const projected = projectRing(outer);
    if (projected.length < 3) continue;
    const area = ringArea(projected);
    if (area > bestArea) {
      bestArea = area;
      best = projected;
    }
  }
  return best;
}

/** Ângulo (graus) do eixo principal da ÁREA do anel — só vale a pena girar
 * o texto quando o país é claramente alongado numa direção (Chile, Vietnã,
 * Itália, Noruega...); em países mais "redondos" o ângulo é ruído da forma,
 * não uma direção real de leitura, então mantemos horizontal.
 *
 * Importante: os momentos são calculados sobre a ÁREA preenchida do
 * polígono (fórmulas padrão de "momento de área" via integral de linha),
 * não sobre a média simples dos VÉRTICES do contorno — a primeira tentativa
 * usava vértices crus e dava resultado errado (~metade dos países "girava",
 * vários perto de 90°) porque um litoral bem recortado tem muito mais
 * pontos por km que uma fronteira reta, então a média de vértices puxava o
 * eixo pra onde o traçado tem mais pontos, não pra onde o país de fato é
 * mais alongado.
 */
function principalAxis(ring: Ring): { angleDeg: number; elongation: number } {
  let area2 = 0; // 2× área (sinalizada)
  let cx = 0, cy = 0;
  let ixx = 0, iyy = 0, ixy = 0;
  for (let i = 0; i < ring.length; i++) {
    const [x0, y0] = ring[i];
    const [x1, y1] = ring[(i + 1) % ring.length];
    const cross = x0 * y1 - x1 * y0;
    area2 += cross;
    cx += (x0 + x1) * cross;
    cy += (y0 + y1) * cross;
    ixx += (y0 * y0 + y0 * y1 + y1 * y1) * cross;
    iyy += (x0 * x0 + x0 * x1 + x1 * x1) * cross;
    ixy += (x0 * y1 + 2 * x0 * y0 + 2 * x1 * y1 + x1 * y0) * cross;
  }
  const area = area2 / 2;
  if (Math.abs(area) < 1e-6) return { angleDeg: 0, elongation: 1 };
  cx /= 3 * area2;
  cy /= 3 * area2;
  ixx = ixx / 12 - area * cy * cy;
  iyy = iyy / 12 - area * cx * cx;
  ixy = ixy / 24 - area * cx * cy;

  const trace = ixx + iyy;
  const disc = Math.sqrt(Math.max(0, ((ixx - iyy) / 2) ** 2 + ixy * ixy));
  const lambda1 = trace / 2 + disc; // maior autovalor → eixo principal (mais "espalhado")
  const lambda2 = trace / 2 - disc;
  // Eixo de MENOR momento de inércia = direção onde a massa está mais
  // espalhada (o "comprimento" do país) — por isso usa ixx-iyy invertido
  // em relação a uma PCA de pontos comum.
  const angleRad = 0.5 * Math.atan2(2 * ixy, iyy - ixx);
  let angleDeg = (angleRad * 180) / Math.PI;
  if (angleDeg > 90) angleDeg -= 180;
  if (angleDeg <= -90) angleDeg += 180;
  const elongation = lambda2 > 1e-6 ? Math.sqrt(lambda1 / lambda2) : 1;
  return { angleDeg, elongation };
}

// Aproximação da largura média de um caractere numa fonte em negrito — mesmo
// tipo de heurística já usada pros rótulos de cidade/país-sem-forma (ver
// labelRadiusPx em WorldMap.tsx), calibrada pro mesmo font-family do app.
// Deliberadamente um pouco GENEROSA (superestima a largura) — é preferível
// um nome nascer levemente menor do que "cabia" a arriscar cortar uma letra
// no clip-path (ex: "Cazaquistão" perdendo o "o" final): a primeira vez que
// isso aconteceu levou a esse ajuste.
export const APPROX_CHAR_WIDTH_FACTOR = 0.66;
// Margem de segurança extra sobre o cálculo de largura — o polígono real
// raramente é um retângulo perfeito do tamanho do bounding box, então o
// espaço disponível na altura exata do texto costuma ser menor que a
// largura máxima do país inteiro.
const WIDTH_SAFETY_MARGIN = 0.74;

// Piso puramente numérico (nunca zero/negativo) — NÃO é um piso de
// "legibilidade". Legibilidade quem decide é o teto de tela em
// WorldMap.tsx (MIN_LABEL_SCREEN_PX): ele já esconde qualquer rótulo cujo
// tamanho real na tela ficaria pequeno demais pra ler, então aqui é seguro
// deixar o fontSize "natural" ser bem pequeno pra um país minúsculo — ele
// só aparece quando o zoom for fundo o bastante pra caber por inteiro.
// ANTES havia um piso de 3 unidades "forçando" um tamanho mínimo mesmo
// quando o espaço disponível era menor — isso fazia o nome de país bem
// pequeno e alongado (Belize, Ilhas Malvinas) nascer maior do que cabia,
// cortando a palavra pela metade (ex: só "elize" visível, o "B" sumindo
// inteiro) — o que por sua vez PARECIA um vazamento de borda, embora o
// clip-path estivesse cortando exatamente certo. Sem o piso artificial, o
// país só aparece quando o nome INTEIRO já cabe.
const MIN_FONT = 0.35;
const MAX_FONT = 60; // teto generoso; o cap de tela em WorldMap.tsx já evita texto gigante
const ELONGATION_THRESHOLD = 1.7; // a partir daqui, "vale a pena" girar o texto
const MIN_ROTATION_DEG = 12; // ângulos pequenos demais não valem o efeito colateral

export function computeCountryLabel(
  geometry: GeoGeometry,
  name: string,
): CountryLabelLayout | null {
  const ring = largestOuterRingScreen(geometry);
  if (!ring || ring.length < 3) return null;

  // polylabel espera um "Polygon" (array de anéis) — um único anel externo
  // já basta aqui: buracos internos (ex: Lesoto dentro da África do Sul)
  // não mudam o ponto ótimo o bastante pra valer a complexidade de incluir.
  const point = polylabel([ring], 0.5);
  const [x, y] = point;

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [px, py] of ring) {
    if (px < minX) minX = px;
    if (px > maxX) maxX = px;
    if (py < minY) minY = py;
    if (py > maxY) maxY = py;
  }
  const w = maxX - minX;
  const h = maxY - minY;
  if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) return null;

  const { angleDeg, elongation } = principalAxis(ring);
  const rotate = elongation >= ELONGATION_THRESHOLD && Math.abs(angleDeg) >= MIN_ROTATION_DEG;
  const angle = rotate ? angleDeg : 0;

  // "Caixa disponível" pro texto: se vai girar, a largura útil passa a ser o
  // próprio raio-poste de inacessibilidade (a distância do ponto até a borda
  // mais próxima, que o polylabel já calcula) multiplicado por um fator —
  // aproxima bem o espaço real ao longo do eixo alongado sem precisar
  // reprojetar o contorno rotacionado.
  // Mesmo sem girar, o bounding box inteiro (w) superestima o espaço
  // disponível em países com litoral bem recortado (China, Congo...) — o
  // ponto do rótulo pode estar mais perto de uma borda do que a largura
  // máxima do país sugere. `point.distance` (raio do maior círculo que
  // cabe ali, já calculado pelo polylabel) é uma medida bem mais fiel do
  // espaço LOCAL de verdade; usar os dois como teto evita nomes largos
  // (ex: "China") arranhando a costa do outro lado.
  const availableWidth = rotate
    ? Math.max(point.distance * 3.2, w * 0.5)
    : Math.min(w, point.distance * 4.6);
  const availableHeight = rotate ? point.distance * 1.6 : h;

  const byHeight = availableHeight * 0.32;
  const byWidth =
    (availableWidth * WIDTH_SAFETY_MARGIN) / (Math.max(name.length, 1) * APPROX_CHAR_WIDTH_FACTOR);
  const fontSize = Math.max(MIN_FONT, Math.min(MAX_FONT, byHeight, byWidth));

  return {
    x,
    y,
    fontSize,
    angle,
    clipPath: pathGenerator(geometry as never) ?? "",
  };
}

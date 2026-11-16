// Mapa de tiles (MapLibre GL) usado quando a pessoa aproxima ALÉM do limite
// do mapa vetorial (que é simplificado — fronteiras e costas em baixa
// resolução — e ficaria serrilhado) ou liga a camada de satélite. Entra por
// cima do mapa vetorial com um fade, na MESMA escala (ver deepMapMath.ts),
// então a troca parece só "o mapa ganhando detalhe".
//
// Imagem: Esri World Imagery (satélite) + World Boundaries and Places
// (nomes), e o canvas escuro da Esri pro modo mapa — todos sem chave de API.
// A atribuição exigida pela Esri fica sempre visível (canto inferior).
import { useEffect, useRef, useState, type MutableRefObject } from "react";
import type { Map as MLMap, Marker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { CityWithCountry } from "@/lib/cities";

export interface DeepMapHandle {
  zoomBy: (delta: number) => void;
  flyTo: (lng: number, lat: number, zoom: number) => void;
}

interface Props {
  initialCenter: [number, number];
  initialZoom: number;
  minZoom: number;
  satellite: boolean;
  /** true = some com fade (o pai desmonta depois da transição). */
  closing: boolean;
  cities: CityWithCountry[];
  onCityClick: (city: CityWithCountry) => void;
  onViewChange: (center: [number, number], zoom: number) => void;
  apiRef: MutableRefObject<DeepMapHandle | null>;
}

const ESRI = "https://server.arcgisonline.com/ArcGIS/rest/services";
const ATTRIBUTION =
  "Imagens © Esri, Maxar, Earthstar Geographics e a comunidade de usuários GIS";
const MAX_ZOOM = 20;
const FADE_MS = 600;

// Quantas cidades (por posição na lista do país — 0 é a mais importante)
// aparecem em cada nível de zoom: poucas de longe, todas de bem perto.
function cityRankLimit(z: number): number {
  if (z < 5) return 2;
  if (z < 7) return 4;
  if (z < 9) return 8;
  if (z < 11) return 16;
  return 999;
}

function cityKey(c: CityWithCountry): string {
  return `${c.cca2}:${c.name}`;
}

function createCityElement(city: CityWithCountry, onClick: () => void): HTMLElement {
  const el = document.createElement("button");
  el.type = "button";
  el.setAttribute("aria-label", city.name);
  el.className = "deepmap-city";
  const dot = document.createElement("span");
  dot.className = "deepmap-city-dot" + (city.capital ? " is-capital" : "");
  const label = document.createElement("span");
  label.className = "deepmap-city-label";
  label.textContent = city.name;
  el.append(dot, label);
  el.addEventListener("click", (e) => {
    e.stopPropagation();
    onClick();
  });
  return el;
}

const MARKER_CSS = `
.deepmap-city{width:14px;height:14px;padding:0;border:0;background:none;cursor:pointer;animation:deepmap-fade .6s ease-out both}
.deepmap-city-dot{position:absolute;inset:3px;border-radius:9999px;background:oklch(0.82 0.14 78);box-shadow:0 0 0 1.5px oklch(0.15 0.02 260 / .9),0 1px 6px rgb(0 0 0 / .5)}
.deepmap-city-dot.is-capital{inset:1px;box-shadow:0 0 0 2px oklch(0.15 0.02 260 / .9),0 0 0 3.5px oklch(0.82 0.14 78 / .7),0 1px 6px rgb(0 0 0 / .5)}
.deepmap-city-label{position:absolute;left:50%;bottom:19px;transform:translateX(-50%) translateY(4px);white-space:nowrap;font:600 12px/1.1 var(--font-sans,system-ui,sans-serif);color:#fff;background:rgb(10 14 24 / .82);border:1px solid oklch(0.82 0.14 78 / .5);border-radius:9999px;padding:3px 8px;opacity:0;transition:opacity .18s ease-out,transform .18s ease-out;pointer-events:none}
.deepmap-city:hover,.deepmap-city:focus-visible{z-index:5}
.deepmap-city:hover .deepmap-city-label,.deepmap-city:focus-visible .deepmap-city-label{opacity:1;transform:translateX(-50%) translateY(0)}
.deepmap-city:hover .deepmap-city-dot{transform:scale(1.35)}
.deepmap-city-dot{transition:transform .18s ease-out}
@keyframes deepmap-fade{from{opacity:0}to{opacity:1}}
.maplibregl-ctrl-attrib{font-size:10px;background:rgb(10 14 24 / .65)!important;color:#cbd5e1}
.maplibregl-ctrl-attrib a{color:#cbd5e1}
`;

export default function DeepMap({
  initialCenter,
  initialZoom,
  minZoom,
  satellite,
  closing,
  cities,
  onCityClick,
  onViewChange,
  apiRef,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MLMap | null>(null);
  const satelliteRef = useRef(satellite);
  const callbacksRef = useRef({ onCityClick, onViewChange });
  callbacksRef.current = { onCityClick, onViewChange };
  const citiesRef = useRef(cities);
  citiesRef.current = cities;
  // Só aparece (fade) depois dos primeiros tiles pintados — senão a troca
  // mostraria um fundo vazio por uns instantes. Teto de 2,5s caso a rede
  // esteja lenta (aí os tiles vão "nascendo" por cima, também com fade).
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setShown(true), 2500);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    let disposed = false;
    let map: MLMap | null = null;
    const markers = new Map<string, Marker>();
    let raf: number | null = null;

    (async () => {
      const maplibre = (await import("maplibre-gl")).default;
      if (disposed || !containerRef.current) return;

      const sat = satelliteRef.current;
      const rasterPaint = (visible: boolean) => ({
        "raster-opacity": visible ? 1 : 0,
        "raster-opacity-transition": { duration: FADE_MS, delay: 0 },
        "raster-fade-duration": 400,
      });
      map = new maplibre.Map({
        container: containerRef.current,
        center: initialCenter,
        zoom: initialZoom,
        minZoom,
        maxZoom: MAX_ZOOM,
        attributionControl: false,
        dragRotate: false,
        pitchWithRotate: false,
        touchPitch: false,
        style: {
          version: 8,
          sources: {
            dark: {
              type: "raster",
              tiles: [`${ESRI}/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}`],
              tileSize: 256,
              maxzoom: 16,
              attribution: ATTRIBUTION,
            },
            darkRef: {
              type: "raster",
              tiles: [`${ESRI}/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}`],
              tileSize: 256,
              maxzoom: 16,
            },
            sat: {
              type: "raster",
              tiles: [`${ESRI}/World_Imagery/MapServer/tile/{z}/{y}/{x}`],
              tileSize: 256,
              maxzoom: 19,
              attribution: ATTRIBUTION,
            },
            satRef: {
              type: "raster",
              tiles: [`${ESRI}/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}`],
              tileSize: 256,
              maxzoom: 19,
            },
          },
          layers: [
            { id: "bg", type: "background", paint: { "background-color": "#0a0f1a" } },
            { id: "dark", type: "raster", source: "dark", paint: rasterPaint(!sat) },
            { id: "darkRef", type: "raster", source: "darkRef", paint: rasterPaint(!sat) },
            { id: "sat", type: "raster", source: "sat", paint: rasterPaint(sat) },
            { id: "satRef", type: "raster", source: "satRef", paint: rasterPaint(sat) },
          ],
        },
      });
      mapRef.current = map;
      map.touchZoomRotate.disableRotation();
      map.addControl(new maplibre.AttributionControl({ compact: true }), "bottom-left");

      apiRef.current = {
        zoomBy: (delta) => map?.easeTo({ zoom: Math.min(MAX_ZOOM, Math.max(minZoom, (map?.getZoom() ?? 0) + delta)), duration: 450 }),
        flyTo: (lng, lat, zoom) => map?.flyTo({ center: [lng, lat], zoom: Math.min(MAX_ZOOM, Math.max(minZoom, zoom)), duration: 1400, essential: true }),
      };

      const syncMarkers = () => {
        if (!map) return;
        const z = map.getZoom();
        const b = map.getBounds();
        const limit = cityRankLimit(z);
        const wanted = citiesRef.current
          .filter(
            (c) =>
              c.rank < limit &&
              c.lng >= b.getWest() &&
              c.lng <= b.getEast() &&
              c.lat >= b.getSouth() &&
              c.lat <= b.getNorth(),
          )
          .sort((a, c) => a.rank - c.rank)
          .slice(0, 140);
        const wantedKeys = new Set(wanted.map(cityKey));
        for (const [key, marker] of markers) {
          if (!wantedKeys.has(key)) {
            marker.remove();
            markers.delete(key);
          }
        }
        for (const c of wanted) {
          const key = cityKey(c);
          if (markers.has(key)) continue;
          const el = createCityElement(c, () => callbacksRef.current.onCityClick(c));
          markers.set(key, new maplibre.Marker({ element: el, anchor: "center" }).setLngLat([c.lng, c.lat]).addTo(map));
        }
      };

      const reportView = () => {
        raf = null;
        if (!map) return;
        const c = map.getCenter();
        callbacksRef.current.onViewChange([c.lng, c.lat], map.getZoom());
      };
      map.on("move", () => {
        if (raf == null) raf = requestAnimationFrame(reportView);
      });
      map.on("moveend", () => {
        reportView();
        syncMarkers();
      });
      map.on("load", syncMarkers);
      map.once("idle", () => setShown(true));
    })();

    return () => {
      disposed = true;
      if (raf != null) cancelAnimationFrame(raf);
      apiRef.current = null;
      for (const m of markers.values()) m.remove();
      markers.clear();
      map?.remove();
      mapRef.current = null;
    };
    // O mapa é criado UMA vez por abertura — centro/zoom iniciais não
    // reinicializam nada depois (o MapLibre passa a ser a fonte da verdade).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    satelliteRef.current = satellite;
    const map = mapRef.current;
    if (!map) return; // o mapa ainda nasce com o valor de satelliteRef
    const apply = () => {
      const set = (id: string, v: number) => map.setPaintProperty(id, "raster-opacity", v);
      set("dark", satellite ? 0 : 1);
      set("darkRef", satellite ? 0 : 1);
      set("sat", satellite ? 1 : 0);
      set("satRef", satellite ? 1 : 0);
    };
    if (map.isStyleLoaded()) apply();
    else map.once("load", apply);
  }, [satellite]);

  return (
    <div
      className="absolute inset-0 z-10"
      style={{
        opacity: shown && !closing ? 1 : 0,
        transition: `opacity ${FADE_MS}ms ease-in-out`,
        pointerEvents: closing ? "none" : "auto",
      }}
    >
      <style>{MARKER_CSS}</style>
      {/* Inline de propósito: o CSS do MapLibre define `.maplibregl-map {
          position: relative }` e, carregado depois, vencia a classe do Tailwind. */}
      <div ref={containerRef} style={{ position: "absolute", inset: 0 }} />
    </div>
  );
}

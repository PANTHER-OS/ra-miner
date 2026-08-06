import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Graticule,
  Marker,
  Sphere,
  ZoomableGroup,
} from "react-simple-maps";
import { AnimatePresence, motion } from "framer-motion";
import { Minus, Plus, RotateCcw } from "lucide-react";
import type { Country } from "@/lib/countries";
import { getPtName } from "@/lib/countries";
import type { PassportStatus } from "@/lib/passport";

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const MIN_ZOOM = 1;
const MAX_ZOOM = 8;
const HOME_CENTER: [number, number] = [15, 15];

interface Props {
  countries: Country[];
  selectedCode: string | null;
  onSelect: (c: Country | null) => void;
  filterRegion: string; // "all" | region
  statusMap?: Map<string, PassportStatus>;
  verifiedSet?: Set<string>;
  viewMode?: "all" | "visited" | "wishlist" | "unmarked";
}

type GeoFeature = {
  rsmKey: string;
  id: string; // numeric id (matches ccn3)
  properties: { name: string };
};

function WorldMapInner({
  countries,
  selectedCode,
  onSelect,
  filterRegion,
  statusMap,
  verifiedSet,
  viewMode = "all",
}: Props) {
  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState<[number, number]>(HOME_CENTER);
  const [hovered, setHovered] = useState<Country | null>(null);
  const [ready, setReady] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const tooltipAnchorRef = useRef<HTMLDivElement>(null);
  const rectRef = useRef<DOMRect | null>(null);

  // Fast lookup by numeric code
  const byCcn3 = useMemo(() => {
    const m = new Map<string, Country>();
    for (const c of countries) m.set(String(Number(c.ccn3)), c);
    return m;
  }, [countries]);

  const selectedCountry = useMemo(
    () => (selectedCode ? countries.find((c) => c.cca2 === selectedCode) ?? null : null),
    [selectedCode, countries],
  );

  const isFiltered = useCallback(
    (c: Country | undefined) => {
      if (!c) return true;
      if (filterRegion !== "all" && c.region !== filterRegion) return true;
      if (viewMode === "all") return false;
      const st = statusMap?.get(c.cca2) ?? "none";
      if (viewMode === "visited") return st !== "visited";
      if (viewMode === "wishlist") return st !== "wishlist";
      return st !== "none";
    },
    [filterRegion, viewMode, statusMap],
  );

  // When selected changes externally (e.g. via search), fly to it.
  useEffect(() => {
    if (!selectedCountry?.latlng) return;
    setCenter([selectedCountry.latlng[1], selectedCountry.latlng[0]]);
    setZoom((z) => Math.max(z, 3.2));
  }, [selectedCountry]);

  const atHome = zoom === 1 && center[0] === HOME_CENTER[0] && center[1] === HOME_CENTER[1];

  const reset = () => {
    setZoom(1);
    setCenter(HOME_CENTER);
  };

  const zoomIn = () => setZoom((z) => Math.min(z * 1.6, MAX_ZOOM));
  const zoomOut = () => setZoom((z) => Math.max(z / 1.6, MIN_ZOOM));

  // Traços finos e constantes em qualquer nível de zoom.
  const hair = 0.5 / zoom;

  // --- Tooltip: posição via DOM direto, sem tocar no estado do React a cada
  // pixel do mouse. Isso é o que fazia o mapa inteiro ser reconstruído em
  // todo movimento — a causa principal da travada ao passar o mouse. ---
  const refreshRect = useCallback(() => {
    if (wrapRef.current) rectRef.current = wrapRef.current.getBoundingClientRect();
  }, []);

  useEffect(() => {
    refreshRect();
    window.addEventListener("resize", refreshRect);
    return () => window.removeEventListener("resize", refreshRect);
  }, [refreshRect]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const anchor = tooltipAnchorRef.current;
    if (!anchor) return;
    const r = rectRef.current;
    if (!r) return;
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    const left = Math.min(x + 14, r.width - 220);
    const top = Math.max(y - 44, 8);
    anchor.style.transform = `translate3d(${left}px, ${top}px, 0)`;
  }, []);

  const handleEnterCountry = useCallback((c: Country | undefined) => {
    if (c) setHovered(c);
  }, []);
  const handleLeaveCountry = useCallback(() => setHovered(null), []);
  const handleClickCountry = useCallback(
    (c: Country | undefined) => {
      if (c) onSelect(c);
    },
    [onSelect],
  );

  // Todo o conteúdo do SVG (esferas, meridianos, países) fica memoizado à
  // parte: só recalcula quando algo que realmente muda a pintura do mapa
  // muda — não a cada hover ou movimento do mouse.
  const mapContent = useMemo(() => {
    return (
      <>
        <Sphere
          id="mef-sphere"
          fill="url(#mef-ocean)"
          stroke="oklch(0.62 0.09 240 / 0.4)"
          strokeWidth={hair * 1.4}
        />
        <Graticule
          step={[20, 20]}
          stroke="oklch(0.75 0.03 240 / 0.10)"
          strokeWidth={hair * 0.8}
          fill="none"
        />
        <Graticule
          step={[360, 90]}
          stroke="oklch(0.82 0.14 78 / 0.14)"
          strokeWidth={hair * 1.2}
          fill="none"
        />

        <Geographies geography={GEO_URL}>
          {({ geographies }: { geographies: GeoFeature[] }) => {
            if (geographies.length && !ready) queueMicrotask(() => setReady(true));
            return geographies.map((geo) => {
              const country = byCcn3.get(String(Number(geo.id)));
              const dimmed = isFiltered(country);
              const isSelected = country?.cca2 === selectedCode;
              const status = country && statusMap ? statusMap.get(country.cca2) : "none";
              const verified = Boolean(country && verifiedSet?.has(country.cca2));

              const baseFill = verified
                ? "var(--map-verified)"
                : status === "visited"
                  ? "var(--map-visited)"
                  : status === "wishlist"
                    ? "var(--map-wishlist)"
                    : "url(#mef-land)";

              const hoverFill = isSelected
                ? "var(--map-selected)"
                : verified
                  ? "var(--map-verified)"
                  : status === "visited"
                    ? "var(--map-visited)"
                    : status === "wishlist"
                      ? "var(--map-wishlist)"
                      : "var(--map-land-hover)";

              // Só o país selecionado ganha um contorno em destaque — sem
              // filtro de sombra (blur), é caro demais de repintar durante
              // arraste/zoom em qualquer dispositivo, principalmente no
              // celular. Verificado/visitado já se distinguem bem só pela cor.
              const strokeColor = isSelected
                ? "var(--map-selected)"
                : verified
                  ? "var(--map-verified)"
                  : "var(--map-stroke)";
              const strokeW = isSelected ? hair * 2.4 : verified ? hair * 1.4 : hair;

              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  onMouseEnter={() => handleEnterCountry(country)}
                  onMouseLeave={handleLeaveCountry}
                  onClick={() => handleClickCountry(country)}
                  style={{
                    default: {
                      fill: baseFill,
                      stroke: strokeColor,
                      strokeWidth: strokeW,
                      strokeLinejoin: "round",
                      outline: "none",
                      transition: "fill 0.2s ease, opacity 0.2s ease",
                      cursor: country ? "pointer" : "default",
                      opacity: dimmed ? 0.28 : 1,
                    },
                    hover: {
                      fill: hoverFill,
                      stroke: "var(--map-selected)",
                      strokeWidth: hair * 1.8,
                      strokeLinejoin: "round",
                      outline: "none",
                      cursor: "pointer",
                    },
                    pressed: {
                      fill: "var(--map-selected)",
                      outline: "none",
                    },
                  }}
                  aria-label={country ? getPtName(country) : undefined}
                  tabIndex={-1}
                />
              );
            });
          }}
        </Geographies>

        {/* Alfinete pulsante no país selecionado */}
        {selectedCountry?.latlng && (
          <Marker coordinates={[selectedCountry.latlng[1], selectedCountry.latlng[0]]}>
            <circle
              r={9 / zoom}
              fill="none"
              stroke="var(--map-selected)"
              strokeWidth={1.4 / zoom}
              opacity={0.9}
            >
              <animate
                attributeName="r"
                values={`${4 / zoom};${13 / zoom}`}
                dur="1.8s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                values="0.85;0"
                dur="1.8s"
                repeatCount="indefinite"
              />
            </circle>
            <circle r={2.4 / zoom} fill="var(--map-selected)" />
          </Marker>
        )}
      </>
    );
  }, [
    byCcn3,
    countries,
    hair,
    isFiltered,
    ready,
    selectedCode,
    selectedCountry,
    statusMap,
    verifiedSet,
    zoom,
    handleEnterCountry,
    handleLeaveCountry,
    handleClickCountry,
  ]);

  return (
    <div className="w-full">
    <div
      ref={wrapRef}
      onPointerEnter={refreshRect}
      onPointerMove={handlePointerMove}
      className="group/map relative aspect-[16/10] w-full touch-none overflow-hidden rounded-3xl border border-border bg-[color:var(--map-ocean)] shadow-panel [&_svg]:touch-none"
      style={{ touchAction: "none", overscrollBehavior: "contain" }}
    >
      <ComposableMap
        projection="geoEqualEarth"
        projectionConfig={{ scale: 165 }}
        style={{ width: "100%", height: "100%" }}
      >
        <defs>
          {/* Oceano com profundidade */}
          <radialGradient id="mef-ocean" cx="50%" cy="38%" r="78%">
            <stop offset="0%" stopColor="oklch(0.24 0.035 250)" />
            <stop offset="55%" stopColor="oklch(0.17 0.026 255)" />
            <stop offset="100%" stopColor="oklch(0.11 0.016 262)" />
          </radialGradient>
          {/* Relevo sutil nos continentes */}
          <linearGradient id="mef-land" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.42 0.024 255)" />
            <stop offset="100%" stopColor="oklch(0.33 0.02 258)" />
          </linearGradient>
        </defs>

        <ZoomableGroup
          zoom={zoom}
          center={center}
          onMoveEnd={({ zoom: z, coordinates }) => {
            setZoom(z);
            setCenter(coordinates as [number, number]);
          }}
          minZoom={MIN_ZOOM}
          maxZoom={MAX_ZOOM}
          translateExtent={[
            [0, 0],
            [800, 600],
          ]}
        >
          {mapContent}
        </ZoomableGroup>
      </ComposableMap>

      {/* Vinheta / brilho de borda */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-3xl"
        style={{
          boxShadow:
            "inset 0 0 90px rgba(0,0,0,0.42), inset 0 1px 0 oklch(1 0 0 / 0.05)",
          background:
            "radial-gradient(ellipse 70% 55% at 50% 0%, oklch(0.82 0.14 78 / 0.05), transparent 65%)",
        }}
      />

      {/* Skeleton de carregamento */}
      <AnimatePresence>
        {!ready && (
          <motion.div
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 grid place-items-center bg-[color:var(--map-ocean)]/80 backdrop-blur-[2px]"
          >
            <div className="flex flex-col items-center gap-3">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-border border-t-primary" />
              <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Desenhando o mundo
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controles */}
      <div className="absolute right-3 top-3 flex flex-col items-center gap-1.5">
        <div className="flex flex-col overflow-hidden rounded-full border border-border bg-surface/80 shadow-card backdrop-blur">
          <ControlBtn label="Aumentar zoom" onClick={zoomIn} disabled={zoom >= MAX_ZOOM - 0.001}>
            <Plus className="h-4 w-4" />
          </ControlBtn>
          <span aria-hidden className="mx-auto h-px w-5 bg-border" />
          <ControlBtn label="Diminuir zoom" onClick={zoomOut} disabled={zoom <= MIN_ZOOM + 0.001}>
            <Minus className="h-4 w-4" />
          </ControlBtn>
        </div>
        <AnimatePresence>
          {!atHome && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={reset}
              aria-label="Voltar à visão do mundo"
              className="grid h-9 w-9 place-items-center rounded-full border border-border bg-surface/80 text-muted-foreground shadow-card backdrop-blur transition-colors hover:border-primary/50 hover:text-primary"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </motion.button>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {zoom > 1.05 && (
            <motion.span
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="rounded-full border border-border bg-surface/80 px-2 py-0.5 text-[10px] font-semibold tabular-nums text-muted-foreground backdrop-blur"
            >
              {zoom.toFixed(1)}×
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Legenda (sobre o mapa apenas em telas maiores) */}
      <div className="pointer-events-none absolute bottom-3 left-3 hidden flex-wrap items-center gap-x-2.5 gap-y-1 rounded-full border border-border bg-surface/70 px-3 py-1.5 text-[10px] text-muted-foreground backdrop-blur sm:flex">
        <LegendDot color="var(--map-verified)" label="verificado" glow />
        <LegendDot color="var(--map-visited)" label="declarei" />
        <LegendDot color="var(--map-wishlist)" label="quero ir" />
      </div>

      {/* Dica de navegação */}
      <div className="pointer-events-none absolute bottom-3 right-3 hidden rounded-full border border-border bg-surface/60 px-2.5 py-1 text-[10px] text-muted-foreground/80 backdrop-blur sm:block">
        arraste para mover · role para dar zoom
      </div>

      {/* Âncora da tooltip: só o transform é atualizado a cada mousemove,
          via DOM direto — nada disso passa pelo estado do React. */}
      <div
        ref={tooltipAnchorRef}
        className="pointer-events-none absolute left-0 top-0 z-20"
        style={{ willChange: "transform" }}
      >
        <AnimatePresence>
          {hovered && (
            <motion.div
              key={hovered.cca2}
              initial={{ opacity: 0, y: 4, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.96 }}
              transition={{ duration: 0.12 }}
              className="flex items-center gap-2 rounded-xl border border-border bg-surface-elevated/95 px-3 py-2 text-xs shadow-panel backdrop-blur"
            >
              <img
                src={hovered.flags.svg}
                alt=""
                className="h-4 w-6 rounded-sm object-cover ring-1 ring-border"
              />
              <span className="font-medium text-foreground">{getPtName(hovered)}</span>
              {verifiedSet?.has(hovered.cca2) && (
                <span className="rounded-full bg-primary/20 px-1.5 py-0.5 text-[9px] font-semibold text-primary">
                  ✓
                </span>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>

      {/* Legenda no celular, abaixo do mapa */}
      <div className="mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[10px] text-muted-foreground sm:hidden">
        <LegendDot color="var(--map-verified)" label="verificado" glow />
        <LegendDot color="var(--map-visited)" label="declarei" />
        <LegendDot color="var(--map-wishlist)" label="quero ir" />
        <span className="text-muted-foreground/60">· toque num país</span>
      </div>
    </div>
  );
}

function LegendDot({ color, label, glow }: { color: string; label: string; glow?: boolean }) {
  return (
    <span className="flex items-center gap-1">
      <span
        className="h-2 w-2 rounded-full"
        style={{
          background: color,
          boxShadow: glow ? `0 0 6px ${color}` : undefined,
        }}
      />
      {label}
    </span>
  );
}

function ControlBtn({
  children,
  onClick,
  label,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      disabled={disabled}
      className="grid h-9 w-9 place-items-center text-muted-foreground transition-colors hover:text-primary disabled:opacity-30 disabled:hover:text-muted-foreground"
    >
      {children}
    </button>
  );
}

export const WorldMap = memo(WorldMapInner);

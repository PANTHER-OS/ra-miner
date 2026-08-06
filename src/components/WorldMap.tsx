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
import { Minus, Plus, RotateCcw, MapPin, ChevronRight } from "lucide-react";
import type { Country } from "@/lib/countries";
import { getPtName } from "@/lib/countries";
import type { PassportStatus } from "@/lib/passport";
import { getVisibleCities, projectPoint, PROJECTION_SCALE, type CityWithCountry } from "@/lib/cities";

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const MIN_ZOOM = 1;
// Antes ia só até 8x — em regiões com muitos países pequenos e próximos
// (Caribe, Bálcãs, Golfo Pérsico...) isso não deixava zoom suficiente pra
// separar um país do outro com o dedo/mouse. 16x dá bastante margem pra
// isolar qualquer país individualmente antes de tocar.
const MAX_ZOOM = 16;
// [0, 0] (Greenwich/equador) é o único ponto que a projeção já posiciona
// exatamente no centro geométrico da viewBox (400, 300 numa caixa de
// 800x600), sem precisar de nenhum deslocamento extra. Qualquer outro valor
// aqui (ex: [15, 15], usado antes) faz o ZoomableGroup recalcular um
// deslocamento em pixels para "puxar" aquele ponto até o centro — e esse
// deslocamento quebra a simetria do globo, fazendo-o nascer torto (e voltar
// torto ao redefinir) em qualquer tela, celular ou desktop.
const HOME_CENTER: [number, number] = [0, 0];

// Cidades aparecem sozinhas conforme o usuário dá zoom em QUALQUER lugar do
// mapa — não é preciso selecionar um país. Perto (zoom baixo) só as mais
// relevantes de cada país visível aparecem; aproximando mais, cidades um
// pouco menos centrais (mas ainda entre as principais) vão se somando —
// como abrir um mapa físico e ir enxergando mais detalhe aos poucos.
function maxCityRankForZoom(zoom: number): number {
  if (zoom < 1.8) return -1; // nada, visão de mundo/continente
  if (zoom < 2.4) return 0; // só a mais relevante de cada país
  if (zoom < 3.0) return 1;
  if (zoom < 4.5) return 3; // zoom de quando um país é selecionado (3.2) cai aqui
  if (zoom < 6) return 5;
  return 9; // tudo que tiver disponível
}
const CITY_MARKER_LIMIT = 60; // teto defensivo pra não poluir em regiões muito densas

type VisibleCity = CityWithCountry & { showLabel: boolean };

// Quando 2+ marcadores caem tão perto na tela que ficam grudados — bairros
// da mesma cidade, distritos de um país minúsculo como Mônaco — não tem
// zoom que resolva isso sozinho (a distância real entre eles é curta
// demais). A solução é agrupar: em vez de pontos impossíveis de separar
// com o dedo, um único alvo maior e clicável, que ao ser tocado mostra a
// lista pra escolher o lugar certo.
type CityGroup =
  | { kind: "single"; city: VisibleCity }
  | { kind: "cluster"; cities: CityWithCountry[]; px: number; py: number; lng: number; lat: number };

function cityMarkerColor(c: { capital?: boolean; landmark?: boolean }): string {
  if (c.landmark) return "oklch(0.72 0.14 155)"; // verde — marco natural
  if (c.capital) return "var(--map-selected)"; // dourado — capital
  return "oklch(0.86 0.15 85)"; // dourado claro — cidade comum
}

// world-atlas@2 em resolução 110m — a que dá pra manter o mapa leve — não
// tem forma própria pra dezenas de territórios pequenos demais (Mônaco,
// Liechtenstein, San Marino, Andorra, Malta, várias ilhas do Caribe e do
// Pacífico...). Sem forma, não tem como clicar: o polígono simplesmente não
// existe no arquivo, então o clique nunca acerta nada ali. A solução é um
// alfinete "de reserva", com a mesma cor de bandeira do país, plantado
// exatamente nas coordenadas do país — clicável mesmo sem forma nenhuma por
// baixo. Descoberto comparando ao vivo os países carregados contra os IDs
// que realmente vêm na topologia (ver setPresentCcn3 abaixo).
const COUNTRY_PIN_REVEAL_ZOOM = 1.6;
const COUNTRY_PIN_COLOR = "oklch(0.75 0.13 220)"; // azul — distingue de cidade (dourado) e marco natural (verde)

interface CountryPin {
  country: Country;
  lat: number;
  lng: number;
  px: number;
  py: number;
}

type CountryPinGroup =
  | { kind: "single"; pin: CountryPin; showLabel: boolean }
  | { kind: "cluster"; pins: CountryPin[]; px: number; py: number; lng: number; lat: number };

// O popover de "vários lugares aqui perto" serve tanto pra cidades quanto
// pra países sem forma no mapa — cada item sabe escolher a própria ação.
type PopoverItem =
  | { kind: "city"; ref: CityWithCountry }
  | { kind: "country"; ref: Country };

interface Props {
  countries: Country[];
  selectedCode: string | null;
  onSelect: (c: Country | null) => void;
  onSelectCity?: (city: CityWithCountry) => void;
  focusCity?: { lat: number; lng: number; nonce: number } | null;
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
  onSelectCity,
  focusCity,
  filterRegion,
  statusMap,
  verifiedSet,
  viewMode = "all",
}: Props) {
  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState<[number, number]>(HOME_CENTER);
  const [hovered, setHovered] = useState<Country | null>(null);
  const [hoveredCity, setHoveredCity] = useState<CityWithCountry | null>(null);
  const [popover, setPopover] = useState<{ items: PopoverItem[]; x: number; y: number } | null>(null);
  const [ready, setReady] = useState(false);
  // IDs (ccn3, numéricos) realmente presentes na topologia carregada — usado
  // pra descobrir quais países da nossa lista NÃO têm forma própria no mapa
  // e por isso precisam do alfinete de reserva.
  const [presentCcn3, setPresentCcn3] = useState<Set<string> | null>(null);
  // O ZoomableGroup calcula a posição inicial a partir do tamanho REAL do
  // container no momento em que monta. Se as fontes (Google Fonts, via
  // <link>) ainda não carregaram, o texto acima do mapa pode mudar de
  // altura logo em seguida e empurrar o mapa — resultado: ele nasce
  // "torto" e só se corrige quando o usuário mexe (o que força um
  // recálculo). Por isso só montamos o mapa depois que o layout de fato
  // se assentou.
  const [layoutSettled, setLayoutSettled] = useState(false);
  // Força o ZoomableGroup a remontar do zero ao "redefinir" — evita que o
  // zoom/pan interno da biblioteca herde uma transformação antiga e volte
  // deslocado para um dos lados em vez de perfeitamente centralizado.
  const [mapInstanceKey, setMapInstanceKey] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const tooltipAnchorRef = useRef<HTMLDivElement>(null);
  const rectRef = useRef<DOMRect | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    const settle = () => {
      // Mais um frame depois do "fonts ready" pra garantir que o reflow do
      // texto (se houver) já aconteceu antes do mapa medir o container.
      requestAnimationFrame(() => {
        if (!cancelled) setLayoutSettled(true);
      });
    };
    if (typeof document !== "undefined" && "fonts" in document) {
      document.fonts.ready.then(settle).catch(settle);
    } else {
      settle();
    }
    return () => {
      cancelled = true;
    };
  }, []);

  // Fast lookup by numeric code
  const byCcn3 = useMemo(() => {
    const m = new Map<string, Country>();
    for (const c of countries) m.set(String(Number(c.ccn3)), c);
    return m;
  }, [countries]);

  // Lookup por cca2 — usado na tooltip das cidades, já que com vários
  // países visíveis ao mesmo tempo é útil mostrar de qual país é cada uma.
  const byCca2 = useMemo(() => {
    const m = new Map<string, Country>();
    for (const c of countries) m.set(c.cca2, c);
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

  // Foco numa cidade específica (via busca ou clique num marcador) — voa
  // pra mais perto dela, além do zoom de país já aplicado acima.
  useEffect(() => {
    if (!focusCity) return;
    setCenter([focusCity.lng, focusCity.lat]);
    setZoom((z) => Math.max(z, 6));
  }, [focusCity]);

  const atHome = zoom === 1 && center[0] === HOME_CENTER[0] && center[1] === HOME_CENTER[1];

  const reset = () => {
    setZoom(1);
    setCenter(HOME_CENTER);
    setMapInstanceKey((k) => k + 1);
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

  const handleEnterCity = useCallback((c: CityWithCountry) => {
    setHoveredCity(c);
    setHovered(null);
  }, []);
  const handleLeaveCity = useCallback(() => setHoveredCity(null), []);
  const handleClickCity = useCallback(
    (c: CityWithCountry) => {
      onSelectCity?.(c);
    },
    [onSelectCity],
  );

  const openPopover = useCallback((e: React.MouseEvent, items: PopoverItem[]) => {
    // Posição fixa (relativa à JANELA, não a nenhum container) — o mapa em
    // zoom alto costuma ocupar mais altura do que cabe na tela, então
    // clamping relativo ao container não garante nada; usando a janela
    // direto, o popover sempre fica visível não importa onde o cluster
    // esteja na página.
    const POPOVER_WIDTH = 208;
    const rowH = 44;
    const estimatedHeight = Math.min(36 + items.length * rowH, 280);
    const spaceBelow = window.innerHeight - e.clientY;
    // Abre pra cima se não couber embaixo do toque.
    const y =
      spaceBelow > estimatedHeight + 16
        ? Math.min(e.clientY + 12, window.innerHeight - estimatedHeight - 8)
        : Math.max(8, e.clientY - estimatedHeight - 12);
    const x = Math.max(8, Math.min(e.clientX - POPOVER_WIDTH / 2, window.innerWidth - POPOVER_WIDTH - 8));
    setHoveredCity(null);
    setHovered(null);
    setPopover({ items, x, y });
  }, []);

  const handleClickCluster = useCallback(
    (e: React.MouseEvent, cities: CityWithCountry[]) => {
      openPopover(
        e,
        cities.map((c): PopoverItem => ({ kind: "city", ref: c })),
      );
    },
    [openPopover],
  );

  const handleClickCountryCluster = useCallback(
    (e: React.MouseEvent, list: Country[]) => {
      openPopover(
        e,
        list.map((c): PopoverItem => ({ kind: "country", ref: c })),
      );
    },
    [openPopover],
  );

  const handlePickFromPopover = useCallback(
    (item: PopoverItem) => {
      setPopover(null);
      if (item.kind === "city") onSelectCity?.(item.ref);
      else onSelect(item.ref);
    },
    [onSelectCity, onSelect],
  );

  // Fecha o popover ao clicar fora dele ou apertar Esc.
  useEffect(() => {
    if (!popover) return;
    const onDown = (e: Event) => {
      const target = e.target as Node;
      if (popoverRef.current?.contains(target)) return;
      setPopover(null);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setPopover(null);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [popover]);

  // Cidades visíveis na área atual do mapa — não depende de nenhum país
  // estar selecionado: é só dar zoom em qualquer lugar do mundo. Quanto
  // mais perto, mais cidades (mesmo as "menos principais") vão se somando.
  // A matemática replica o que o ZoomableGroup já faz internamente: projeta
  // o centro atual e recorta um retângulo do tamanho da viewBox (800x600)
  // dividido pelo zoom — sem precisar de nenhuma referência interna da lib.
  const cityGroups = useMemo<CityGroup[]>(() => {
    const maxRank = maxCityRankForZoom(zoom);
    if (maxRank < 0) return [];
    const [cx, cy] = projectPoint(center[0], center[1]);
    const visible = getVisibleCities(cx, cy, zoom, maxRank, CITY_MARKER_LIMIT);

    // Passo 1 — agrupamento: quando os CÍRCULOS de dois marcadores ficariam
    // sobrepostos na tela (bairros da mesma cidade, distritos de um país
    // minúsculo como Mônaco — nenhum zoom no mundo separa isso, a distância
    // real é curta demais), junta num único grupo clicável maior. `visible`
    // já vem ordenado por relevância, então o primeiro membro de cada grupo
    // é sempre o mais importante — é ele quem "ancora" a posição do grupo.
    const CLUSTER_RADIUS_PX = 18;
    const clusterGapProj = CLUSTER_RADIUS_PX / zoom;
    const rawGroups: CityWithCountry[][] = [];
    for (const c of visible) {
      const group = rawGroups.find((g) => {
        const anchor = g[0];
        return Math.hypot(anchor.px - c.px, anchor.py - c.py) < clusterGapProj;
      });
      if (group) group.push(c);
      else rawGroups.push([c]);
    }

    // Passo 2 — declutter de rótulo: só se aplica a marcadores SOZINHOS (um
    // cluster já tem seu próprio contador, não precisa de nome embaixo). Em
    // regiões com muitos países pequenos e próximos (Balcãs, Golfo Pérsico,
    // Caribe...), vários nomes ainda colidiriam entre si mesmo sem cluster —
    // mantém o ponto no mapa, mas só escreve quem não colide com um rótulo
    // já desenhado (o nome ainda aparece ao passar o mouse).
    const MIN_LABEL_GAP_PX = 46;
    const minGapProj = MIN_LABEL_GAP_PX / zoom;
    const placedLabels: { px: number; py: number }[] = [];

    return rawGroups.map((g): CityGroup => {
      if (g.length === 1) {
        const c = g[0];
        const tooClose = placedLabels.some(
          (p) => Math.hypot(p.px - c.px, p.py - c.py) < minGapProj,
        );
        if (!tooClose) placedLabels.push({ px: c.px, py: c.py });
        return { kind: "single", city: { ...c, showLabel: !tooClose } };
      }
      const anchor = g[0];
      return { kind: "cluster", cities: g, px: anchor.px, py: anchor.py, lng: anchor.lng, lat: anchor.lat };
    });
  }, [center, zoom]);

  // Países sem forma própria na topologia (ver comentário na constante
  // COUNTRY_PIN_REVEAL_ZOOM) — a posição de cada um só precisa ser
  // recalculada quando a LISTA de países ausentes muda, não a cada
  // zoom/arraste.
  const missingCountryPins = useMemo<CountryPin[]>(() => {
    if (!presentCcn3) return [];
    const pins: CountryPin[] = [];
    for (const c of countries) {
      if (!c.latlng || !c.ccn3) continue;
      if (presentCcn3.has(String(Number(c.ccn3)))) continue;
      const [px, py] = projectPoint(c.latlng[1], c.latlng[0]);
      pins.push({ country: c, lat: c.latlng[0], lng: c.latlng[1], px, py });
    }
    return pins;
  }, [countries, presentCcn3]);

  // Mesma lógica de área visível + agrupamento das cidades, aplicada aos
  // alfinetes de país — assim ilhas próximas (Caribe, Pacífico) ou países
  // vizinhos minúsculos (Vaticano perto de San Marino) também viram um
  // cluster único em vez de se atropelarem na tela.
  const countryPinGroups = useMemo<CountryPinGroup[]>(() => {
    if (zoom < COUNTRY_PIN_REVEAL_ZOOM || !missingCountryPins.length) return [];
    const [cx, cy] = projectPoint(center[0], center[1]);
    const halfW = 400 / zoom;
    const halfH = 300 / zoom;
    const minX = cx - halfW;
    const maxX = cx + halfW;
    const minY = cy - halfH;
    const maxY = cy + halfH;
    const visible = missingCountryPins.filter(
      (p) => p.px >= minX && p.px <= maxX && p.py >= minY && p.py <= maxY,
    );

    const CLUSTER_RADIUS_PX = 18;
    const clusterGapProj = CLUSTER_RADIUS_PX / zoom;
    const rawGroups: CountryPin[][] = [];
    for (const p of visible) {
      const group = rawGroups.find((g) => Math.hypot(g[0].px - p.px, g[0].py - p.py) < clusterGapProj);
      if (group) group.push(p);
      else rawGroups.push([p]);
    }

    const MIN_LABEL_GAP_PX = 44;
    const minGapProj = MIN_LABEL_GAP_PX / zoom;
    const placedLabels: { px: number; py: number }[] = [];
    return rawGroups.map((g): CountryPinGroup => {
      if (g.length === 1) {
        const p = g[0];
        const tooClose = placedLabels.some((pl) => Math.hypot(pl.px - p.px, pl.py - p.py) < minGapProj);
        if (!tooClose) placedLabels.push({ px: p.px, py: p.py });
        return { kind: "single", pin: p, showLabel: !tooClose };
      }
      const anchor = g[0];
      return { kind: "cluster", pins: g, px: anchor.px, py: anchor.py, lng: anchor.lng, lat: anchor.lat };
    });
  }, [missingCountryPins, center, zoom]);

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
            if (geographies.length && !presentCcn3) {
              const ids = new Set(geographies.map((g) => String(Number(g.id))));
              queueMicrotask(() => setPresentCcn3(ids));
            }
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
                    // pointerEvents: "fill" é a correção do "piscar" perto de
                    // fronteiras: por padrão o SVG conta a BORDA (stroke)
                    // como área clicável também, e como o hover deixa a
                    // borda mais grossa, ela passa a invadir visualmente o
                    // país vizinho — o que faz o mouse, parado no mesmo
                    // pixel, ficar alternando entre os dois países (e o
                    // hover/tooltip "piscando" junto). Restringindo a área
                    // de interação só ao preenchimento, a borda pode
                    // engrossar à vontade sem nunca roubar o hover do vizinho.
                    default: {
                      fill: baseFill,
                      stroke: strokeColor,
                      strokeWidth: strokeW,
                      strokeLinejoin: "round",
                      outline: "none",
                      pointerEvents: "fill",
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
                      pointerEvents: "fill",
                      cursor: "pointer",
                    },
                    pressed: {
                      fill: "var(--map-selected)",
                      outline: "none",
                      pointerEvents: "fill",
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

        {/* Cidades visíveis na área do mapa — reveladas aos poucos conforme o
            zoom aumenta, cada uma "entrando" com uma animação suave. Marcadores
            que ficariam grudados na tela (sem zoom que resolva) viram um
            único cluster clicável com contador. */}
        <AnimatePresence>
          {cityGroups.map((g, i) =>
            g.kind === "single" ? (
              <Marker key={`${g.city.cca2}-${g.city.name}`} coordinates={[g.city.lng, g.city.lat]}>
                <motion.g
                  initial={{ opacity: 0, scale: 0.3 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.3 }}
                  transition={{ delay: Math.min(i, 14) * 0.035, type: "spring", stiffness: 320, damping: 22 }}
                  onMouseEnter={() => handleEnterCity(g.city)}
                  onMouseLeave={handleLeaveCity}
                  onClick={() => handleClickCity(g.city)}
                  style={{ cursor: "pointer" }}
                >
                  <circle
                    r={(g.city.capital ? 5 : 3.6) / zoom}
                    fill={cityMarkerColor(g.city)}
                    stroke="oklch(0.14 0.02 260)"
                    strokeWidth={1.1 / zoom}
                  />
                  <circle
                    r={(g.city.capital ? 9 : 7) / zoom}
                    fill="none"
                    stroke={cityMarkerColor(g.city)}
                    strokeWidth={0.8 / zoom}
                    opacity={0.35}
                  />
                  {g.city.showLabel && (
                    <text
                      textAnchor="middle"
                      y={-9 / zoom}
                      fontSize={9.5 / zoom}
                      fontWeight={600}
                      fill="oklch(0.97 0.015 90)"
                      stroke="oklch(0.1 0.02 260)"
                      strokeWidth={2.4 / zoom}
                      paintOrder="stroke"
                      style={{ pointerEvents: "none" }}
                    >
                      {g.city.name}
                    </text>
                  )}
                </motion.g>
              </Marker>
            ) : (
              <Marker key={`cluster-${g.cities[0].cca2}-${g.cities[0].name}`} coordinates={[g.lng, g.lat]}>
                <motion.g
                  initial={{ opacity: 0, scale: 0.3 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.3 }}
                  transition={{ delay: Math.min(i, 14) * 0.035, type: "spring", stiffness: 320, damping: 22 }}
                  onMouseEnter={() => handleEnterCity(g.cities[0])}
                  onMouseLeave={handleLeaveCity}
                  onClick={(e) => handleClickCluster(e, g.cities)}
                  style={{ cursor: "pointer" }}
                >
                  <circle
                    r={11 / zoom}
                    fill="oklch(0.22 0.03 260)"
                    stroke={cityMarkerColor(g.cities[0])}
                    strokeWidth={1.6 / zoom}
                  />
                  <text
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={10 / zoom}
                    fontWeight={700}
                    fill="oklch(0.97 0.015 90)"
                    style={{ pointerEvents: "none" }}
                  >
                    {g.cities.length}
                  </text>
                </motion.g>
              </Marker>
            ),
          )}
        </AnimatePresence>

        {/* Alfinetes de reserva pra países sem forma própria na topologia
            (Mônaco, Liechtenstein, San Marino, Malta, Andorra, várias ilhas
            do Caribe e do Pacífico...) — sem isso, esses países não têm
            NENHUM jeito de serem clicados no mapa, só pela busca. Clicar
            aqui funciona exatamente como clicar na forma de um país normal. */}
        <AnimatePresence>
          {countryPinGroups.map((g, i) =>
            g.kind === "single" ? (
              <Marker key={`pin-${g.pin.country.cca2}`} coordinates={[g.pin.lng, g.pin.lat]}>
                <motion.g
                  initial={{ opacity: 0, scale: 0.3 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.3 }}
                  transition={{ delay: Math.min(i, 14) * 0.035, type: "spring", stiffness: 320, damping: 22 }}
                  onMouseEnter={() => handleEnterCountry(g.pin.country)}
                  onMouseLeave={handleLeaveCountry}
                  onClick={() => handleClickCountry(g.pin.country)}
                  style={{ cursor: "pointer" }}
                >
                  <defs>
                    <clipPath id={`flagclip-${g.pin.country.cca2}`}>
                      <circle r={6.5 / zoom} />
                    </clipPath>
                  </defs>
                  <circle
                    r={8 / zoom}
                    fill="oklch(0.16 0.02 260)"
                    stroke={COUNTRY_PIN_COLOR}
                    strokeWidth={1.6 / zoom}
                  />
                  <image
                    href={g.pin.country.flags.png}
                    x={-6.5 / zoom}
                    y={-6.5 / zoom}
                    width={13 / zoom}
                    height={13 / zoom}
                    clipPath={`url(#flagclip-${g.pin.country.cca2})`}
                    preserveAspectRatio="xMidYMid slice"
                    style={{ pointerEvents: "none" }}
                  />
                  {g.showLabel && (
                    <text
                      textAnchor="middle"
                      y={-10 / zoom}
                      fontSize={9.5 / zoom}
                      fontWeight={600}
                      fill="oklch(0.97 0.015 90)"
                      stroke="oklch(0.1 0.02 260)"
                      strokeWidth={2.4 / zoom}
                      paintOrder="stroke"
                      style={{ pointerEvents: "none" }}
                    >
                      {getPtName(g.pin.country)}
                    </text>
                  )}
                </motion.g>
              </Marker>
            ) : (
              <Marker key={`pincluster-${g.pins[0].country.cca2}`} coordinates={[g.lng, g.lat]}>
                <motion.g
                  initial={{ opacity: 0, scale: 0.3 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.3 }}
                  transition={{ delay: Math.min(i, 14) * 0.035, type: "spring", stiffness: 320, damping: 22 }}
                  onClick={(e) => handleClickCountryCluster(e, g.pins.map((p) => p.country))}
                  style={{ cursor: "pointer" }}
                >
                  <circle
                    r={11 / zoom}
                    fill="oklch(0.18 0.035 230)"
                    stroke={COUNTRY_PIN_COLOR}
                    strokeWidth={1.6 / zoom}
                  />
                  <text
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={10 / zoom}
                    fontWeight={700}
                    fill="oklch(0.97 0.015 90)"
                    style={{ pointerEvents: "none" }}
                  >
                    {g.pins.length}
                  </text>
                </motion.g>
              </Marker>
            ),
          )}
        </AnimatePresence>
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
    cityGroups,
    handleEnterCity,
    handleLeaveCity,
    handleClickCity,
    handleClickCluster,
    countryPinGroups,
    handleClickCountryCluster,
  ]);

  return (
    <div className="relative w-full">
    <div
      ref={wrapRef}
      onPointerEnter={refreshRect}
      onPointerMove={handlePointerMove}
      // No celular, a proporção 4:3 bate exatamente com a caixa interna do
      // mapa (800x600 = 4:3) — zero faixa vazia (letterbox) em cima/embaixo,
      // então o mapa ocupa a tela toda que dá, o que já facilita bastante
      // tocar num país pequeno. Do sm: pra cima, sobra tela de sobra e a
      // proporção mais cinematográfica (16:10) volta a fazer sentido.
      className="group/map relative aspect-[4/3] w-full touch-none overflow-hidden rounded-3xl border border-border bg-[color:var(--map-ocean)] shadow-panel [&_svg]:touch-none sm:aspect-[16/10]"
      style={{ touchAction: "none", overscrollBehavior: "contain" }}
    >
      {layoutSettled && (
        <ComposableMap
          projection="geoEqualEarth"
          projectionConfig={{ scale: PROJECTION_SCALE }}
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
            key={mapInstanceKey}
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
      )}

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
        {(!ready || !layoutSettled) && (
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
              className="grid h-10 w-10 place-items-center rounded-full border border-border bg-surface/80 text-muted-foreground shadow-card backdrop-blur transition-colors hover:border-primary/50 hover:text-primary sm:h-9 sm:w-9"
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
          {hoveredCity && (
            <motion.div
              key={`city-${hoveredCity.name}`}
              initial={{ opacity: 0, y: 4, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.96 }}
              transition={{ duration: 0.12 }}
              className="flex items-center gap-2 rounded-xl border border-border bg-surface-elevated/95 px-3 py-2 text-xs shadow-panel backdrop-blur"
            >
              <span className="font-medium text-foreground">{hoveredCity.name}</span>
              {hoveredCity.capital && (
                <span className="rounded-full bg-primary/20 px-1.5 py-0.5 text-[9px] font-semibold text-primary">
                  capital
                </span>
              )}
              {hoveredCity.landmark && (
                <span className="rounded-full bg-[oklch(0.72_0.14_155_/_0.2)] px-1.5 py-0.5 text-[9px] font-semibold text-[oklch(0.72_0.14_155)]">
                  marco natural
                </span>
              )}
              <span className="text-muted-foreground">
                {byCca2.get(hoveredCity.cca2) ? getPtName(byCca2.get(hoveredCity.cca2)!) : ""} · toque para ver
                atrações
              </span>
            </motion.div>
          )}
          {!hoveredCity && hovered && (
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

      {/* Popover do cluster: alguns lugares ficam próximos demais na tela
          pra separar com zoom (bairros da mesma cidade, distritos de um
          país minúsculo, ilhas vizinhas) — toca no cluster e escolhe qual
          dos itens quis dizer, em vez de tentar acertar um pontinho
          impossível. Serve tanto pra cidades quanto pra países sem forma
          própria no mapa. Fica FORA da caixa do mapa (que corta qualquer
          coisa que passe da borda, overflow-hidden) — assim nunca aparece
          cortado perto de uma borda. */}
      <AnimatePresence>
        {popover && (
          <motion.div
            ref={popoverRef}
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            style={{ left: popover.x, top: popover.y }}
            className="fixed z-[70] w-52 overflow-hidden rounded-2xl border border-border bg-surface-elevated/98 p-1.5 shadow-panel backdrop-blur"
            role="menu"
          >
            <p className="px-2.5 pb-1.5 pt-1 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              {popover.items.length} lugares aqui perto
            </p>
            <ul className="max-h-64 space-y-0.5 overflow-y-auto">
              {popover.items.map((item) => {
                const key =
                  item.kind === "city" ? `city-${item.ref.cca2}-${item.ref.name}` : `country-${item.ref.cca2}`;
                const title = item.kind === "city" ? item.ref.name : getPtName(item.ref);
                const subtitle =
                  item.kind === "city"
                    ? byCca2.get(item.ref.cca2)
                      ? getPtName(byCca2.get(item.ref.cca2)!)
                      : ""
                    : "país inteiro";
                return (
                  <li key={key}>
                    <button
                      onClick={() => handlePickFromPopover(item)}
                      className="group flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left transition-colors hover:bg-muted/60"
                      role="menuitem"
                    >
                      {item.kind === "city" ? (
                        <span
                          className="grid h-6 w-6 shrink-0 place-items-center rounded-full"
                          style={{
                            background: `color-mix(in oklch, ${cityMarkerColor(item.ref)} 22%, transparent)`,
                          }}
                        >
                          <MapPin className="h-3.5 w-3.5" style={{ color: cityMarkerColor(item.ref) }} />
                        </span>
                      ) : (
                        <img
                          src={item.ref.flags.png}
                          alt=""
                          className="h-6 w-6 shrink-0 rounded-full object-cover ring-1 ring-border"
                        />
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1 truncate text-xs font-medium text-foreground">
                          {title}
                          {item.kind === "city" && item.ref.capital && (
                            <span className="text-[9px] text-primary">★</span>
                          )}
                        </span>
                        <span className="block truncate text-[10px] text-muted-foreground">{subtitle}</span>
                      </span>
                      <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5" />
                    </button>
                  </li>
                );
              })}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

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
      className="grid h-10 w-10 place-items-center text-muted-foreground transition-colors hover:text-primary disabled:opacity-30 disabled:hover:text-muted-foreground sm:h-9 sm:w-9"
    >
      {children}
    </button>
  );
}

export const WorldMap = memo(WorldMapInner);

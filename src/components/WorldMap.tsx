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
import {
  computeCountryLabel,
  APPROX_CHAR_WIDTH_FACTOR,
  type CountryLabelLayout,
  type GeoGeometry,
} from "@/lib/countryLabels";

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

// O ponto/anel visual de um marcador é pensado pra ficar discreto (uns 4 a
// 9px de raio) — ótimo pro mouse, mas minúsculo demais pro dedo, mesmo no
// zoom máximo. Em vez de aumentar o desenho (o que voltaria a poluir/colidir
// visualmente, o problema que acabamos de resolver), soma-se uma área de
// toque INVISÍVEL bem maior por baixo, só em dispositivo de toque — o
// visual não muda em nada, só fica bem mais fácil de acertar. 20px de raio
// (40px de diâmetro) está logo abaixo do mínimo de 44pt recomendado pela
// Apple/Google, com folga garantida pelo CLUSTER_RADIUS_PX de toque (44px):
// como só sobra sozinho na tela quem está a pelo menos 44px de qualquer
// outro marcador, duas áreas de toque de 20px nunca se sobrepõem.
const TOUCH_HIT_RADIUS_PX = 20;

// Rótulo de país escrito sobre o próprio território (ver src/lib/countryLabels.ts
// pra geometria: onde nasce, que tamanho tem, e o clip-path que garante que
// nunca ultrapassa a fronteira). Esses dois limites são só de TELA — abaixo
// do mínimo o texto vira ruído ilegível (nem desenha); acima do máximo, um
// país gigante bem no fundo do zoom mostraria letras enormes demais.
const MIN_LABEL_SCREEN_PX = 8;
const MAX_LABEL_SCREEN_PX = 38;

interface CountryPin {
  country: Country;
  lat: number;
  lng: number;
  px: number;
  py: number;
}

// Cidades e alfinetes de país eram dois sistemas de "evitar sobreposição"
// TOTALMENTE separados — cada um só verificava colisão contra o próprio
// tipo. Resultado: um país pequeno (Mônaco, San Marino...) podia acabar
// exatamente em cima do rótulo ou do ponto de uma cidade vizinha, porque
// nenhum dos dois sistemas sabia da existência do outro. A correção é
// tratar os dois como um único grupo de "coisas que ocupam espaço na
// tela" — mesmo cálculo de agrupamento e de rótulo, rodando uma vez só,
// considerando cidade e país juntos.
type MarkerPoint = { kind: "city"; city: CityWithCountry } | { kind: "country"; pin: CountryPin };

function markerPx(p: MarkerPoint): number {
  return p.kind === "city" ? p.city.px : p.pin.px;
}
function markerPy(p: MarkerPoint): number {
  return p.kind === "city" ? p.city.py : p.pin.py;
}
function markerLngLat(p: MarkerPoint): [number, number] {
  return p.kind === "city" ? [p.city.lng, p.city.lat] : [p.pin.lng, p.pin.lat];
}
// Cor do círculo quando vira cluster: se o item mais relevante do grupo
// (o "âncora") é uma cidade, usa a cor dela; se é um país sem forma
// própria, usa o azul do alfinete de bandeira.
function markerClusterColor(anchor: MarkerPoint): string {
  return anchor.kind === "city" ? cityMarkerColor(anchor.city) : COUNTRY_PIN_COLOR;
}
function markerLabelText(p: MarkerPoint): string {
  return p.kind === "city" ? p.city.name : getPtName(p.pin.country);
}
// Um nome curto ("Riga") e um comprido ("Podgorica") ocupam larguras bem
// diferentes na tela — usar um raio de colisão fixo pra todo mundo deixava
// nomes longos ainda colidindo com o vizinho mesmo "sem estar perto demais"
// pelo critério do nome curto. Aproxima a metade da largura real do texto
// renderizado (fonte 9.5px, negrito) a partir do nº de caracteres. `scale`
// acompanha o tamanho de fonte realmente usado no desenho (ver sizeScale)
// — sem isso, o texto maior no celular voltaria a colidir, já que o
// cálculo de espaço continuaria pensando no tamanho pequeno de antes.
function labelRadiusPx(text: string, scale: number): number {
  const approxCharWidth = 4.6 * scale;
  const halfWidth = (text.length * approxCharWidth) / 2 + 6 * scale;
  return Math.max(20 * scale, halfWidth);
}

type MarkerGroup =
  | { kind: "city"; city: VisibleCity }
  | { kind: "country"; pin: CountryPin; showLabel: boolean }
  | { kind: "cluster"; items: MarkerPoint[]; px: number; py: number; lng: number; lat: number };

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
  geometry: GeoGeometry;
};

interface CountryLabelEntry {
  rsmKey: string;
  layout: CountryLabelLayout;
  country: Country;
}

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
  // Layout (posição, tamanho, rotação, clip-path) do rótulo de cada país que
  // TEM forma própria na topologia — calculado uma única vez (é geometria
  // pura, não muda com zoom/pan/hover), igual presentCcn3 acima.
  const [labelEntries, setLabelEntries] = useState<CountryLabelEntry[] | null>(null);
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
  // Num toque, o dedo cobre uma área bem maior que a ponta de um cursor de
  // mouse — o ponto/anel visual de um marcador (pensado pra ficar discreto e
  // elegante) é chances mínimas de acertar de primeira num celular, mesmo no
  // zoom máximo (16x). "hover: none" é a forma padrão de detectar um
  // dispositivo cujo ponteiro PRINCIPAL é toque (não um mouse com touchscreen
  // acoplada) — só nesses casos alargamos a área de toque e o raio de
  // agrupamento, sem mexer em nada no desktop.
  const [touchTarget, setTouchTarget] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(hover: none) and (pointer: coarse)");
    const update = () => setTouchTarget(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
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

  const zoomIn = () => setZoom((z) => Math.min(z * 1.6, effectiveMaxZoom));
  const zoomOut = () => setZoom((z) => Math.max(z / 1.6, MIN_ZOOM));

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

  // Todo raio de marcador é escrito em "unidades do viewBox" (a caixa
  // interna de 800x600 do mapa) e não em pixels de tela — o navegador
  // escala essa caixa pra caber na largura REAL do container. Num celular
  // (~360px de largura), essa escala é bem menor que num desktop
  // (~1200px+), então o MESMO raio nominal nasce visualmente bem menor no
  // celular. É essa conversão implícita — não só o tamanho do ponto em si —
  // que fazia a área de toque real ficar minúscula. Medindo a largura real
  // do container, dá pra calcular quantas "unidades do viewBox" equivalem a
  // um alvo de X pixels de tela de verdade, não importa o tamanho da tela.
  const [mapWidthPx, setMapWidthPx] = useState(0);
  useEffect(() => {
    const measure = () => {
      if (wrapRef.current) setMapWidthPx(wrapRef.current.getBoundingClientRect().width);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [layoutSettled]);
  // 0 antes da primeira medição — cai pra 1:1 (sem conversão) só nesse
  // instante inicial, nunca chega a renderizar assim de fato.
  const svgUnitsPerScreenPx = mapWidthPx > 0 ? 800 / mapWidthPx : 1;
  // O tamanho do PONTO em si (não só a área de toque invisível) e do texto
  // do rótulo sofrem exatamente do mesmo problema: são um número fixo de
  // "unidades do viewBox", então nascem pequenos demais pra ler quando o
  // container é estreito. 1216px é a largura real do mapa num desktop
  // comum (medida a 1440px de janela, onde o visual já foi validado) — no
  // celular (~360-400px de largura), esse fator "reescala" ponto, anel e
  // texto pra cima o suficiente pra ficarem do mesmo tamanho de tela
  // (pixels de verdade) que já se via no desktop, em vez de encolher junto
  // com o container. Nunca encolhe nada (Math.max 1) — só cresce quando o
  // container é mais estreito que a referência, e só no toque, pra não
  // mudar nada no desktop.
  const REFERENCE_MAP_WIDTH_PX = 1216;
  const sizeScale = touchTarget && mapWidthPx > 0 ? Math.max(1, REFERENCE_MAP_WIDTH_PX / mapWidthPx) : 1;
  // O RAIO DE AGRUPAMENTO em toque (44px de tela — precisa ser grande pro
  // dedo, ver markerGroups) também é convertido pra unidades do viewBox
  // igual todo o resto — só que num container estreito, 44px de tela vira
  // um pedaço bem maior de MUNDO real do que os mesmos 44px valeriam num
  // desktop largo (onde o raio "24" original, sem conversão, já bastava).
  // Resultado: no celular, no MESMO número de zoom, uma área bem maior do
  // globo acaba se juntando num único cluster — dando a impressão de que
  // "o zoom está fraco" e fazendo o alvo de um país pequeno (Luxemburgo...)
  // sumir dentro de um cluster longe dali. A saída é deixar ir bem mais
  // fundo no zoom no celular — na mesma proporção do sizeScale — pra que
  // dê pra "compensar" apertando mais o zoom até esse cluster se abrir e
  // isolar cada país, do jeito que já acontecia naturalmente no desktop.
  const effectiveMaxZoom = MAX_ZOOM * sizeScale;

  // Traços finos e constantes em qualquer nível de zoom — mas "constante"
  // aqui também precisa ser em pixels de TELA de verdade, não em unidades
  // do viewBox: sem o sizeScale, a borda de país (a única forma de
  // DISTINGUIR um país sem carimbo do vizinho, já que os dois usam a MESMA
  // cor de preenchimento) encolhia junto com 1/zoom até sumir de vez —
  // numa tela estreita e com o zoom bem mais fundo agora, isso deixava o
  // mapa inteiro parecendo um único continente cinza sem fronteira nenhuma
  // visível, tornando impossível ver se um alfinete estava "dentro" do
  // país certo ou não.
  const hair = (0.5 * sizeScale) / zoom;

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
    (e: React.MouseEvent, items: MarkerPoint[]) => {
      openPopover(
        e,
        items.map((p): PopoverItem =>
          p.kind === "city" ? { kind: "city", ref: p.city } : { kind: "country", ref: p.pin.country },
        ),
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

  // Cidades E alfinetes de país sem forma própria, juntos num único cálculo
  // de área visível + agrupamento + rótulo — não é preciso selecionar
  // nenhum país: é só dar zoom em qualquer lugar do mapa. Tratar os dois
  // tipos como um só grupo é o que garante que um país pequeno (Mônaco, San
  // Marino...) nunca fique em cima do ponto ou do rótulo de uma cidade
  // vizinha: antes cada tipo só evitava colidir consigo mesmo, agora os
  // dois disputam o mesmo espaço na mesma passada.
  const markerGroups = useMemo<MarkerGroup[]>(() => {
    const [cx, cy] = projectPoint(center[0], center[1]);

    const maxRank = maxCityRankForZoom(zoom);
    const cityPoints: MarkerPoint[] =
      maxRank < 0
        ? []
        : getVisibleCities(cx, cy, zoom, maxRank, CITY_MARKER_LIMIT).map((city) => ({
            kind: "city" as const,
            city,
          }));

    let countryPoints: MarkerPoint[] = [];
    if (zoom >= COUNTRY_PIN_REVEAL_ZOOM && missingCountryPins.length) {
      const halfW = 400 / zoom;
      const halfH = 300 / zoom;
      const minX = cx - halfW;
      const maxX = cx + halfW;
      const minY = cy - halfH;
      const maxY = cy + halfH;
      countryPoints = missingCountryPins
        .filter((p) => p.px >= minX && p.px <= maxX && p.py >= minY && p.py <= maxY)
        .map((pin) => ({ kind: "country" as const, pin }));
    }

    // Cidades primeiro (já vêm ordenadas por relevância) — quando um país
    // pequeno cai perto de uma cidade conhecida, o cluster resultante
    // ancora na cidade, que é o ponto de referência mais útil dos dois.
    const all: MarkerPoint[] = [...cityPoints, ...countryPoints];

    // Passo 1 — agrupamento: quando os CÍRCULOS de dois marcadores
    // (cidade ou país, tanto faz) ficariam sobrepostos na tela — bairros da
    // mesma cidade, distritos de um país minúsculo como Mônaco, ou um país
    // minúsculo colado numa cidade vizinha — não tem zoom que resolva isso
    // sozinho (a distância real é curta demais). Junta num único grupo
    // clicável maior em vez de deixar um cobrindo o outro. 24px (não 18) dá
    // folga suficiente pra cobrir o pior caso de dois anéis decorativos de
    // capital (9px de raio cada) quase encostando — com 18 exato, dois
    // pontos podiam ficar a um triz do limite e escapar do agrupamento
    // (ex: Podgorica x cidade vizinha nos Bálcãs, ~19px na tela).
    //
    // Num toque, o raio sobe pro equivalente a 44px de TELA (não unidades
    // do viewBox — ver svgUnitsPerScreenPx acima) — o suficiente pra cobrir
    // a área de toque alargada (ver TOUCH_HIT_RADIUS_PX) sem duas ficarem
    // coladas uma na outra. Fora isso, é a mesma lógica de sempre: só vira
    // cluster quem realmente estaria "colado" na tela; um toque impreciso
    // ainda cai no marcador mais próximo, ou abre o popover pra escolher.
    const CLUSTER_RADIUS_PX = touchTarget ? 44 * svgUnitsPerScreenPx : 24;
    const clusterGapProj = CLUSTER_RADIUS_PX / zoom;
    const rawGroups: MarkerPoint[][] = [];
    for (const p of all) {
      const px = markerPx(p);
      const py = markerPy(p);
      const group = rawGroups.find((g) => {
        const ax = markerPx(g[0]);
        const ay = markerPy(g[0]);
        return Math.hypot(ax - px, ay - py) < clusterGapProj;
      });
      if (group) group.push(p);
      else rawGroups.push([p]);
    }

    // Passo 2 — declutter de rótulo: só se aplica a marcadores SOZINHOS (um
    // cluster já tem seu próprio contador, não precisa de nome embaixo). Em
    // regiões com muitos países pequenos e próximos (Balcãs, Golfo Pérsico,
    // Caribe...), vários nomes ainda colidiriam entre si mesmo sem cluster —
    // mantém o ponto no mapa, mas só escreve quem não colide com um rótulo
    // já desenhado (o nome ainda aparece ao passar o mouse). Cidade e país
    // disputam o mesmo espaço de rótulo aqui também.
    //
    // O badge de um cluster (o círculo com o número) TAMBÉM ocupa espaço na
    // tela — sem reservar esse espaço aqui, um rótulo sozinho nascendo bem
    // ao lado (ex: "Podgorica"/"Prizren" nos Bálcãs) podia ficar colado ou
    // por baixo do badge do cluster vizinho. Por isso os clusters entram
    // primeiro na lista de "espaço já ocupado", com seu próprio raio (menor
    // que o de um rótulo de texto, já que é só um círculo compacto).
    // Multiplicados por sizeScale porque o DESENHO real (ponto, anel, badge)
    // também cresce no celular (ver sizeScale) — sem isso, o cálculo de
    // colisão continuaria pensando no tamanho pequeno de antes e deixaria
    // passar sobreposições com o desenho maior.
    const CLUSTER_BADGE_RADIUS_PX = 15 * sizeScale; // 11px do círculo + margem
    const DOT_RADIUS_PX = 9 * sizeScale; // maior raio de ponto+anel entre cidade/país (capital: 9px)
    const obstacles: { px: number; py: number; radiusPx: number }[] = [];

    for (const g of rawGroups) {
      if (g.length <= 1) continue;
      const anchor = g[0];
      obstacles.push({ px: markerPx(anchor), py: markerPy(anchor), radiusPx: CLUSTER_BADGE_RADIUS_PX });
    }

    // Todo marcador sozinho — mostre rótulo ou não — planta seu PONTO na
    // lista de obstáculos ANTES de qualquer decisão de rótulo. Sem isso, só
    // quem era processado DEPOIS evitava quem veio antes (a ordem é por
    // relevância); o inverso nunca acontecia, e um rótulo importante
    // processado primeiro (ex: "Belgrade") podia nascer encostando no ponto
    // de um vizinho pouco relevante que só apareceria mais adiante na lista.
    // Plantando o ponto (raio pequeno) de todo mundo já de início, e só
    // "promovendo" pro raio cheio do rótulo quando ele de fato for exibido,
    // a checagem fica simétrica nos dois sentidos.
    const singles = rawGroups.filter((g) => g.length === 1).map((g) => g[0]);
    const obstacleIndexOf = new Map<MarkerPoint, number>();
    for (const p of singles) {
      obstacleIndexOf.set(p, obstacles.length);
      obstacles.push({ px: markerPx(p), py: markerPy(p), radiusPx: DOT_RADIUS_PX });
    }

    const showLabelOf = new Map<MarkerPoint, boolean>();
    for (const p of singles) {
      const px = markerPx(p);
      const py = markerPy(p);
      const myIdx = obstacleIndexOf.get(p)!;
      const myLabelRadius = labelRadiusPx(markerLabelText(p), sizeScale);
      const tooClose = obstacles.some((ob, i) => {
        if (i === myIdx) return false;
        const gapProj = (myLabelRadius + ob.radiusPx) / zoom;
        return Math.hypot(ob.px - px, ob.py - py) < gapProj;
      });
      showLabelOf.set(p, !tooClose);
      // Se ganhou o rótulo, seu próprio obstáculo cresce do tamanho de um
      // pontinho pro tamanho real do texto — os próximos da fila (menos
      // relevantes) vão respeitar esse espaço maior.
      if (!tooClose) obstacles[myIdx].radiusPx = myLabelRadius;
    }

    return rawGroups.map((g): MarkerGroup => {
      if (g.length === 1) {
        const p = g[0];
        const showLabel = showLabelOf.get(p) ?? false;
        if (p.kind === "city") return { kind: "city", city: { ...p.city, showLabel } };
        return { kind: "country", pin: p.pin, showLabel };
      }
      const anchor = g[0];
      const [lng, lat] = markerLngLat(anchor);
      return { kind: "cluster", items: g, px: markerPx(anchor), py: markerPy(anchor), lng, lat };
    });
  }, [center, zoom, missingCountryPins, touchTarget, svgUnitsPerScreenPx, sizeScale]);

  // Rótulos de país (nome sobre o próprio território) prontos pra desenhar
  // NESTE zoom: filtra quem é grande o bastante pra ler (screen cap + piso
  // de legibilidade, ver constantes no topo) e resolve colisão entre
  // vizinhos — sem isso, um país grande do lado de um médio (ex: Argélia e
  // Líbia, Mali e Níger) tinha os dois nomes escritos um em cima do outro.
  // Prioridade de espaço: quem nasceria maior na tela primeiro — os que não
  // cabem do lado de um vizinho já aceito simplesmente não aparecem NESTE
  // zoom (igual ao declutter dos rótulos de cidade acima), e voltam a
  // caber sozinhos assim que a pessoa aproximar mais.
  //
  // Não depende de `center` de propósito: a posição/tamanho de cada país é
  // fixa no espaço (não muda com o que está no centro da tela agora), então
  // o conjunto de rótulos "vencedores" também não deveria mudar só porque
  // a pessoa arrastou o mapa — arrastar não deveria fazer rótulo
  // pisca-pisca.
  const visibleLabelEntries = useMemo(() => {
    if (!labelEntries || labelEntries.length === 0) return [];
    // Diferente do resto do mapa (pontos de cidade, badge de cluster...),
    // que usa sizeScale pra compensar uma largura de referência FIXA
    // (REFERENCE_MAP_WIDTH_PX), aqui já convertemos direto pela largura
    // REAL do container (mapWidthPx) — então já é preciso em qualquer
    // tamanho de tela sem precisar de sizeScale. Multiplicar pelos dois
    // era bug: no celular (sizeScale ~3x) o texto nascia bem maior que o
    // teto de 38px pretendido.
    const screenPxPerSvgUnit = (mapWidthPx > 0 ? mapWidthPx / 800 : 1216 / 800) * zoom;
    const screenCapSvg = MAX_LABEL_SCREEN_PX / screenPxPerSvgUnit;

    const sized = labelEntries
      .map((e) => {
        const fontSizeSvg = Math.min(e.layout.fontSize, screenCapSvg);
        const apparentPx = fontSizeSvg * screenPxPerSvgUnit;
        return { entry: e, fontSizeSvg, apparentPx };
      })
      .filter((s) => s.apparentPx >= MIN_LABEL_SCREEN_PX);

    // Maior primeiro — quem ganharia mais destaque na tela reserva seu
    // espaço antes dos vizinhos menores/menos importantes.
    sized.sort((a, b) => b.apparentPx - a.apparentPx);

    const placed: { x: number; y: number; halfW: number; halfH: number }[] = [];
    const result: { rsmKey: string; layout: CountryLabelLayout; country: Country; fontSizeSvg: number }[] = [];
    for (const s of sized) {
      const { layout, country, rsmKey } = s.entry;
      const name = getPtName(country);
      // Metade da largura/altura estimada do texto, em unidades do viewBox
      // (mesmo espaço de layout.x/y) — mesma heurística de countryLabels.ts.
      const halfW = (name.length * s.fontSizeSvg * APPROX_CHAR_WIDTH_FACTOR) / 2;
      // 0.75 (não 0.5) de propósito: a altura "de verdade" ocupada por uma
      // linha de texto é maior que o font-size nominal — acentos (ó, â, ã)
      // sobem acima da caixa e a fonte em negrito tem descida própria.
      // Descoberto testando o Báltico (Estônia/Letônia/Lituânia — três
      // países pequenos e bem próximos): com 0.5 os três "cabiam" pelo
      // cálculo mas nasciam visualmente grudados um no outro.
      const halfH = s.fontSizeSvg * 0.75;
      // Fator > 1 de propósito: exige uma FOLGA entre as caixas, não só
      // "não tocar" — sem essa margem, países vizinhos com nomes grandes
      // (ex: Polônia/Bielorrússia) ainda nasciam encostados ou
      // ligeiramente sobrepostos, já que a estimativa de largura do texto
      // é uma aproximação, não uma medida exata do glifo renderizado.
      const collides = placed.some(
        (p) =>
          Math.abs(p.x - layout.x) < (p.halfW + halfW) * 1.2 &&
          Math.abs(p.y - layout.y) < (p.halfH + halfH) * 1.2,
      );
      if (collides) continue;
      placed.push({ x: layout.x, y: layout.y, halfW, halfH });
      result.push({ rsmKey, layout, country, fontSizeSvg: s.fontSizeSvg });
    }
    return result;
  }, [labelEntries, zoom, mapWidthPx]);

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
            if (geographies.length && !labelEntries) {
              queueMicrotask(() => {
                const entries: CountryLabelEntry[] = [];
                for (const geo of geographies) {
                  const country = byCcn3.get(String(Number(geo.id)));
                  if (!country) continue;
                  const layout = computeCountryLabel(geo.geometry, getPtName(country));
                  if (layout) entries.push({ rsmKey: geo.rsmKey, layout, country });
                }
                setLabelEntries(entries);
              });
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

        {/* Nome do país escrito sobre o próprio território — geometria e
            tamanho vêm de visibleLabelEntries (já filtrado + decluttered
            pro zoom atual, ver useMemo acima). clipPaths ficam num <defs> à
            parte, todos juntos, e são referenciados pelo rsmKey de cada
            país — ver src/lib/countryLabels.ts pro porquê da geometria
            (polylabel, rotação, clip). */}
        {visibleLabelEntries.length > 0 && (
          <>
            <defs>
              {visibleLabelEntries.map((e) => (
                <clipPath key={`clip-${e.rsmKey}`} id={`label-clip-${e.rsmKey}`}>
                  <path d={e.layout.clipPath} />
                </clipPath>
              ))}
            </defs>
            {visibleLabelEntries.map((e) => {
              const { layout, country, rsmKey, fontSizeSvg } = e;
              const dimmed = isFiltered(country);
              return (
                <g
                  key={`label-${rsmKey}`}
                  clipPath={`url(#label-clip-${rsmKey})`}
                  opacity={dimmed ? 0.28 : 1}
                  style={{ transition: "opacity 0.2s ease", pointerEvents: "none" }}
                >
                  <text
                    x={layout.x}
                    y={layout.y}
                    transform={layout.angle ? `rotate(${layout.angle} ${layout.x} ${layout.y})` : undefined}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={fontSizeSvg}
                    fontWeight={700}
                    letterSpacing={fontSizeSvg * 0.01}
                    fill="oklch(0.97 0.015 90 / 0.94)"
                    stroke="oklch(0.09 0.02 260 / 0.55)"
                    strokeWidth={fontSizeSvg * 0.045}
                    paintOrder="stroke"
                    style={{ userSelect: "none" }}
                  >
                    {getPtName(country)}
                  </text>
                </g>
              );
            })}
          </>
        )}

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

        {/* Cidades E alfinetes de país sem forma própria — um único pipeline
            de posicionamento (ver markerGroups acima), revelados aos poucos
            conforme o zoom aumenta, cada um "entrando" com uma animação
            suave. Marcadores que ficariam grudados na tela (sem zoom que
            resolva) viram um único cluster clicável com contador, seja qual
            for a mistura de cidade(s) e/ou país(es) minúsculo(s) ali. */}
        <AnimatePresence>
          {markerGroups.map((g, i) => {
            if (g.kind === "city") {
              return (
                <Marker key={`city-${g.city.cca2}-${g.city.name}`} coordinates={[g.city.lng, g.city.lat]}>
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
                    {touchTarget && <circle r={(TOUCH_HIT_RADIUS_PX * svgUnitsPerScreenPx) / zoom} fill="transparent" />}
                    <circle
                      r={((g.city.capital ? 5 : 3.6) * sizeScale) / zoom}
                      fill={cityMarkerColor(g.city)}
                      stroke="oklch(0.14 0.02 260)"
                      strokeWidth={(1.1 * sizeScale) / zoom}
                    />
                    <circle
                      r={((g.city.capital ? 9 : 7) * sizeScale) / zoom}
                      fill="none"
                      stroke={cityMarkerColor(g.city)}
                      strokeWidth={(0.8 * sizeScale) / zoom}
                      opacity={0.35}
                      // Só decoração — sem isso, a fina faixa da borda conta
                      // como área de hover (mesmo sendo "vazada" por dentro),
                      // e o vão entre ela e a bolinha sólida do centro faz o
                      // mouse entrar e sair do hover repetidamente ao passar
                      // por cima, piscando o mapa. Só a bolinha central conta.
                      style={{ pointerEvents: "none" }}
                    />
                    {g.city.showLabel && (
                      <text
                        textAnchor="middle"
                        y={(-9 * sizeScale) / zoom}
                        fontSize={(9.5 * sizeScale) / zoom}
                        fontWeight={600}
                        fill="oklch(0.97 0.015 90)"
                        stroke="oklch(0.1 0.02 260)"
                        strokeWidth={(2.4 * sizeScale) / zoom}
                        paintOrder="stroke"
                        style={{ pointerEvents: "none" }}
                      >
                        {g.city.name}
                      </text>
                    )}
                  </motion.g>
                </Marker>
              );
            }

            if (g.kind === "country") {
              return (
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
                    {touchTarget && <circle r={(TOUCH_HIT_RADIUS_PX * svgUnitsPerScreenPx) / zoom} fill="transparent" />}
                    <defs>
                      <clipPath id={`flagclip-${g.pin.country.cca2}`}>
                        <circle r={(6.5 * sizeScale) / zoom} />
                      </clipPath>
                    </defs>
                    <circle
                      r={(8 * sizeScale) / zoom}
                      fill="oklch(0.16 0.02 260)"
                      stroke={COUNTRY_PIN_COLOR}
                      strokeWidth={(1.6 * sizeScale) / zoom}
                    />
                    <image
                      href={g.pin.country.flags.png}
                      x={(-6.5 * sizeScale) / zoom}
                      y={(-6.5 * sizeScale) / zoom}
                      width={(13 * sizeScale) / zoom}
                      height={(13 * sizeScale) / zoom}
                      clipPath={`url(#flagclip-${g.pin.country.cca2})`}
                      preserveAspectRatio="xMidYMid slice"
                      style={{ pointerEvents: "none" }}
                    />
                    {g.showLabel && (
                      <text
                        textAnchor="middle"
                        y={(-10 * sizeScale) / zoom}
                        fontSize={(9.5 * sizeScale) / zoom}
                        fontWeight={600}
                        fill="oklch(0.97 0.015 90)"
                        stroke="oklch(0.1 0.02 260)"
                        strokeWidth={(2.4 * sizeScale) / zoom}
                        paintOrder="stroke"
                        style={{ pointerEvents: "none" }}
                      >
                        {getPtName(g.pin.country)}
                      </text>
                    )}
                  </motion.g>
                </Marker>
              );
            }

            // Cluster — pode ser só cidades, só países sem forma, ou uma
            // mistura dos dois; a cor segue o item mais relevante do grupo.
            const anchor = g.items[0];
            const key =
              anchor.kind === "city"
                ? `cluster-${anchor.city.cca2}-${anchor.city.name}`
                : `cluster-${anchor.pin.country.cca2}`;
            return (
              <Marker key={key} coordinates={[g.lng, g.lat]}>
                <motion.g
                  initial={{ opacity: 0, scale: 0.3 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.3 }}
                  transition={{ delay: Math.min(i, 14) * 0.035, type: "spring", stiffness: 320, damping: 22 }}
                  onClick={(e) => handleClickCluster(e, g.items)}
                  style={{ cursor: "pointer" }}
                >
                  {touchTarget && <circle r={(TOUCH_HIT_RADIUS_PX * svgUnitsPerScreenPx) / zoom} fill="transparent" />}
                  <circle
                    r={(11 * sizeScale) / zoom}
                    fill="oklch(0.2 0.032 245)"
                    stroke={markerClusterColor(anchor)}
                    strokeWidth={(1.6 * sizeScale) / zoom}
                  />
                  <text
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={(10 * sizeScale) / zoom}
                    fontWeight={700}
                    fill="oklch(0.97 0.015 90)"
                    style={{ pointerEvents: "none" }}
                  >
                    {g.items.length}
                  </text>
                </motion.g>
              </Marker>
            );
          })}
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
    markerGroups,
    handleEnterCity,
    handleLeaveCity,
    handleClickCity,
    handleClickCluster,
    touchTarget,
    svgUnitsPerScreenPx,
    sizeScale,
    labelEntries,
    visibleLabelEntries,
    mapWidthPx,
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
            maxZoom={effectiveMaxZoom}
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
          <ControlBtn label="Aumentar zoom" onClick={zoomIn} disabled={zoom >= effectiveMaxZoom - 0.001}>
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

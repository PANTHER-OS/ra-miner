// Passaporte Virtual — armazenamento 100% local (privado do usuário).
// Marca países como "já visitei" (visited) ou "quero visitar" (wishlist).
// Publica um evento custom para que componentes reajam em tempo real.

import { useEffect, useState } from "react";
import type { Country } from "./countries";

const KEY = "mef:passport:v1";
const EVT = "mef:passport-change";

export type PassportStatus = "visited" | "wishlist" | "none";

/** Carimbo verificado por GPS — gravado só neste aparelho. */
export interface Stamp {
  at: string; // ISO date
  lat: number;
  lng: number;
  accuracy: number;
  city?: string;
  note?: string;
}

/** Planejamento opcional de um país da lista de desejos — datas (pra
 * agrupar em viagens) e uma anotação livre. Tudo opcional: um país pode
 * ficar só na lista, sem nunca ganhar data nenhuma. */
export interface TripPlan {
  start?: string; // ISO yyyy-mm-dd
  end?: string; // ISO yyyy-mm-dd
  note?: string;
}

export interface PassportState {
  visited: string[]; // cca2 codes
  wishlist: string[];
  stamps: Record<string, Stamp>; // cca2 -> carimbo verificado
  plans: Record<string, TripPlan>; // cca2 -> plano de viagem (só p/ wishlist)
}

function emptyState(): PassportState {
  return { visited: [], wishlist: [], stamps: {}, plans: {} };
}

function read(): PassportState {
  if (typeof window === "undefined") return emptyState();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw) as Partial<PassportState>;
    return {
      visited: Array.isArray(parsed.visited) ? parsed.visited : [],
      wishlist: Array.isArray(parsed.wishlist) ? parsed.wishlist : [],
      stamps:
        parsed.stamps && typeof parsed.stamps === "object" ? parsed.stamps : {},
      plans:
        parsed.plans && typeof parsed.plans === "object" ? parsed.plans : {},
    };
  } catch {
    return emptyState();
  }
}

function write(state: PassportState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
    window.dispatchEvent(new CustomEvent(EVT));
  } catch {
    /* ignore */
  }
}


export function getPassport(): PassportState {
  return read();
}

export function getStatus(code: string): PassportStatus {
  const s = read();
  if (s.visited.includes(code)) return "visited";
  if (s.wishlist.includes(code)) return "wishlist";
  return "none";
}

export function setStatus(code: string, status: PassportStatus) {
  const s = read();
  const visited = new Set(s.visited);
  const wishlist = new Set(s.wishlist);
  visited.delete(code);
  wishlist.delete(code);
  if (status === "visited") visited.add(code);
  else if (status === "wishlist") wishlist.add(code);
  const stamps = { ...s.stamps };
  // Desmarcar "já visitei" remove o carimbo verificado.
  if (status !== "visited") delete stamps[code];
  const plans = { ...s.plans };
  // Sair da lista de desejos (virou "visitei" ou foi removido) apaga o
  // plano de viagem junto — não faz sentido guardar data/nota de um país
  // que não está mais planejado.
  if (status !== "wishlist") delete plans[code];
  write({ visited: [...visited], wishlist: [...wishlist], stamps, plans });
}

export function toggleStatus(code: string, target: "visited" | "wishlist"): PassportStatus {
  const current = getStatus(code);
  const next: PassportStatus = current === target ? "none" : target;
  setStatus(code, next);
  return next;
}

// ============ Carimbos verificados por GPS ============

export function getStamp(code: string): Stamp | undefined {
  return read().stamps[code];
}

export function isVerified(code: string): boolean {
  return Boolean(read().stamps[code]);
}

/** Grava o carimbo verificado e marca o país como visitado. */
export function saveStamp(code: string, stamp: Stamp) {
  const s = read();
  const visited = new Set(s.visited);
  const wishlist = new Set(s.wishlist);
  visited.add(code);
  wishlist.delete(code);
  const plans = { ...s.plans };
  // Virou "visitei" (carimbo verificado) — mesmo raciocínio de setStatus:
  // apaga o plano de viagem, já que o país saiu da lista de desejos.
  delete plans[code];
  write({
    visited: [...visited],
    wishlist: [...wishlist],
    stamps: { ...s.stamps, [code]: stamp },
    plans,
  });
}

export function updateStampNote(code: string, note: string) {
  const s = read();
  const current = s.stamps[code];
  if (!current) return;
  write({ ...s, stamps: { ...s.stamps, [code]: { ...current, note } } });
}

export function removeStamp(code: string) {
  const s = read();
  const stamps = { ...s.stamps };
  delete stamps[code];
  write({ ...s, stamps });
}

// ============ Planos de viagem (datas + nota da lista de desejos) ============

export function getPlan(code: string): TripPlan | undefined {
  return read().plans[code];
}

export function setPlan(code: string, plan: TripPlan) {
  const s = read();
  const plans = { ...s.plans };
  const isEmpty = !plan.start && !plan.end && !plan.note;
  if (isEmpty) delete plans[code];
  else plans[code] = plan;
  write({ ...s, plans });
}

// ============ Lista de desejos agrupada em viagens ============

export interface TripGroup {
  start: string;
  end: string;
  codes: string[]; // cca2, em ordem de data
}

// Tolerância entre o fim de uma parada e o início da próxima pra ainda
// contar como a MESMA viagem — sem isso, ir "Paris 10-15 dez" depois
// "Roma 16-20 dez" (dois países, uma viagem só, óbvio pra qualquer
// humano lendo) apareceria como duas viagens separadas só porque as datas
// não se sobrepõem byte a byte.
const TRIP_GAP_TOLERANCE_DAYS = 5;

/**
 * Agrupa a lista de desejos em "viagens" por proximidade de data —
 * intervalos que se sobrepõem OU ficam a poucos dias um do outro entram no
 * mesmo grupo (mesma lógica de "merge de intervalos", com folga). Países
 * sem nenhuma data ficam de fora dos grupos (`unplanned`).
 */
export function groupWishlistIntoTrips(
  wishlist: string[],
  plans: Record<string, TripPlan>,
): { groups: TripGroup[]; unplanned: string[] } {
  const dated = wishlist
    .map((code) => {
      const plan = plans[code];
      if (!plan?.start) return null;
      const start = plan.start;
      const end = plan.end && plan.end >= plan.start ? plan.end : plan.start;
      return { code, start, end };
    })
    .filter((x): x is { code: string; start: string; end: string } => x !== null)
    .sort((a, b) => a.start.localeCompare(b.start));

  const groups: TripGroup[] = [];
  let current: { code: string; start: string; end: string }[] = [];

  const flush = () => {
    if (current.length === 0) return;
    groups.push({
      start: current[0].start,
      end: current.reduce((max, x) => (x.end > max ? x.end : max), current[0].end),
      codes: current.map((x) => x.code),
    });
    current = [];
  };

  for (const item of dated) {
    if (current.length === 0) {
      current.push(item);
      continue;
    }
    const lastEnd = current.reduce((max, x) => (x.end > max ? x.end : max), current[0].end);
    const gapDays = daysBetween(lastEnd, item.start);
    if (gapDays <= TRIP_GAP_TOLERANCE_DAYS) {
      current.push(item);
    } else {
      flush();
      current.push(item);
    }
  }
  flush();

  const datedCodes = new Set(dated.map((d) => d.code));
  const unplanned = wishlist.filter((code) => !datedCodes.has(code));
  return { groups, unplanned };
}

function daysBetween(isoA: string, isoB: string): number {
  const a = new Date(isoA + "T00:00:00Z").getTime();
  const b = new Date(isoB + "T00:00:00Z").getTime();
  return (b - a) / 86_400_000;
}


// Hook reativo para componentes.
export function usePassport(): PassportState {
  const [state, setState] = useState<PassportState>(() => read());
  useEffect(() => {
    const handler = () => setState(read());
    window.addEventListener(EVT, handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener(EVT, handler);
      window.removeEventListener("storage", handler);
    };
  }, []);
  return state;
}

// ================= Estatísticas =================

export interface PassportStats {
  visitedCount: number;
  verifiedCount: number;
  wishlistCount: number;

  totalCountries: number;
  worldPct: number; // 0-100
  continents: { name: string; visited: number; total: number }[];
  continentsCompleted: number;
  hemispheres: {
    north: boolean;
    south: boolean;
    east: boolean;
    west: boolean;
  };
  hemisphereCount: number;
}

const CONTINENT_ORDER = ["Americas", "Europe", "Africa", "Asia", "Oceania"];

export function computeStats(
  passport: PassportState,
  countries: Country[],
): PassportStats {
  const visitedSet = new Set(passport.visited);
  const total = countries.length || 1;
  const visitedCount = countries.filter((c) => visitedSet.has(c.cca2)).length;

  const byRegion = new Map<string, { visited: number; total: number }>();
  for (const c of countries) {
    if (!c.region || c.region === "Antarctic") continue;
    const bucket = byRegion.get(c.region) ?? { visited: 0, total: 0 };
    bucket.total += 1;
    if (visitedSet.has(c.cca2)) bucket.visited += 1;
    byRegion.set(c.region, bucket);
  }
  const continents = CONTINENT_ORDER.filter((r) => byRegion.has(r)).map((r) => ({
    name: r,
    ...byRegion.get(r)!,
  }));
  const continentsCompleted = continents.filter(
    (c) => c.total > 0 && c.visited === c.total,
  ).length;

  let north = false, south = false, east = false, west = false;
  for (const c of countries) {
    if (!visitedSet.has(c.cca2) || !c.latlng) continue;
    const [lat, lng] = c.latlng;
    if (lat >= 0) north = true;
    else south = true;
    if (lng >= 0) east = true;
    else west = true;
  }
  const hemispheres = { north, south, east, west };
  const hemisphereCount = Object.values(hemispheres).filter(Boolean).length;

  return {
    visitedCount,
    verifiedCount: Object.keys(passport.stamps ?? {}).length,
    wishlistCount: passport.wishlist.length,

    totalCountries: total,
    worldPct: (visitedCount / total) * 100,
    continents,
    continentsCompleted,
    hemispheres,
    hemisphereCount,
  };
}

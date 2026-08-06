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

export interface PassportState {
  visited: string[]; // cca2 codes
  wishlist: string[];
  stamps: Record<string, Stamp>; // cca2 -> carimbo verificado
}

function emptyState(): PassportState {
  return { visited: [], wishlist: [], stamps: {} };
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
  write({ visited: [...visited], wishlist: [...wishlist], stamps });
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
  write({
    visited: [...visited],
    wishlist: [...wishlist],
    stamps: { ...s.stamps, [code]: stamp },
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

// Passaporte Virtual — armazenamento local (privado do usuário) por padrão,
// com sincronização opcional na nuvem quando o usuário faz login (ver
// seção "Conta + sincronização" no fim do arquivo). Sem login, tudo
// continua funcionando exatamente como antes — nada muda de comportamento.
// Publica um evento custom para que componentes reajam em tempo real.

import { useEffect, useState } from "react";
import type { Country } from "./countries";
import { supabase } from "./supabase";

const KEY = "mef:passport:v1";
const EVT = "mef:passport-change";

// Convite pra criar conta, disparado uma única vez (nunca mais, mesmo em
// sessões futuras) quando o passaporte já tem "algo a perder" — ver
// maybeNudgeCloudSignup() lá embaixo, perto do resto de conta/sync.
const NUDGE_SEEN_KEY = "mef:passport:cloud-nudge-seen";
export const CLOUD_NUDGE_EVT = "mef:passport:cloud-nudge";

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
  schedulePush(state);
  maybeNudgeCloudSignup(state);
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
    initAuthSync();
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

// ================= Conta + sincronização na nuvem =================
//
// Tudo abaixo é ADITIVO — sem login, currentUserId fica null, schedulePush
// vira no-op, e o app se comporta exatamente como antes (só localStorage).
// Login é opcional, feito por link mágico (e-mail, sem senha pra criar ou
// esquecer). Não existe sincronização em tempo real entre abas/aparelhos
// abertos ao mesmo tempo — cada login busca o estado mais recente da nuvem
// uma vez e funde com o local; escolhi não montar um canal realtime pra
// isso porque é complexidade real (reconexão, conflito ao vivo) pra um
// ganho pequeno num app onde a mesma pessoa raramente está em dois
// aparelhos ao mesmo tempo editando o passaporte.

export interface AuthUser {
  id: string;
  email: string | null;
}

const AUTH_EVT = "mef:auth-change";
let currentUserId: string | null = null;
let currentAuthUser: AuthUser | null = null;
let authInitialized = false;
let pushTimer: ReturnType<typeof setTimeout> | null = null;

function toAuthUser(user: { id: string; email?: string | null } | null | undefined): AuthUser | null {
  return user ? { id: user.id, email: user.email ?? null } : null;
}

// Espera uma pausa nas escritas antes de mandar pra nuvem — sem isso, cada
// letra digitada na anotação de um plano de viagem (ver WishlistPanel)
// dispararia uma requisição própria.
function schedulePush(state: PassportState) {
  if (!currentUserId) return;
  const userId = currentUserId;
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    pushToSupabase(userId, state);
  }, 1200);
}

async function pushToSupabase(userId: string, state: PassportState) {
  try {
    await supabase.from("passports").upsert({
      user_id: userId,
      visited: state.visited,
      wishlist: state.wishlist,
      stamps: state.stamps,
      plans: state.plans,
    });
  } catch {
    // Falha silenciosa — é sincronização em segundo plano; a próxima
    // escrita local tenta de novo. Não vale interromper o usuário por
    // causa disso.
  }
}

// Roda uma vez por login: busca o estado salvo na nuvem e funde com o que
// já existe neste aparelho, sem descartar nada de nenhum dos dois lados.
async function mergeRemoteIntoLocal(userId: string) {
  const { data, error } = await supabase
    .from("passports")
    .select("visited, wishlist, stamps, plans")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) return;

  const local = read();
  if (!data) {
    // Primeiro login deste usuário — ainda não existe linha na nuvem, então
    // só sobe o que já tem localmente (pode ser vazio, tudo bem).
    await pushToSupabase(userId, local);
    return;
  }

  const remote: PassportState = {
    visited: Array.isArray(data.visited) ? (data.visited as string[]) : [],
    wishlist: Array.isArray(data.wishlist) ? (data.wishlist as string[]) : [],
    stamps: (data.stamps as Record<string, Stamp>) ?? {},
    plans: (data.plans as Record<string, TripPlan>) ?? {},
  };

  // "Visitei" nunca perde carimbo — união dos dois lados. Um país que
  // esteja em QUALQUER um dos dois como visitado vira visitado no
  // resultado (mesma prioridade que já existe dentro de um único
  // aparelho: visited > wishlist), mesmo que o outro lado ainda o tivesse
  // só como lista de desejos.
  const visitedSet = new Set([...local.visited, ...remote.visited]);
  const wishlistSet = new Set([...local.wishlist, ...remote.wishlist]);
  for (const code of visitedSet) wishlistSet.delete(code);

  // Carimbo verificado: fica o mais recente por país (cada Stamp já guarda
  // a data em que foi feito).
  const stamps: Record<string, Stamp> = { ...remote.stamps };
  for (const [code, localStamp] of Object.entries(local.stamps)) {
    const remoteStamp = stamps[code];
    if (!remoteStamp || new Date(localStamp.at) > new Date(remoteStamp.at)) {
      stamps[code] = localStamp;
    }
  }

  // Plano de viagem não tem timestamp próprio — prioriza o local (o
  // aparelho que está logando agora) em caso de conflito no mesmo país, e
  // remove qualquer plano de país que não sobrou na lista de desejos
  // mesclada (mesma regra de setStatus: plano só existe pra quem está na
  // lista).
  const plans: Record<string, TripPlan> = { ...remote.plans, ...local.plans };
  for (const code of Object.keys(plans)) {
    if (!wishlistSet.has(code)) delete plans[code];
  }

  const merged: PassportState = {
    visited: [...visitedSet],
    wishlist: [...wishlistSet],
    stamps,
    plans,
  };
  write(merged); // grava local + agenda o envio de volta pra nuvem
}

// Convite não-intrusivo pra criar conta: só dispara quando a pessoa já
// marcou pelo menos 3 países (visitou ou quer ir) — ou seja, já investiu
// algo real que valeria a pena não perder — e só UMA vez por aparelho pra
// sempre, mesmo que a pessoa ignore. Login continua 100% opcional; isso é
// só um empurrão no momento certo, não um bloqueio (ver decisão registrada
// no PR que introduziu isso: manter o app livre pra explorar sem conta é
// melhor pra quem só quer testar, e pior seria obrigar login antes de
// mostrar qualquer valor).
function maybeNudgeCloudSignup(state: PassportState) {
  if (typeof window === "undefined" || currentUserId) return;
  try {
    if (window.localStorage.getItem(NUDGE_SEEN_KEY)) return;
    const total = state.visited.length + state.wishlist.length;
    if (total < 3) return;
    window.localStorage.setItem(NUDGE_SEEN_KEY, "1");
    window.dispatchEvent(new CustomEvent(CLOUD_NUDGE_EVT));
  } catch {
    /* ignore */
  }
}

function emitAuthChange() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(AUTH_EVT));
}

// Assina as mudanças de sessão do Supabase uma única vez (idempotente —
// chamado por todo componente que usa useAuthUser/usePassport, mas só o
// primeiro de fato registra o listener). Dispara a fusão nuvem+local
// sempre que um login novo acontece (não a cada re-render).
//
// Só esse listener (não um getSession() separado): onAuthStateChange já
// dispara um evento "INITIAL_SESSION" assim que assinado, com a sessão
// atual (vinda do localStorage se já havia login) — ter os dois disparava
// a fusão duas vezes na carga inicial, uma corrida inofensiva mas inútil.
function initAuthSync() {
  if (authInitialized || typeof window === "undefined") return;
  authInitialized = true;

  supabase.auth.onAuthStateChange((_event, session) => {
    const user = toAuthUser(session?.user);
    const isNewLogin = user?.id !== currentUserId && Boolean(user);
    currentUserId = user?.id ?? null;
    currentAuthUser = user;
    emitAuthChange();
    if (isNewLogin) mergeRemoteIntoLocal(user!.id);
  });
}

/** Manda um link de login por e-mail — sem senha pra criar, lembrar ou
 * vazar. Clicar no link volta pro app já autenticado. */
export async function signInWithEmail(email: string): Promise<{ error?: string }> {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
    },
  });
  return error ? { error: error.message } : {};
}

export async function signOutAccount() {
  await supabase.auth.signOut();
}

/** Hook reativo com o usuário logado (ou null) — null tanto "carregando"
 * quanto "deslogado" na prática, já que o app funciona igual nos dois
 * casos (só localStorage) até a sessão carregar. */
export function useAuthUser(): AuthUser | null {
  const [user, setUser] = useState<AuthUser | null>(currentAuthUser);
  useEffect(() => {
    initAuthSync();
    setUser(currentAuthUser);
    const handler = () => setUser(currentAuthUser);
    window.addEventListener(AUTH_EVT, handler);
    return () => window.removeEventListener(AUTH_EVT, handler);
  }, []);
  return user;
}

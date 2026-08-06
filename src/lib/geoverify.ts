// Verificação de localização 100% no aparelho.
// Pega a posição do GPS e testa contra o polígono real do país (TopoJSON),
// usando d3-geo. Nenhuma coordenada é enviada para servidor nosso.

import { geoContains } from "d3-geo";

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// Precisão mínima aceitável do GPS (metros). Acima disso não carimbamos.
export const MAX_ACCURACY_M = 5000;

export interface GeoFix {
  lat: number;
  lng: number;
  accuracy: number;
}

export interface VerifyResult {
  ok: boolean;
  /** ccn3 numérico do país onde o usuário está (se identificado) */
  matchedCcn3?: string;
  matchedName?: string;
  fix: GeoFix;
  reason?: "accuracy" | "outside" | "unknown-area";
}

type Feature = {
  id?: string | number;
  properties?: { name?: string };
  geometry: unknown;
};

let featuresPromise: Promise<Feature[]> | null = null;

async function loadFeatures(): Promise<Feature[]> {
  if (!featuresPromise) {
    featuresPromise = (async () => {
      const [topoModule, res] = await Promise.all([
        import("topojson-client"),
        fetch(GEO_URL),
      ]);
      const topology = (await res.json()) as {
        objects: Record<string, unknown>;
      };
      const collection = topoModule.feature(
        topology,
        topology.objects.countries,
      ) as { features: Feature[] };
      return collection.features;
    })();
  }
  return featuresPromise;
}

export function getCurrentFix(): Promise<GeoFix> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("unsupported"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy ?? 99999,
        }),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  });
}

/** Descobre em qual país (ccn3) a coordenada cai. */
export async function locateCcn3(
  lat: number,
  lng: number,
): Promise<{ ccn3?: string; name?: string }> {
  const features = await loadFeatures();
  for (const f of features) {
    try {
      if (geoContains(f as never, [lng, lat])) {
        return { ccn3: String(Number(f.id)), name: f.properties?.name };
      }
    } catch {
      /* geometria inválida — ignora */
    }
  }
  return {};
}

/** Fluxo completo: pega GPS, valida precisão e compara com o país esperado. */
export async function verifyPresence(expectedCcn3: string): Promise<VerifyResult> {
  const fix = await getCurrentFix();

  if (!Number.isFinite(fix.accuracy) || fix.accuracy > MAX_ACCURACY_M) {
    return { ok: false, fix, reason: "accuracy" };
  }

  const { ccn3, name } = await locateCcn3(fix.lat, fix.lng);
  if (!ccn3) return { ok: false, fix, reason: "unknown-area" };

  if (ccn3 !== String(Number(expectedCcn3))) {
    return { ok: false, fix, matchedCcn3: ccn3, matchedName: name, reason: "outside" };
  }

  return { ok: true, fix, matchedCcn3: ccn3, matchedName: name };
}

/** Cidade aproximada, só para o diário. Falha silenciosa. */
export async function reverseCity(lat: number, lng: number): Promise<string | undefined> {
  try {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=pt`,
    );
    if (!res.ok) return undefined;
    const data = (await res.json()) as {
      city?: string;
      locality?: string;
      principalSubdivision?: string;
    };
    return data.city || data.locality || data.principalSubdivision || undefined;
  } catch {
    return undefined;
  }
}

export function geoErrorMessage(err: unknown): string {
  const code = (err as GeolocationPositionError | undefined)?.code;
  if (code === 1) return "Permissão de localização negada. Libere o GPS para carimbar.";
  if (code === 2) return "Não consegui obter sua localização agora. Tente ao ar livre.";
  if (code === 3) return "O GPS demorou demais para responder. Tente de novo.";
  if (err instanceof Error && err.message === "unsupported")
    return "Este navegador não oferece localização.";
  return "Não foi possível verificar sua localização.";
}

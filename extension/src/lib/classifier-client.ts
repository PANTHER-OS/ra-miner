// Chama a Edge Function (Supabase) que faz de proxy seguro pra Claude. A
// extensão nunca guarda nem embute uma API key da Anthropic — quem tem a
// chave é a Edge Function, do lado do servidor. Essa função aqui é
// stateless: manda o lote de candidatos, recebe o veredito, e a Edge
// Function não persiste nada (ver supabase/functions/whatsapp-classify).
import type { ClassifyCandidate, ClassifyVerdict, Settings } from "../types";

const TIMEOUT_MS = 12_000;

export async function classifyBatch(candidates: ClassifyCandidate[], settings: Settings): Promise<ClassifyVerdict[]> {
  if (candidates.length === 0) return [];
  if (!settings.aiEnabled || !settings.aiEndpoint) return [];

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(settings.aiEndpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        // Header padrão do Supabase pra Edge Functions com verify_jwt: a
        // publishable/anon key já é pública por design (protegida por não
        // dar acesso a nada sensível), diferente da chave da Anthropic.
        authorization: `Bearer ${settings.aiAnonKey}`,
        apikey: settings.aiAnonKey,
      },
      body: JSON.stringify({ candidates }),
      signal: controller.signal,
    });

    if (!res.ok) {
      console.warn("[garimpo] classificador de IA respondeu", res.status, await safeText(res));
      return [];
    }

    const data = (await res.json()) as { verdicts?: ClassifyVerdict[] };
    return data.verdicts ?? [];
  } catch (err) {
    // Falha de rede, timeout, ou secret não configurada no servidor ainda —
    // a extensão precisa continuar funcionando só com as regras (ver
    // rules-engine.ts), então isso nunca deve derrubar o fluxo principal.
    console.warn("[garimpo] classificador de IA indisponível, seguindo só com regras:", err);
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

async function safeText(res: Response): Promise<string> {
  try {
    return await res.text();
  } catch {
    return "<sem corpo>";
  }
}

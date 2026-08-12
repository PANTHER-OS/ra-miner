// Edge Function: proxy stateless entre a extensão "Garimpo" e a API da
// Anthropic. Existe só pra manter a ANTHROPIC_API_KEY fora do código do
// cliente (uma extensão de navegador é código público — qualquer chave
// embutida nela pode ser extraída). Não grava nada em banco: recebe um
// lote de candidatos, devolve o veredito, ponto.
//
// Setup necessário (uma vez, fora deste arquivo):
//   supabase secrets set ANTHROPIC_API_KEY=sk-ant-... --project-ref bxlemuyjwvofcshsfoeo
// (ou via Dashboard > Project Settings > Edge Functions > Secrets)
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const ANTHROPIC_MODEL = "claude-haiku-4-5-20251001";
const MAX_CANDIDATES = 20;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface ClassifyCandidate {
  id: string;
  chatName: string;
  body: string;
  ruleScore: number;
  matchedKeywords: string[];
}

interface ClassifyVerdict {
  id: string;
  isSpecialEvent: boolean;
  confidence: number;
  category: "lancamento" | "promocao_especial" | null;
  reason: string;
}

const SYSTEM_PROMPT = `Você filtra mensagens de grupos de WhatsApp pra alguém que só quer ver duas coisas:
1) "lancamento": anúncio de lançamento de um produto/serviço/turma novo.
2) "promocao_especial": uma promoção de UM DIA (ou janela bem curta) realmente especial e não-recorrente — tipo Black Friday, aniversário da marca, condição exclusiva por tempo limitado.

O usuário NÃO quer promoções genéricas que se repetem em rotina (toda sexta, todo mês, "promoção da semana", cupom padrão de sempre, etc.) nem conversa comum do grupo.

Para cada mensagem, decida se ela é um achado relevante (isSpecialEvent) com uma confiança de 0 a 100. Seja rigoroso: na dúvida entre "eventual rotina disfarçada de especial" e "evento genuinamente único", prefira confidence mais baixo. Responda só usando a ferramenta fornecida.`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }

  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "ANTHROPIC_API_KEY não configurada no servidor. A extensão segue funcionando só com regras locais." }),
      { status: 503, headers: { ...corsHeaders, "content-type": "application/json" } },
    );
  }

  let candidates: ClassifyCandidate[];
  try {
    const body = await req.json();
    candidates = Array.isArray(body?.candidates) ? body.candidates : [];
  } catch {
    return new Response(JSON.stringify({ error: "json_invalido" }), {
      status: 400,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }

  if (candidates.length === 0) {
    return new Response(JSON.stringify({ verdicts: [] }), {
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }

  candidates = candidates.slice(0, MAX_CANDIDATES).map((c) => ({
    id: String(c.id),
    chatName: String(c.chatName ?? "").slice(0, 120),
    body: String(c.body ?? "").slice(0, 800),
    ruleScore: Number(c.ruleScore) || 0,
    matchedKeywords: Array.isArray(c.matchedKeywords) ? c.matchedKeywords.slice(0, 10) : [],
  }));

  const userContent = candidates
    .map((c, i) => `[${i}] id=${c.id} grupo="${c.chatName}" score_regras=${c.ruleScore}\nmensagem: """${c.body}"""`)
    .join("\n\n");

  const verdictTool = {
    name: "return_verdicts",
    description: "Devolve o veredito de classificação para cada mensagem candidata, na mesma ordem/ids recebidos.",
    input_schema: {
      type: "object",
      properties: {
        verdicts: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              isSpecialEvent: { type: "boolean" },
              confidence: { type: "number", minimum: 0, maximum: 100 },
              category: { type: ["string", "null"], enum: ["lancamento", "promocao_especial", null] },
              reason: { type: "string" },
            },
            required: ["id", "isSpecialEvent", "confidence", "category", "reason"],
          },
        },
      },
      required: ["verdicts"],
    },
  };

  try {
    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: 1500,
        temperature: 0,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userContent }],
        tools: [verdictTool],
        tool_choice: { type: "tool", name: "return_verdicts" },
      }),
    });

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text();
      console.error("Anthropic API error", anthropicRes.status, errText);
      return new Response(JSON.stringify({ error: "anthropic_error", verdicts: [] }), {
        status: 502,
        headers: { ...corsHeaders, "content-type": "application/json" },
      });
    }

    const data = await anthropicRes.json();
    const toolUse = (data.content ?? []).find((b: { type: string }) => b.type === "tool_use");
    const verdicts: ClassifyVerdict[] = toolUse?.input?.verdicts ?? [];

    return new Response(JSON.stringify({ verdicts }), {
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  } catch (err) {
    console.error("Erro ao chamar Anthropic", err);
    return new Response(JSON.stringify({ error: "internal_error", verdicts: [] }), {
      status: 500,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }
});

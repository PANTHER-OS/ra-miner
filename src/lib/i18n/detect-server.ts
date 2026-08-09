// Detecção do idioma no SERVIDOR — roda no `beforeLoad` da rota raiz (ver
// routes/__root.tsx), ANTES de qualquer HTML ser mandado pro navegador.
// É isso que evita o "flash": se detectássemos só no cliente (via
// `navigator.language`, depois de montar), a página nasceria em português
// por uma fração de segundo e só depois trocaria pro idioma certo — feio
// e gera aviso de hidratação (o `lang`/`dir` do <html> mudando depois do
// React já ter "casado" com o HTML do servidor).
//
// Ordem de prioridade:
//  1. Cookie `atloura-locale` — já visitou antes ou trocou nas
//     Configurações; o cookie é a fonte da verdade daí em diante.
//  2. Header `Accept-Language` do navegador — é o que reflete o idioma
//     configurado no APARELHO da pessoa (o pedido original: "esse app
//     puxa das configurações originais de linguagem do seu lar").
//  3. Português (padrão do app).
import { createServerFn } from "@tanstack/react-start";
import { getCookie, getRequestHeader } from "@tanstack/react-start/server";
import { matchBestLocale } from "./locales";

export const LOCALE_COOKIE = "atloura-locale";

function parseAcceptLanguage(header: string): string[] {
  // "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7" -> ["pt-BR","pt","en-US","en"],
  // já ordenado pela preferência (q) que o próprio navegador manda.
  return header
    .split(",")
    .map((part) => {
      const [tag, qPart] = part.trim().split(";q=");
      const q = qPart ? Number.parseFloat(qPart) : 1;
      return { tag: tag.trim(), q: Number.isFinite(q) ? q : 1 };
    })
    .sort((a, b) => b.q - a.q)
    .map((x) => x.tag)
    .filter(Boolean);
}

export const detectLocale = createServerFn({ method: "GET" }).handler((): string => {
  const cookieLocale = getCookie(LOCALE_COOKIE);
  if (cookieLocale) return matchBestLocale([cookieLocale]);

  const acceptLanguage = getRequestHeader("accept-language");
  if (acceptLanguage) return matchBestLocale(parseAcceptLanguage(acceptLanguage));

  return matchBestLocale([]);
});

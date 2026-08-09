// Provider de idioma — usado uma única vez, no root da árvore (ver
// routes/__root.tsx), envolvendo o app inteiro. Todo componente troca
// texto fixo em português por `t("chaveDoTexto")` via `useI18n()`.
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { TRANSLATIONS, type Translations } from "./translations";
import { DEFAULT_LOCALE, getLocaleInfo, isSupportedLocale } from "./locales";
import { LOCALE_COOKIE } from "./detect-server";

interface I18nContextValue {
  locale: string;
  /** Troca de idioma manual (ex: painel de Configurações) — atualiza a
   * interface na hora E grava um cookie de 1 ano, pra a próxima visita (ou
   * o próximo carregamento de página) já nascer no idioma certo direto do
   * servidor, sem flash. */
  setLocale: (code: string) => void;
  /** `t("mapZoomIn")` -> texto no idioma atual; aceita variáveis
   * (`t("navCountriesCount", { count: 249 })` -> substitui "{count}"). Cai
   * pro português se a chave não existir no idioma (nunca deveria
   * acontecer — todo idioma suportado tem TODAS as chaves, ver
   * translations.ts — mas é uma rede de segurança barata). */
  t: (key: keyof Translations, vars?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function applyVars(text: string, vars?: Record<string, string | number>): string {
  if (!vars) return text;
  let out = text;
  for (const [key, value] of Object.entries(vars)) {
    out = out.replaceAll(`{${key}}`, String(value));
  }
  return out;
}

function writeLocaleCookie(code: string) {
  if (typeof document === "undefined") return;
  const oneYear = 60 * 60 * 24 * 365;
  document.cookie = `${LOCALE_COOKIE}=${code}; path=/; max-age=${oneYear}; SameSite=Lax`;
}

export function I18nProvider({
  initialLocale,
  children,
}: {
  initialLocale: string;
  children: ReactNode;
}) {
  const [locale, setLocaleState] = useState(
    isSupportedLocale(initialLocale) ? initialLocale : DEFAULT_LOCALE,
  );

  const setLocale = useCallback((code: string) => {
    if (!isSupportedLocale(code)) return;
    setLocaleState(code);
    writeLocaleCookie(code);
  }, []);

  const t = useCallback(
    (key: keyof Translations, vars?: Record<string, string | number>) => {
      const dict = TRANSLATIONS[locale] ?? TRANSLATIONS[DEFAULT_LOCALE];
      const text = dict[key] ?? TRANSLATIONS[DEFAULT_LOCALE][key] ?? String(key);
      return applyVars(text, vars);
    },
    [locale],
  );

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  // `<html lang/dir>` nasce certo no HTML vindo do servidor (ver
  // RootShell), mas só ali — RootShell não sabe quando o idioma muda
  // DEPOIS, pela troca manual nas Configurações (esse estado vive aqui
  // dentro, não em cima dele). Esse efeito só entra em ação numa troca
  // client-side (o valor já nasce igual no primeiro render, então não
  // disputa com o HTML do servidor nem gera aviso de hidratação).
  useEffect(() => {
    const { rtl } = getLocaleInfo(locale);
    document.documentElement.lang = locale;
    document.documentElement.dir = rtl ? "rtl" : "ltr";
  }, [locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n precisa estar dentro de <I18nProvider>");
  return ctx;
}

/** Atalho pra quando só o texto importa (a maioria dos casos) — evita
 * `const { t } = useI18n()` repetido em todo componente pequeno. */
export function useTranslation() {
  return useI18n().t;
}

export { getLocaleInfo };

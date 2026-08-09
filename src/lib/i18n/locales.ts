// Lista de idiomas suportados pela interface — cobre a grande maioria de
// quem usaria o app no mundo todo (nativeName é como a pessoa FALANTE
// daquele idioma leria o nome, não uma tradução do português). A bandeira
// é só um atalho visual reconhecível (padrão comum em seletor de idioma,
// mesmo sabendo que idioma não é sempre igual a país — ex: inglês não tem
// "uma" bandeira, mas 🇺🇸 é o que todo mundo reconhece de cara).
export interface LocaleInfo {
  code: string;
  nativeName: string;
  englishName: string;
  flag: string;
  /** true = idioma escrito da direita pra esquerda (árabe) — muda a
   * direção do layout inteiro (ver `dir` em context.tsx). */
  rtl?: boolean;
}

export const LOCALES: LocaleInfo[] = [
  { code: "pt", nativeName: "Português (Brasil)", englishName: "Portuguese (Brazil)", flag: "🇧🇷" },
  { code: "en", nativeName: "English", englishName: "English", flag: "🇺🇸" },
  { code: "es", nativeName: "Español", englishName: "Spanish", flag: "🇪🇸" },
  { code: "fr", nativeName: "Français", englishName: "French", flag: "🇫🇷" },
  { code: "de", nativeName: "Deutsch", englishName: "German", flag: "🇩🇪" },
  { code: "it", nativeName: "Italiano", englishName: "Italian", flag: "🇮🇹" },
  { code: "nl", nativeName: "Nederlands", englishName: "Dutch", flag: "🇳🇱" },
  { code: "pl", nativeName: "Polski", englishName: "Polish", flag: "🇵🇱" },
  { code: "tr", nativeName: "Türkçe", englishName: "Turkish", flag: "🇹🇷" },
  { code: "ru", nativeName: "Русский", englishName: "Russian", flag: "🇷🇺" },
  { code: "ar", nativeName: "العربية", englishName: "Arabic", flag: "🇸🇦", rtl: true },
  { code: "hi", nativeName: "हिन्दी", englishName: "Hindi", flag: "🇮🇳" },
  { code: "zh", nativeName: "中文", englishName: "Chinese", flag: "🇨🇳" },
  { code: "ja", nativeName: "日本語", englishName: "Japanese", flag: "🇯🇵" },
  { code: "ko", nativeName: "한국어", englishName: "Korean", flag: "🇰🇷" },
  { code: "id", nativeName: "Bahasa Indonesia", englishName: "Indonesian", flag: "🇮🇩" },
  { code: "th", nativeName: "ไทย", englishName: "Thai", flag: "🇹🇭" },
  { code: "vi", nativeName: "Tiếng Việt", englishName: "Vietnamese", flag: "🇻🇳" },
];

export const DEFAULT_LOCALE = "pt";

export const SUPPORTED_LOCALE_CODES: string[] = LOCALES.map((l) => l.code);

export function isSupportedLocale(code: string | undefined | null): code is string {
  return !!code && SUPPORTED_LOCALE_CODES.includes(code);
}

export function getLocaleInfo(code: string): LocaleInfo {
  return LOCALES.find((l) => l.code === code) ?? LOCALES[0];
}

/** Escolhe o melhor idioma suportado a partir de uma lista de preferências
 * (ex: navigator.languages ou o header Accept-Language já parseado) — cada
 * entrada pode vir como "pt-BR", "pt", "en-US" etc.; comparamos só a parte
 * antes do hífen, então "pt-PT" (Portugal) também cai em "pt" (o app só
 * tem uma variante de português, a brasileira). */
export function matchBestLocale(preferences: string[]): string {
  for (const pref of preferences) {
    const base = pref.split("-")[0].toLowerCase();
    if (isSupportedLocale(base)) return base;
  }
  return DEFAULT_LOCALE;
}

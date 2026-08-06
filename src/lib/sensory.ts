// Vitrine sensorial: hora local, clima ao vivo e palavra do dia.

// Converte "UTC-03:00" ou "UTC+05:30" em minutos de offset.
export function tzOffsetMinutes(tz: string): number | null {
  const m = /^UTC([+-])(\d{2}):(\d{2})$/.exec(tz.trim());
  if (!m) return null;
  const sign = m[1] === "+" ? 1 : -1;
  return sign * (parseInt(m[2], 10) * 60 + parseInt(m[3], 10));
}

export function localTimeFor(tz: string | undefined, now = new Date()): { hh: string; mm: string; ss: string; label: string } | null {
  if (!tz) return null;
  const off = tzOffsetMinutes(tz);
  if (off == null) return null;
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const local = new Date(utc + off * 60000);
  const hh = String(local.getHours()).padStart(2, "0");
  const mm = String(local.getMinutes()).padStart(2, "0");
  const ss = String(local.getSeconds()).padStart(2, "0");
  return { hh, mm, ss, label: tz };
}

// Weather code → PT description + emoji (Open-Meteo WMO codes).
export function describeWeather(code: number): { text: string; icon: string } {
  const map: Record<number, { text: string; icon: string }> = {
    0: { text: "Céu limpo", icon: "☀️" },
    1: { text: "Predomínio de sol", icon: "🌤️" },
    2: { text: "Parcialmente nublado", icon: "⛅" },
    3: { text: "Nublado", icon: "☁️" },
    45: { text: "Neblina", icon: "🌫️" },
    48: { text: "Neblina gelada", icon: "🌫️" },
    51: { text: "Garoa leve", icon: "🌦️" },
    53: { text: "Garoa", icon: "🌦️" },
    55: { text: "Garoa densa", icon: "🌧️" },
    61: { text: "Chuva fraca", icon: "🌦️" },
    63: { text: "Chuva", icon: "🌧️" },
    65: { text: "Chuva forte", icon: "🌧️" },
    71: { text: "Neve fraca", icon: "🌨️" },
    73: { text: "Neve", icon: "❄️" },
    75: { text: "Neve intensa", icon: "❄️" },
    77: { text: "Grãos de neve", icon: "🌨️" },
    80: { text: "Pancadas de chuva", icon: "🌦️" },
    81: { text: "Chuva intensa", icon: "🌧️" },
    82: { text: "Chuva torrencial", icon: "⛈️" },
    85: { text: "Pancadas de neve", icon: "🌨️" },
    86: { text: "Neve pesada", icon: "❄️" },
    95: { text: "Tempestade", icon: "⛈️" },
    96: { text: "Tempestade com granizo", icon: "⛈️" },
    99: { text: "Tempestade severa", icon: "⛈️" },
  };
  return map[code] ?? { text: "Céu do momento", icon: "🌍" };
}

export interface WeatherNow {
  tempC: number;
  code: number;
  wind: number;
}

const wxCache = new Map<string, { at: number; data: WeatherNow }>();
const WX_TTL = 1000 * 60 * 10;

export async function fetchWeather(lat: number, lng: number): Promise<WeatherNow> {
  const key = `${lat.toFixed(2)},${lng.toFixed(2)}`;
  const cached = wxCache.get(key);
  if (cached && Date.now() - cached.at < WX_TTL) return cached.data;
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code,wind_speed_10m`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("weather");
  const j = await res.json();
  const data: WeatherNow = {
    tempC: Math.round(j.current?.temperature_2m ?? 0),
    code: Number(j.current?.weather_code ?? 0),
    wind: Math.round(j.current?.wind_speed_10m ?? 0),
  };
  wxCache.set(key, { at: Date.now(), data });
  return data;
}

// Palavra do dia por código de idioma (ISO 639-3, como vem do mledoze).
// Escolhe uma palavra determinística por dia do ano + código do país,
// pra rodar sem repetir com frequência.
interface Word {
  word: string;
  ipa: string;
  meaning: string;
}

const WORDS: Record<string, Word[]> = {
  por: [
    { word: "Saudade", ipa: "sau·dá·dji", meaning: "Falta afetuosa por alguém ou algo" },
    { word: "Cafuné", ipa: "ka·fu·nê", meaning: "Carinho passando os dedos no cabelo" },
    { word: "Aconchego", ipa: "a·kon·xê·go", meaning: "Sensação de abrigo e conforto" },
    { word: "Xodó", ipa: "xo·dó", meaning: "Pessoa ou coisa de grande estima" },
  ],
  eng: [
    { word: "Wanderlust", ipa: "ˈwɒn·də·lʌst", meaning: "Desejo forte de viajar" },
    { word: "Serendipity", ipa: "ˌse·rən·ˈdi·pə·ti", meaning: "Descoberta feliz por acaso" },
    { word: "Hiraeth", ipa: "ˈhɪər·aɪθ", meaning: "Nostalgia de um lugar" },
  ],
  spa: [
    { word: "Sobremesa", ipa: "so·bre·mé·sa", meaning: "Conversa longa após a refeição" },
    { word: "Duende", ipa: "du·én·de", meaning: "Magia que emociona na arte" },
    { word: "Madrugar", ipa: "ma·dru·gár", meaning: "Levantar antes do amanhecer" },
  ],
  fra: [
    { word: "Flâner", ipa: "flɑ·ne", meaning: "Passear sem rumo, observando" },
    { word: "Retrouvailles", ipa: "ʁə·tʁu·vaj", meaning: "Alegria do reencontro" },
    { word: "Dépaysement", ipa: "de·pɛ·iz·mɑ̃", meaning: "Sensação de estar fora do próprio mundo" },
  ],
  ita: [
    { word: "Meriggiare", ipa: "me·ri·dʒá·re", meaning: "Descansar à sombra no calor do meio-dia" },
    { word: "Abbiocco", ipa: "ab·bjó·kko", meaning: "Sonolência depois de comer bem" },
    { word: "Sprezzatura", ipa: "spret·tsa·tú·ra", meaning: "Elegância que parece sem esforço" },
  ],
  deu: [
    { word: "Fernweh", ipa: "ˈfɛʁn·veː", meaning: "Saudade de lugares onde nunca esteve" },
    { word: "Waldeinsamkeit", ipa: "ˈvalt·ʔaɪn·zaːm·kaɪt", meaning: "Paz de estar sozinho na floresta" },
    { word: "Gemütlichkeit", ipa: "ɡə·ˈmyːt·lɪç·kaɪt", meaning: "Aconchego caloroso" },
  ],
  jpn: [
    { word: "木漏れ日 (Komorebi)", ipa: "ko·mo·ré·bi", meaning: "Luz do sol filtrada pelas folhas" },
    { word: "侘寂 (Wabi-sabi)", ipa: "wá·bi·sá·bi", meaning: "Beleza da imperfeição" },
    { word: "森林浴 (Shinrin-yoku)", ipa: "shin·rin·yó·ku", meaning: "Banho de floresta" },
  ],
  zho: [
    { word: "缘分 (Yuánfèn)", ipa: "yuân·fên", meaning: "Destino que une pessoas" },
    { word: "面子 (Miànzi)", ipa: "miên·dzi", meaning: "Reputação e dignidade social" },
  ],
  kor: [
    { word: "정 (Jeong)", ipa: "tʃʌŋ", meaning: "Vínculo afetivo profundo" },
    { word: "눈치 (Nunchi)", ipa: "nun·tʃi", meaning: "Sensibilidade pra ler o ambiente" },
  ],
  ara: [
    { word: "يقين (Yaqeen)", ipa: "ia·kín", meaning: "Certeza serena do coração" },
    { word: "طرب (Tarab)", ipa: "tá·rab", meaning: "Êxtase provocado pela música" },
  ],
  rus: [
    { word: "Тоска (Toská)", ipa: "ta·s·ká", meaning: "Angústia melancólica sem causa" },
    { word: "Почемучка (Pochemuchka)", ipa: "pa·tʃi·mú·tʃka", meaning: "Alguém que pergunta muito" },
  ],
  ell: [
    { word: "Μεράκι (Meraki)", ipa: "me·rá·ki", meaning: "Fazer algo com alma e amor" },
    { word: "Φιλότιμο (Philotimo)", ipa: "fi·ló·ti·mo", meaning: "Honra e generosidade instintiva" },
  ],
  tur: [
    { word: "Yakamoz", ipa: "ja·ka·moz", meaning: "Reflexo da lua na água" },
    { word: "Hüzün", ipa: "hy·zyn", meaning: "Melancolia coletiva e poética" },
  ],
  nld: [
    { word: "Gezelligheid", ipa: "χə·ˈzɛ·ləχ·hɛit", meaning: "Aconchego partilhado com pessoas queridas" },
  ],
  swe: [
    { word: "Lagom", ipa: "lá·gom", meaning: "Na medida certa, nem mais nem menos" },
    { word: "Fika", ipa: "fí·ka", meaning: "Pausa com café e afeto" },
  ],
  nor: [
    { word: "Friluftsliv", ipa: "frí·lufts·liv", meaning: "Vida em harmonia com a natureza" },
  ],
  dan: [
    { word: "Hygge", ipa: "hy·ge", meaning: "Aconchego caloroso e simples" },
  ],
  fin: [
    { word: "Sisu", ipa: "sí·su", meaning: "Coragem silenciosa diante da adversidade" },
  ],
  hin: [
    { word: "जुगाड़ (Jugaad)", ipa: "dʒu·gád", meaning: "Solução criativa com poucos recursos" },
  ],
  tha: [
    { word: "เกรงใจ (Krengjai)", ipa: "kreŋ·tʃai", meaning: "Consideração pra não incomodar o outro" },
  ],
  vie: [
    { word: "Duyên", ipa: "zuiên", meaning: "Encontro predestinado" },
  ],
  ind: [
    { word: "Jayus", ipa: "dʒá·jus", meaning: "Piada tão ruim que faz rir" },
  ],
};

const FALLBACK: Word = {
  word: "Viagem",
  ipa: "vi·á·jeim",
  meaning: "Toda descoberta que muda algo dentro da gente",
};

export function wordOfDay(langCodes: string[] | undefined, countryCode: string): { lang: string; word: Word } {
  if (!langCodes || langCodes.length === 0) return { lang: "—", word: FALLBACK };
  // Escolhe o primeiro idioma disponível na base de palavras, senão fallback.
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000,
  );
  const seed = dayOfYear + hashCode(countryCode);
  for (const code of langCodes) {
    const bucket = WORDS[code];
    if (bucket && bucket.length) {
      return { lang: code, word: bucket[Math.abs(seed) % bucket.length] };
    }
  }
  return { lang: langCodes[0], word: FALLBACK };
}

function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}

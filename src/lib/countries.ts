export interface Country {
  cca2: string;
  cca3: string;
  ccn3: string; // numeric ISO code — used to match topojson geometries
  name: {
    common: string;
    official: string;
    nativeName?: Record<string, { common: string; official: string }>;
  };
  capital?: string[];
  region: string;
  subregion?: string;
  population: number;
  languages?: Record<string, string>;
  currencies?: Record<string, { name: string; symbol?: string }>;
  flags: { svg: string; png: string; alt?: string };
  latlng?: [number, number];
  area?: number;
  translations?: Record<string, { common: string; official: string }>;
  timezones?: string[];
}

const FIELDS = [
  "cca2",
  "cca3",
  "ccn3",
  "name",
  "capital",
  "region",
  "subregion",
  "population",
  "languages",
  "currencies",
  "flags",
  "latlng",
  "area",
  "translations",
].join(",");

let cache: Country[] | null = null;

export async function fetchCountries(): Promise<Country[]> {
  if (cache) return cache;
  const res = await fetch(`/api/public/countries`);
  if (!res.ok) throw new Error("Falha ao carregar países");

  const data = (await res.json()) as Country[];
  const filtered = data.filter((c) => c.ccn3 && c.cca2);
  filtered.sort((a, b) =>
    getPtName(a).localeCompare(getPtName(b), "pt-BR"),
  );
  cache = filtered;
  return filtered;
}

export function getPtName(c: Country): string {
  return c.translations?.por?.common ?? c.name.common;
}

export function getPtOfficialName(c: Country): string {
  return c.translations?.por?.official ?? c.name.official;
}

export function getRegionPt(region: string): string {
  const map: Record<string, string> = {
    Africa: "África",
    Americas: "Américas",
    Asia: "Ásia",
    Europe: "Europa",
    Oceania: "Oceania",
    Antarctic: "Antártida",
  };
  return map[region] ?? region;
}

const SUBREGION_PT: Record<string, string> = {
  "South America": "América do Sul",
  "Central America": "América Central",
  "North America": "América do Norte",
  "Northern America": "América do Norte",
  Caribbean: "Caribe",
  "Northern Europe": "Europa do Norte",
  "Southern Europe": "Europa do Sul",
  "Western Europe": "Europa Ocidental",
  "Eastern Europe": "Europa Oriental",
  "Central Europe": "Europa Central",
  "Southeast Europe": "Sudeste Europeu",
  "Northern Africa": "Norte da África",
  "Western Africa": "África Ocidental",
  "Eastern Africa": "África Oriental",
  "Middle Africa": "África Central",
  "Southern Africa": "África Austral",
  "Western Asia": "Oriente Médio",
  "Central Asia": "Ásia Central",
  "Southern Asia": "Sul da Ásia",
  "Eastern Asia": "Leste Asiático",
  "South-Eastern Asia": "Sudeste Asiático",
  Melanesia: "Melanésia",
  Micronesia: "Micronésia",
  Polynesia: "Polinésia",
  "Australia and New Zealand": "Austrália e Nova Zelândia",
};

export function getSubregionPt(sub?: string): string | undefined {
  if (!sub) return undefined;
  return SUBREGION_PT[sub] ?? sub;
}

export function formatPopulation(n: number): string {
  return new Intl.NumberFormat("pt-BR").format(n);
}

const LANG_PT: Record<string, string> = {
  Portuguese: "Português", English: "Inglês", Spanish: "Espanhol",
  French: "Francês", German: "Alemão", Italian: "Italiano",
  Dutch: "Holandês", Russian: "Russo", Chinese: "Chinês",
  Japanese: "Japonês", Korean: "Coreano", Arabic: "Árabe",
  Turkish: "Turco", Greek: "Grego", Polish: "Polonês",
  Swedish: "Sueco", Norwegian: "Norueguês", Danish: "Dinamarquês",
  Finnish: "Finlandês", Czech: "Tcheco", Hungarian: "Húngaro",
  Romanian: "Romeno", Bulgarian: "Búlgaro", Ukrainian: "Ucraniano",
  Hebrew: "Hebraico", Hindi: "Hindi", Bengali: "Bengali",
  Urdu: "Urdu", Persian: "Persa", Thai: "Tailandês",
  Vietnamese: "Vietnamita", Indonesian: "Indonésio", Malay: "Malaio",
  Swahili: "Suaíli", Afrikaans: "Africâner", Zulu: "Zulu",
  Amharic: "Amárico", Somali: "Somali", Filipino: "Filipino",
  Tagalog: "Tagalo", Catalan: "Catalão", Basque: "Basco",
  Galician: "Galego", Irish: "Irlandês", Welsh: "Galês",
  Icelandic: "Islandês", Croatian: "Croata", Serbian: "Sérvio",
  Slovak: "Eslovaco", Slovene: "Esloveno", Slovenian: "Esloveno",
  Estonian: "Estoniano", Latvian: "Letão", Lithuanian: "Lituano",
  Albanian: "Albanês", Macedonian: "Macedônio", Armenian: "Armênio",
  Georgian: "Georgiano", Azerbaijani: "Azerbaijano", Kazakh: "Cazaque",
  Uzbek: "Uzbeque", Mongolian: "Mongol", Nepali: "Nepalês",
  Sinhala: "Cingalês", Burmese: "Birmanês", Khmer: "Khmer",
  Lao: "Laociano", Maori: "Maori", Samoan: "Samoano",
  Tongan: "Tonganês", Fijian: "Fijiano",
  "Haitian Creole": "Crioulo Haitiano",
};

export function translateLanguage(name: string): string {
  return LANG_PT[name] ?? name;
}

const CURRENCY_PT: Record<string, string> = {
  "United States dollar": "Dólar americano",
  "Brazilian real": "Real brasileiro",
  "Pound sterling": "Libra esterlina",
  "Japanese yen": "Iene japonês",
  "Chinese yuan": "Yuan chinês",
  "Renminbi": "Yuan chinês",
  "Swiss franc": "Franco suíço",
  "Canadian dollar": "Dólar canadense",
  "Australian dollar": "Dólar australiano",
  "New Zealand dollar": "Dólar neozelandês",
  "Mexican peso": "Peso mexicano",
  "Argentine peso": "Peso argentino",
  "Chilean peso": "Peso chileno",
  "Colombian peso": "Peso colombiano",
  "Peruvian sol": "Sol peruano",
  "Uruguayan peso": "Peso uruguaio",
  "Russian ruble": "Rublo russo",
  "Indian rupee": "Rúpia indiana",
  "South Korean won": "Won sul-coreano",
  "Turkish lira": "Lira turca",
  "South African rand": "Rand sul-africano",
  "Egyptian pound": "Libra egípcia",
  "Israeli new shekel": "Novo shekel israelense",
  "Saudi riyal": "Riyal saudita",
  "United Arab Emirates dirham": "Dirham dos Emirados Árabes",
  "Norwegian krone": "Coroa norueguesa",
  "Swedish krona": "Coroa sueca",
  "Danish krone": "Coroa dinamarquesa",
  "Icelandic króna": "Coroa islandesa",
  "Polish złoty": "Zloty polonês",
  "Czech koruna": "Coroa tcheca",
  "Hungarian forint": "Florim húngaro",
  "Thai baht": "Baht tailandês",
  "Vietnamese đồng": "Dong vietnamita",
  "Indonesian rupiah": "Rupia indonésia",
  "Malaysian ringgit": "Ringgit malaio",
  "Philippine peso": "Peso filipino",
  "Singapore dollar": "Dólar de Singapura",
  "Hong Kong dollar": "Dólar de Hong Kong",
  "New Taiwan dollar": "Novo dólar taiwanês",
  "Pakistani rupee": "Rúpia paquistanesa",
  "Bangladeshi taka": "Taka de Bangladesh",
  "Nigerian naira": "Naira nigeriano",
  "Kenyan shilling": "Xelim queniano",
  "Moroccan dirham": "Dirham marroquino",
};

export function translateCurrency(name: string): string {
  return CURRENCY_PT[name] ?? name;
}

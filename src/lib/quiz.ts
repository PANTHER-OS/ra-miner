// Quiz de Compatibilidade de Viagem
// Cada país é pontuado em 8 dimensões (0-10). O quiz mapeia respostas para
// pesos nessas dimensões e calcula um score por país. Resultado: top 3.

export type Dimension =
  | "beach"       // praia / mar
  | "mountain"    // montanha / natureza selvagem
  | "urban"       // metrópoles, arranha-céus, vida noturna
  | "culture"     // museus, história, arte
  | "food"        // gastronomia como atração principal
  | "adventure"   // trilhas, esportes radicais, imersão
  | "chill"       // relaxamento, ritmo lento
  | "budget"      // 10 = muito barato, 0 = muito caro
  | "warm"        // 10 = quente o ano todo, 0 = frio
  | "easy"        // facilidade p/ brasileiro (idioma, visto, distância)
  | "exotic";     // choque cultural / algo raro de ver

export interface CountryProfile {
  code: string;      // cca2
  name: string;      // PT-BR
  scores: Partial<Record<Dimension, number>>;
  tagline: string;   // frase pronta pro card final
}

// Base curada — 55 destinos populares p/ brasileiros
export const PROFILES: CountryProfile[] = [
  { code: "BR", name: "Brasil", tagline: "Praia, floresta e festa no mesmo passaporte.",
    scores: { beach:10, mountain:7, urban:8, culture:8, food:9, adventure:9, chill:8, budget:9, warm:10, easy:10, exotic:3 } },
  { code: "AR", name: "Argentina", tagline: "Bife, tango e Patagônia — três viagens em uma.",
    scores: { beach:3, mountain:9, urban:9, culture:8, food:9, adventure:9, chill:6, budget:8, warm:5, easy:9, exotic:4 } },
  { code: "CL", name: "Chile", tagline: "Do Atacama à Patagônia, o país mais vertical do mundo.",
    scores: { beach:5, mountain:10, urban:7, culture:6, food:7, adventure:10, chill:6, budget:6, warm:5, easy:8, exotic:6 } },
  { code: "PE", name: "Peru", tagline: "Machu Picchu, ceviche e altitude que arrepia.",
    scores: { beach:4, mountain:10, urban:6, culture:10, food:10, adventure:9, chill:5, budget:8, warm:6, easy:8, exotic:8 } },
  { code: "CO", name: "Colômbia", tagline: "Café, salsa e cidades coloridas que não dormem.",
    scores: { beach:8, mountain:8, urban:8, culture:8, food:8, adventure:8, chill:7, budget:8, warm:9, easy:8, exotic:6 } },
  { code: "UY", name: "Uruguai", tagline: "Praia calma, parrilla e ritmo devagar.",
    scores: { beach:8, mountain:2, urban:6, culture:6, food:8, adventure:4, chill:10, budget:6, warm:7, easy:10, exotic:2 } },
  { code: "MX", name: "México", tagline: "Tacos, cenotes e ruínas maias em cada esquina.",
    scores: { beach:9, mountain:7, urban:8, culture:10, food:10, adventure:8, chill:7, budget:8, warm:9, easy:7, exotic:7 } },
  { code: "US", name: "Estados Unidos", tagline: "De Nova York aos desertos — escala continental.",
    scores: { beach:7, mountain:9, urban:10, culture:8, food:8, adventure:9, chill:6, budget:3, warm:6, easy:5, exotic:4 } },
  { code: "CA", name: "Canadá", tagline: "Auroras, lagos turquesa e cidades ultra-organizadas.",
    scores: { beach:3, mountain:10, urban:8, culture:7, food:7, adventure:10, chill:8, budget:4, warm:2, easy:5, exotic:5 } },
  { code: "CR", name: "Costa Rica", tagline: "Vulcões, preguiças e ondas — pura vida.",
    scores: { beach:9, mountain:8, urban:4, culture:5, food:6, adventure:10, chill:8, budget:5, warm:9, easy:7, exotic:6 } },
  { code: "CU", name: "Cuba", tagline: "Salsa, carros antigos e tempo suspenso.",
    scores: { beach:9, mountain:4, urban:6, culture:9, food:5, adventure:5, chill:8, budget:6, warm:10, easy:6, exotic:8 } },

  { code: "PT", name: "Portugal", tagline: "Azulejos, bacalhau e mar bravo — Brasil sem barreira.",
    scores: { beach:8, mountain:5, urban:8, culture:9, food:9, adventure:6, chill:8, budget:6, warm:7, easy:10, exotic:3 } },
  { code: "ES", name: "Espanha", tagline: "Tapas até de madrugada e arte em cada praça.",
    scores: { beach:8, mountain:7, urban:9, culture:10, food:10, adventure:7, chill:7, budget:6, warm:8, easy:8, exotic:4 } },
  { code: "IT", name: "Itália", tagline: "Massa fresca, ruínas e vilas debruçadas no mar.",
    scores: { beach:8, mountain:8, urban:9, culture:10, food:10, adventure:6, chill:8, budget:5, warm:7, easy:6, exotic:4 } },
  { code: "FR", name: "França", tagline: "Museus, vinho e o luxo do detalhe.",
    scores: { beach:6, mountain:8, urban:10, culture:10, food:10, adventure:6, chill:6, budget:4, warm:6, easy:5, exotic:4 } },
  { code: "GR", name: "Grécia", tagline: "Ilhas brancas e azuis num mar impossível.",
    scores: { beach:10, mountain:5, urban:6, culture:10, food:9, adventure:6, chill:9, budget:6, warm:8, easy:6, exotic:5 } },
  { code: "GB", name: "Reino Unido", tagline: "Pubs, castelos e cenários de filme.",
    scores: { beach:3, mountain:6, urban:10, culture:10, food:6, adventure:5, chill:5, budget:3, warm:4, easy:5, exotic:4 } },
  { code: "DE", name: "Alemanha", tagline: "Cerveja, castelos e uma engenharia que impressiona.",
    scores: { beach:2, mountain:7, urban:9, culture:9, food:7, adventure:6, chill:6, budget:5, warm:4, easy:5, exotic:4 } },
  { code: "NL", name: "Holanda", tagline: "Bicicleta, canais e Van Gogh na mesma tarde.",
    scores: { beach:4, mountain:1, urban:9, culture:9, food:6, adventure:4, chill:7, budget:4, warm:4, easy:6, exotic:4 } },
  { code: "CH", name: "Suíça", tagline: "Alpes, chocolate e trens no cartão-postal.",
    scores: { beach:2, mountain:10, urban:7, culture:7, food:7, adventure:9, chill:8, budget:1, warm:3, easy:5, exotic:5 } },
  { code: "AT", name: "Áustria", tagline: "Palácios, valsa e Alpes acessíveis.",
    scores: { beach:2, mountain:10, urban:8, culture:10, food:7, adventure:8, chill:7, budget:4, warm:4, easy:5, exotic:5 } },
  { code: "IS", name: "Islândia", tagline: "Auroras, gêiseres e paisagens de outro planeta.",
    scores: { beach:2, mountain:10, urban:5, culture:6, food:5, adventure:10, chill:8, budget:2, warm:1, easy:4, exotic:9 } },
  { code: "NO", name: "Noruega", tagline: "Fiordes, auroras e silêncio de tirar o fôlego.",
    scores: { beach:3, mountain:10, urban:7, culture:7, food:6, adventure:10, chill:9, budget:2, warm:2, easy:5, exotic:7 } },
  { code: "SE", name: "Suécia", tagline: "Design, floresta e verões de sol infinito.",
    scores: { beach:4, mountain:6, urban:9, culture:8, food:6, adventure:7, chill:9, budget:3, warm:3, easy:5, exotic:6 } },
  { code: "IE", name: "Irlanda", tagline: "Pubs, penhascos e verde até onde a vista alcança.",
    scores: { beach:3, mountain:6, urban:7, culture:8, food:6, adventure:7, chill:7, budget:4, warm:3, easy:5, exotic:5 } },
  { code: "CZ", name: "Tchéquia", tagline: "Praga medieval e a melhor cerveja do mundo.",
    scores: { beach:1, mountain:5, urban:9, culture:10, food:6, adventure:5, chill:7, budget:7, warm:4, easy:5, exotic:6 } },
  { code: "HU", name: "Hungria", tagline: "Termas, arquitetura imperial e ruin bars.",
    scores: { beach:1, mountain:4, urban:9, culture:9, food:7, adventure:5, chill:8, budget:7, warm:5, easy:5, exotic:6 } },
  { code: "HR", name: "Croácia", tagline: "Adriático cristalino e cidades muradas.",
    scores: { beach:10, mountain:6, urban:7, culture:8, food:7, adventure:8, chill:8, budget:6, warm:7, easy:6, exotic:5 } },
  { code: "TR", name: "Turquia", tagline: "Bazares, balões e o encontro de dois continentes.",
    scores: { beach:8, mountain:7, urban:9, culture:10, food:10, adventure:8, chill:7, budget:8, warm:7, easy:6, exotic:8 } },

  { code: "JP", name: "Japão", tagline: "Templos, neon e o cardápio mais preciso do planeta.",
    scores: { beach:5, mountain:8, urban:10, culture:10, food:10, adventure:8, chill:6, budget:4, warm:6, easy:4, exotic:10 } },
  { code: "KR", name: "Coreia do Sul", tagline: "K-pop, comida picante e tradição em pixel.",
    scores: { beach:5, mountain:7, urban:10, culture:9, food:9, adventure:7, chill:5, budget:5, warm:6, easy:4, exotic:9 } },
  { code: "CN", name: "China", tagline: "Muralha, megacidades e culinária infinita.",
    scores: { beach:5, mountain:9, urban:10, culture:10, food:10, adventure:8, chill:4, budget:7, warm:6, easy:3, exotic:10 } },
  { code: "TH", name: "Tailândia", tagline: "Praias paradisíacas, templos dourados e street food 24h.",
    scores: { beach:10, mountain:7, urban:8, culture:9, food:10, adventure:9, chill:8, budget:9, warm:10, easy:5, exotic:9 } },
  { code: "VN", name: "Vietnã", tagline: "Baía de Ha Long, pho fumegante e motos sem fim.",
    scores: { beach:8, mountain:8, urban:8, culture:9, food:10, adventure:9, chill:7, budget:10, warm:9, easy:4, exotic:9 } },
  { code: "ID", name: "Indonésia", tagline: "Bali, vulcões e templos escondidos na selva.",
    scores: { beach:10, mountain:9, urban:6, culture:9, food:8, adventure:10, chill:9, budget:9, warm:10, easy:4, exotic:9 } },
  { code: "PH", name: "Filipinas", tagline: "7 mil ilhas — mergulho e areia branca em série.",
    scores: { beach:10, mountain:7, urban:6, culture:7, food:6, adventure:10, chill:9, budget:8, warm:10, easy:5, exotic:8 } },
  { code: "SG", name: "Singapura", tagline: "Cidade-jardim futurista e hawker centers premiados.",
    scores: { beach:4, mountain:2, urban:10, culture:8, food:10, adventure:4, chill:6, budget:3, warm:10, easy:5, exotic:8 } },
  { code: "MY", name: "Malásia", tagline: "Encruzilhada cultural entre selva e arranha-céus.",
    scores: { beach:8, mountain:7, urban:8, culture:9, food:9, adventure:8, chill:7, budget:8, warm:10, easy:5, exotic:8 } },
  { code: "IN", name: "Índia", tagline: "Cores, especiarias e o choque cultural definitivo.",
    scores: { beach:6, mountain:9, urban:8, culture:10, food:10, adventure:8, chill:3, budget:10, warm:8, easy:3, exotic:10 } },
  { code: "NP", name: "Nepal", tagline: "Everest à vista e monastérios acima das nuvens.",
    scores: { beach:0, mountain:10, urban:4, culture:9, food:6, adventure:10, chill:5, budget:9, warm:5, easy:3, exotic:10 } },
  { code: "AE", name: "Emirados Árabes", tagline: "Deserto, luxo e arranha-céus impossíveis.",
    scores: { beach:7, mountain:3, urban:10, culture:6, food:8, adventure:7, chill:6, budget:3, warm:10, easy:5, exotic:8 } },
  { code: "JO", name: "Jordânia", tagline: "Petra escavada na rocha e o silêncio do Wadi Rum.",
    scores: { beach:5, mountain:7, urban:5, culture:10, food:8, adventure:9, chill:6, budget:6, warm:9, easy:4, exotic:9 } },
  { code: "IL", name: "Israel", tagline: "Três religiões, deserto e Tel Aviv à beira-mar.",
    scores: { beach:7, mountain:5, urban:8, culture:10, food:9, adventure:7, chill:5, budget:4, warm:8, easy:4, exotic:8 } },

  { code: "MA", name: "Marrocos", tagline: "Souks, deserto do Saara e riads sob estrelas.",
    scores: { beach:6, mountain:7, urban:7, culture:10, food:9, adventure:9, chill:6, budget:8, warm:9, easy:5, exotic:9 } },
  { code: "EG", name: "Egito", tagline: "Pirâmides, cruzeiro no Nilo e mergulho no Mar Vermelho.",
    scores: { beach:7, mountain:4, urban:6, culture:10, food:7, adventure:8, chill:5, budget:8, warm:10, easy:4, exotic:9 } },
  { code: "ZA", name: "África do Sul", tagline: "Safári, vinícolas e cidades entre dois oceanos.",
    scores: { beach:8, mountain:8, urban:8, culture:8, food:8, adventure:10, chill:6, budget:6, warm:7, easy:5, exotic:8 } },
  { code: "KE", name: "Quênia", tagline: "Big Five ao vivo na savana infinita.",
    scores: { beach:6, mountain:7, urban:5, culture:8, food:6, adventure:10, chill:5, budget:6, warm:9, easy:4, exotic:9 } },
  { code: "TZ", name: "Tanzânia", tagline: "Serengeti, Kilimanjaro e Zanzibar num só roteiro.",
    scores: { beach:9, mountain:9, urban:4, culture:8, food:6, adventure:10, chill:7, budget:6, warm:10, easy:4, exotic:9 } },

  { code: "AU", name: "Austrália", tagline: "Grande Barreira, outback e cidades à beira-mar.",
    scores: { beach:10, mountain:6, urban:9, culture:7, food:8, adventure:10, chill:7, budget:3, warm:8, easy:4, exotic:6 } },
  { code: "NZ", name: "Nova Zelândia", tagline: "Cenários de Senhor dos Anéis e adrenalina em cada curva.",
    scores: { beach:6, mountain:10, urban:6, culture:6, food:7, adventure:10, chill:8, budget:3, warm:5, easy:4, exotic:7 } },
  { code: "FJ", name: "Fiji", tagline: "Lagoas turquesa e o clichê perfeito do paraíso.",
    scores: { beach:10, mountain:5, urban:2, culture:7, food:6, adventure:8, chill:10, budget:4, warm:10, easy:3, exotic:9 } },
  { code: "MV", name: "Maldivas", tagline: "Bangalôs sobre a água — lua de mel definitiva.",
    scores: { beach:10, mountain:0, urban:1, culture:5, food:6, adventure:6, chill:10, budget:1, warm:10, easy:3, exotic:9 } },
  { code: "DO", name: "República Dominicana", tagline: "All-inclusive, coco e merengue.",
    scores: { beach:10, mountain:5, urban:4, culture:6, food:7, adventure:6, chill:9, budget:6, warm:10, easy:6, exotic:6 } },
  { code: "PA", name: "Panamá", tagline: "Dois oceanos, floresta e cidade em vidro espelhado.",
    scores: { beach:9, mountain:6, urban:7, culture:6, food:7, adventure:8, chill:7, budget:6, warm:10, easy:7, exotic:5 } },
  { code: "EC", name: "Equador", tagline: "Galápagos, Andes e Amazônia num país só.",
    scores: { beach:6, mountain:9, urban:5, culture:7, food:7, adventure:10, chill:6, budget:8, warm:7, easy:7, exotic:7 } },
];

// ------------- Perguntas -------------

export interface QuizChoice {
  label: string;
  emoji: string;
  weights: Partial<Record<Dimension, number>>; // -5..+5
}
export interface QuizQuestion {
  id: string;
  prompt: string;
  choices: QuizChoice[];
}

export const QUESTIONS: QuizQuestion[] = [
  {
    id: "vibe",
    prompt: "Que cenário te faz suspirar primeiro?",
    choices: [
      { label: "Praia deserta ao pôr do sol", emoji: "🏝️", weights: { beach: 5, chill: 3, warm: 3 } },
      { label: "Trilha entre montanhas", emoji: "🏔️", weights: { mountain: 5, adventure: 3 } },
      { label: "Metrópole em neon", emoji: "🌆", weights: { urban: 5, culture: 2 } },
      { label: "Ruínas milenares", emoji: "🏛️", weights: { culture: 5, exotic: 2 } },
    ],
  },
  {
    id: "day",
    prompt: "Dia perfeito de viagem é...",
    choices: [
      { label: "Rede, livro e nenhum compromisso", emoji: "🌴", weights: { chill: 5, beach: 2 } },
      { label: "Roteiro de museus e cafés", emoji: "☕", weights: { culture: 5, urban: 2 } },
      { label: "Rapel, mergulho, alguma adrenalina", emoji: "🪂", weights: { adventure: 5, mountain: 2 } },
      { label: "Comer em 6 lugares diferentes", emoji: "🍜", weights: { food: 5, urban: 2 } },
    ],
  },
  {
    id: "food",
    prompt: "Quanto a comida importa?",
    choices: [
      { label: "É o motivo da viagem", emoji: "🍣", weights: { food: 5 } },
      { label: "Adoro, mas não define o roteiro", emoji: "🥘", weights: { food: 2 } },
      { label: "Só quero comer bem sem drama", emoji: "🥗", weights: { food: 0 } },
      { label: "Se tem street food, tô dentro", emoji: "🌮", weights: { food: 4, exotic: 2, budget: 2 } },
    ],
  },
  {
    id: "climate",
    prompt: "Clima ideal?",
    choices: [
      { label: "Calor tropical o ano todo", emoji: "☀️", weights: { warm: 5, beach: 2 } },
      { label: "Ameno, uns 20°C", emoji: "🌤️", weights: { warm: 2, culture: 1 } },
      { label: "Frio e casaco pesado", emoji: "❄️", weights: { warm: -4, mountain: 2 } },
      { label: "Tanto faz, quero a paisagem", emoji: "🌈", weights: {} },
    ],
  },
  {
    id: "budget",
    prompt: "Como está o bolso?",
    choices: [
      { label: "Mochilão, cada real conta", emoji: "🎒", weights: { budget: 5, adventure: 2 } },
      { label: "Meio-termo esperto", emoji: "💳", weights: { budget: 2 } },
      { label: "Quero luxo, sem culpa", emoji: "🥂", weights: { budget: -4, urban: 2 } },
      { label: "Vou parcelar, foco na experiência", emoji: "✨", weights: {} },
    ],
  },
  {
    id: "pace",
    prompt: "Ritmo da viagem?",
    choices: [
      { label: "Lento — quero sentir o lugar", emoji: "🐢", weights: { chill: 5 } },
      { label: "Equilibrado — passeio + descanso", emoji: "⚖️", weights: { chill: 2, culture: 1 } },
      { label: "Intenso — quero ver tudo", emoji: "⚡", weights: { adventure: 3, urban: 2, culture: 2 } },
    ],
  },
  {
    id: "comfort",
    prompt: "O quanto você topa sair da zona de conforto?",
    choices: [
      { label: "Prefiro fácil — quase como em casa", emoji: "🏠", weights: { easy: 5, exotic: -3 } },
      { label: "Um pouco diferente, sem susto", emoji: "🙂", weights: { easy: 2 } },
      { label: "Quero choque cultural forte", emoji: "🌀", weights: { exotic: 5, easy: -2 } },
      { label: "Quanto mais raro, melhor", emoji: "🛕", weights: { exotic: 5, adventure: 2, easy: -3 } },
    ],
  },
  {
    id: "company",
    prompt: "Com quem você viaja?",
    choices: [
      { label: "Sozinho(a), quero me encontrar", emoji: "🧘", weights: { chill: 2, adventure: 2, easy: 1 } },
      { label: "Em casal, romântico", emoji: "💞", weights: { chill: 3, beach: 2, culture: 2 } },
      { label: "Com amigos, muita festa", emoji: "🎉", weights: { urban: 3, beach: 2 } },
      { label: "Em família, com crianças", emoji: "👨‍👩‍👧", weights: { easy: 4, chill: 2, adventure: -2 } },
    ],
  },
];

// ------------- Cálculo -------------

export type Answers = Record<string, number>; // questionId -> choice index

export interface QuizResult {
  profile: CountryProfile;
  score: number;   // 0-100 normalizado
  matchPct: number;
}

export function computeResults(answers: Answers): QuizResult[] {
  // 1) Constrói vetor de pesos do usuário somando as escolhas
  const userWeights: Record<string, number> = {};
  for (const q of QUESTIONS) {
    const idx = answers[q.id];
    if (idx == null) continue;
    const choice = q.choices[idx];
    if (!choice) continue;
    for (const [dim, w] of Object.entries(choice.weights)) {
      userWeights[dim] = (userWeights[dim] ?? 0) + (w ?? 0);
    }
  }

  // 2) Score = soma(peso_usuario * score_pais / 10) para cada dimensão
  const scored = PROFILES.map((p) => {
    let raw = 0;
    let maxPossible = 0;
    for (const [dim, weight] of Object.entries(userWeights)) {
      const paisScore = (p.scores as Record<string, number>)[dim] ?? 5; // neutro se não definido
      raw += weight * (paisScore / 10);
      maxPossible += Math.abs(weight); // teto se país tirasse 10 em tudo
    }
    // normaliza 0-100
    const pct = maxPossible > 0
      ? Math.round(((raw + maxPossible) / (2 * maxPossible)) * 100)
      : 50;
    return { profile: p, score: raw, matchPct: Math.max(0, Math.min(100, pct)) };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 3);
}

export function buildShareText(top: QuizResult[]): string {
  const lines = [
    "🌍 Meu perfil no Mundo em Foco:",
    "",
    ...top.map((r, i) => `${["🥇","🥈","🥉"][i]} ${r.profile.name} — ${r.matchPct}% match`),
    "",
    "Descubra o seu:",
  ];
  return lines.join("\n");
}

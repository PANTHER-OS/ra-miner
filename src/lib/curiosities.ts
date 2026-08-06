import type { Country } from "./countries";
import { getPtName, getRegionPt, getSubregionPt } from "./countries";

// Curadoria de curiosidades para os países mais buscados.
// Chave: cca2 (ISO 3166-1 alpha-2).
const CURATED: Record<string, string[]> = {
  BR: [
    "Abriga a maior floresta tropical do planeta, a Amazônia, com mais de 5,5 milhões de km².",
    "É o único país da América do Sul cujo idioma oficial é o português.",
    "O Cristo Redentor, no Rio de Janeiro, é uma das Sete Maravilhas do Mundo Moderno.",
    "O Carnaval brasileiro é a maior festa popular do mundo, movimentando bilhões todo ano.",
    "Feijoada, pão de queijo e brigadeiro estão entre os símbolos gastronômicos mais amados.",
  ],
  US: [
    "Composto por 50 estados, dois deles (Alasca e Havaí) não fazem fronteira com os demais.",
    "O Grand Canyon, no Arizona, tem mais de 1,6 km de profundidade em alguns pontos.",
    "É o berço do jazz, do rock and roll, do hip-hop e da indústria cinematográfica de Hollywood.",
    "O sistema de rodovias interestaduais tem mais de 77 mil km — um dos maiores do mundo.",
  ],
  JP: [
    "Arquipélago com mais de 14 mil ilhas, das quais cerca de 430 são habitadas.",
    "O Monte Fuji, com 3.776 m, é considerado sagrado e é um dos símbolos do país.",
    "Tem o sistema de trens-bala (Shinkansen) mais pontual do mundo — atrasos são medidos em segundos.",
    "É a terra do sushi, do ramen, dos mangás, do anime e da estética wabi-sabi.",
    "Tóquio é a maior região metropolitana do planeta, com mais de 37 milhões de habitantes.",
  ],
  FR: [
    "A Torre Eiffel foi construída para a Exposição Universal de 1889 e mede 330 m com antena.",
    "Paris tem mais de 130 museus — o Louvre é o mais visitado do mundo.",
    "Berço do iluminismo, da alta gastronomia e da moda contemporânea.",
    "Croissant, baguete, queijos e vinhos são patrimônios da cultura francesa.",
  ],
  IT: [
    "Roma foi capital de um império que durou mais de mil anos e moldou o Ocidente.",
    "Abriga o Vaticano, o menor país do mundo, dentro de suas fronteiras.",
    "Inventou a massa, a pizza napolitana e o expresso — pilares da culinária global.",
    "Tem 60 sítios classificados pela UNESCO, mais do que qualquer outro país.",
  ],
  ES: [
    "Segundo país mais montanhoso da Europa, atrás apenas da Suíça.",
    "É o país onde surgiram o flamenco, os touros de Pamplona e a paella valenciana.",
    "A Sagrada Família, em Barcelona, começou a ser construída em 1882 e ainda não foi concluída.",
    "O espanhol é falado por mais de 500 milhões de pessoas no mundo.",
  ],
  DE: [
    "Tem mais de 1.500 tipos de salsicha e cerca de 1.300 cervejarias em operação.",
    "O Muro de Berlim caiu em 1989, marcando o fim da Guerra Fria na Europa.",
    "Berço de Beethoven, Bach, Goethe e da engenharia automotiva de precisão.",
    "A Autobahn é famosa por trechos sem limite de velocidade.",
  ],
  GB: [
    "Formada por Inglaterra, Escócia, País de Gales e Irlanda do Norte.",
    "Berço do futebol moderno, do rúgbi e do críquete.",
    "Londres tem o metrô mais antigo do mundo, inaugurado em 1863.",
    "A monarquia britânica é uma das mais antigas ainda em atividade no planeta.",
  ],
  CN: [
    "A Grande Muralha se estende por mais de 21 mil km — visível do espaço em condições ideais.",
    "Inventou o papel, a bússola, a pólvora e a imprensa muito antes do Ocidente.",
    "É o país mais populoso do mundo por décadas, hoje disputa o posto com a Índia.",
    "O chá foi descoberto na China há mais de 4 mil anos.",
  ],
  IN: [
    "Berço de quatro grandes religiões: hinduísmo, budismo, jainismo e sikhismo.",
    "O Taj Mahal foi construído no século XVII como um mausoléu por amor.",
    "É o maior produtor mundial de filmes — Bollywood lança mais de 1.500 por ano.",
    "Tem 22 idiomas oficiais e mais de 700 dialetos falados no território.",
  ],
  AR: [
    "É o berço do tango, dançado nas ruas de Buenos Aires desde o século XIX.",
    "Abriga a Cataratas do Iguaçu na fronteira com o Brasil — 275 quedas d'água.",
    "O bife argentino e o mate são símbolos culturais do país.",
    "A Patagônia argentina tem geleiras milenares como o Perito Moreno.",
  ],
  MX: [
    "Berço das civilizações maia e asteca — cidades como Chichén Itzá impressionam até hoje.",
    "Inventou o chocolate: os astecas o consumiam como bebida cerimonial amarga.",
    "O Dia dos Mortos é Patrimônio Cultural Imaterial da Humanidade.",
    "Tem 68 línguas indígenas reconhecidas oficialmente.",
  ],
  CA: [
    "Segundo maior país do mundo em território, atrás apenas da Rússia.",
    "Tem mais lagos do que todos os outros países do mundo somados.",
    "Bilíngue oficial: inglês e francês, com Quebec preservando fortemente o francês.",
    "As Cataratas do Niágara, na fronteira com os EUA, atraem milhões de visitantes por ano.",
  ],
  AU: [
    "É um dos poucos lugares onde vivem cangurus, coalas, ornitorrincos e diabos-da-tasmânia.",
    "A Grande Barreira de Corais é a maior estrutura viva do planeta, visível do espaço.",
    "O Uluru (Ayers Rock) é um monólito sagrado no coração vermelho do deserto.",
    "Cerca de 85% da população vive a menos de 50 km do litoral.",
  ],
  RU: [
    "Maior país do mundo em território, atravessando 11 fusos horários.",
    "O Transiberiano é a ferrovia mais longa do planeta, com 9.289 km entre Moscou e Vladivostok.",
    "O Lago Baikal contém cerca de 20% da água doce superficial do mundo.",
    "Berço de Tolstói, Dostoiévski, Tchaikóvski e do balé Bolshoi.",
  ],
  ZA: [
    "Único país do mundo com três capitais: Pretória, Cidade do Cabo e Bloemfontein.",
    "Tem 11 idiomas oficiais reconhecidos pela constituição.",
    "Berço de Nelson Mandela e do fim histórico do apartheid em 1994.",
    "O Kruger National Park é um dos maiores refúgios de fauna selvagem da África.",
  ],
  EG: [
    "As pirâmides de Gizé têm mais de 4.500 anos e são a única maravilha antiga ainda de pé.",
    "O Rio Nilo é o mais longo do mundo, com 6.650 km.",
    "A civilização egípcia é uma das mais antigas contínuas da história humana.",
    "Escreveram em hieróglifos por mais de 3 mil anos.",
  ],
  GR: [
    "Berço da democracia, da filosofia ocidental e dos Jogos Olímpicos.",
    "Tem mais de 6 mil ilhas e ilhotas, das quais cerca de 227 são habitadas.",
    "A Acrópole de Atenas foi construída no século V a.C.",
    "O azeite grego é considerado um dos melhores do mundo.",
  ],
  TR: [
    "É o único país do mundo em dois continentes: Europa e Ásia.",
    "Istambul foi capital de três impérios: romano, bizantino e otomano.",
    "A Capadócia tem paisagens de outro planeta e balões que decolam ao amanhecer.",
    "O döner kebab e o café turco são reconhecidos pela UNESCO.",
  ],
  PT: [
    "Um dos países mais antigos da Europa, com fronteiras praticamente inalteradas desde 1139.",
    "O fado é Patrimônio Cultural Imaterial da Humanidade.",
    "Os portugueses foram pioneiros nas grandes navegações do século XV.",
    "O pastel de nata é um dos doces mais copiados do mundo.",
  ],
  NL: [
    "Cerca de 26% do território está abaixo do nível do mar — protegido por diques históricos.",
    "Amsterdã tem mais de 100 km de canais e mais bicicletas do que habitantes.",
    "É o maior exportador de flores do planeta — as tulipas são símbolo nacional.",
    "Os holandeses estão entre os povos mais altos do mundo em média.",
  ],
  SE: [
    "Berço do IKEA, do Spotify e da banda ABBA.",
    "Tem cerca de 100 mil lagos e mais de 220 mil ilhas.",
    "Estocolmo é construída sobre 14 ilhas conectadas por 57 pontes.",
    "O 'allemansrätten' garante direito público de acesso à natureza em qualquer lugar.",
  ],
  NO: [
    "Os fiordes noruegueses são Patrimônio Mundial da UNESCO.",
    "Local do sol da meia-noite no verão e da aurora boreal no inverno.",
    "Tem o maior fundo soberano do mundo, financiado pelo petróleo do Mar do Norte.",
    "Berço do esqui — a palavra 'ski' vem do norueguês antigo.",
  ],
  CH: [
    "Neutralidade internacional preservada há mais de 200 anos.",
    "Sede de bancos, relojoeiros e organizações internacionais como a Cruz Vermelha e a ONU.",
    "Tem quatro idiomas oficiais: alemão, francês, italiano e romanche.",
    "O chocolate suíço e os queijos como o gruyère são referências mundiais.",
  ],
  KR: [
    "Origem do K-pop, dos K-dramas e da onda cultural 'Hallyu' que conquistou o mundo.",
    "Seul é uma das cidades mais conectadas do planeta, com internet ultrarrápida.",
    "O kimchi é servido em quase todas as refeições e é Patrimônio da UNESCO.",
    "Tem um dos alfabetos mais lógicos do mundo, o Hangul, criado no século XV.",
  ],
  TH: [
    "Único país do sudeste asiático que nunca foi colonizado por europeus.",
    "Bangkok tem o nome cerimonial mais longo do mundo — com 168 letras.",
    "Templos budistas dourados e praias paradisíacas atraem milhões de turistas.",
    "A comida tailandesa é famosa pelo equilíbrio entre doce, azedo, salgado e picante.",
  ],
  ID: [
    "Arquipélago com mais de 17 mil ilhas — só cerca de 6 mil são habitadas.",
    "Tem a maior população muçulmana do mundo.",
    "Bali é uma das ilhas mais famosas por sua cultura hindu e templos.",
    "O dragão-de-komodo, maior lagarto vivo do planeta, é endêmico do país.",
  ],
  VN: [
    "A baía de Halong tem quase 2.000 ilhotas de calcário emergindo do mar.",
    "É o segundo maior exportador de café do mundo.",
    "O pho e o banh mi tornaram-se símbolos globais da culinária vietnamita.",
    "A moto é o principal meio de transporte — Hanói tem mais de 5 milhões delas.",
  ],
  AE: [
    "Dubai abriga o edifício mais alto do mundo, o Burj Khalifa, com 828 m.",
    "Formado por sete emirados unidos em 1971.",
    "Passou de vilas de pescadores a metrópoles ultra-modernas em poucas décadas.",
    "O deserto ocupa cerca de 80% do território.",
  ],
  SA: [
    "Abriga Meca e Medina, as duas cidades mais sagradas do islã.",
    "Maior país do mundo sem nenhum rio permanente.",
    "É o berço do petróleo moderno e um dos maiores exportadores do planeta.",
    "O deserto do Rub' al Khali é o maior deserto de areia contínuo do mundo.",
  ],
  IL: [
    "Jerusalém é considerada sagrada por judeus, cristãos e muçulmanos.",
    "O Mar Morto está 430 m abaixo do nível do mar — o ponto mais baixo em terra firme.",
    "É um polo global de startups e tecnologia, apelidado de 'Startup Nation'.",
    "Tel Aviv concentra praias, vida noturna e arquitetura Bauhaus.",
  ],
  NG: [
    "País mais populoso da África, com mais de 220 milhões de habitantes.",
    "Nollywood, a indústria cinematográfica nigeriana, é a segunda maior do mundo em volume.",
    "Berço da música afrobeats, que conquistou o mainstream global.",
    "Tem mais de 500 línguas faladas em seu território.",
  ],
  KE: [
    "O Great Rift Valley corta o país e é considerado o berço da humanidade.",
    "A migração anual do Serengeti-Mara é um dos maiores espetáculos naturais do mundo.",
    "É líder mundial em corredores de longa distância.",
    "O suaíli e o inglês são idiomas oficiais.",
  ],
  MA: [
    "Marrakech tem uma medina medieval reconhecida pela UNESCO.",
    "O deserto do Saara ocupa boa parte do sul do país.",
    "É famoso pelos souks, pelas cores dos tapetes e pelo tajine.",
    "Foi o primeiro país a reconhecer a independência dos EUA, em 1777.",
  ],
  IE: [
    "A capital, Dublin, é reconhecida pela UNESCO como Cidade da Literatura.",
    "Cerca de 40% da população mundial celebra o Dia de São Patrício.",
    "Tem paisagens verdes tão intensas que ganhou o apelido de 'Ilha Esmeralda'.",
    "Berço do Guinness, do U2 e de escritores como James Joyce e Oscar Wilde.",
  ],
  IS: [
    "Terra do gelo e do fogo — geleiras convivem com mais de 130 vulcões ativos.",
    "Praticamente 100% da energia elétrica vem de fontes renováveis.",
    "Não tem exército — é um dos países mais pacíficos do mundo.",
    "A aurora boreal pode ser vista boa parte do inverno.",
  ],
  NZ: [
    "As paisagens dramáticas serviram de cenário para 'O Senhor dos Anéis'.",
    "Os maori chegaram à ilha há cerca de 800 anos e mantêm cultura viva.",
    "Foi o primeiro país do mundo a dar às mulheres o direito ao voto, em 1893.",
    "Tem mais ovelhas do que pessoas.",
  ],
  CL: [
    "É o país mais longo do mundo no sentido norte-sul, com mais de 4.300 km.",
    "O deserto do Atacama é o mais árido do planeta.",
    "A Ilha de Páscoa e seus moais são um dos mistérios mais famosos da arqueologia.",
    "É o maior produtor mundial de cobre.",
  ],
  PE: [
    "Machu Picchu é uma das Sete Maravilhas do Mundo Moderno.",
    "Berço da civilização inca e de uma das gastronomias mais premiadas do mundo.",
    "Lima é considerada capital gastronômica da América Latina.",
    "A Amazônia peruana cobre cerca de 60% do território.",
  ],
  CO: [
    "Segundo país mais biodiverso do mundo, atrás apenas do Brasil.",
    "Único país sul-americano com litoral tanto no Pacífico quanto no Atlântico.",
    "É famoso pelo café, pela salsa e pela cumbia.",
    "Cartagena das Índias é uma joia colonial preservada pela UNESCO.",
  ],
};

export function getCuriosities(c: Country): string[] {
  const curated = CURATED[c.cca2];
  if (curated) return curated;

  const name = getPtName(c);
  const region = getRegionPt(c.region);
  const capital = c.capital?.[0];
  const langs = c.languages ? Object.values(c.languages) : [];
  const currency = c.currencies ? Object.values(c.currencies)[0] : null;

  const facts: string[] = [];
  if (capital) facts.push(`A capital de ${name} é ${capital}.`);
  facts.push(`Está localizado na região da ${region}${c.subregion ? `, mais precisamente ${getSubregionPt(c.subregion)}` : ""}.`);
  if (langs.length) {
    facts.push(
      langs.length === 1
        ? `O idioma oficial é o ${langs[0].toLowerCase()}.`
        : `Tem ${langs.length} idiomas oficiais reconhecidos, incluindo ${langs.slice(0, 3).join(", ").toLowerCase()}.`,
    );
  }
  if (currency) {
    facts.push(`A moeda oficial é ${currency.name}${currency.symbol ? ` (${currency.symbol})` : ""}.`);
  }
  if (c.area) {
    facts.push(`Ocupa uma área de aproximadamente ${new Intl.NumberFormat("pt-BR").format(Math.round(c.area))} km².`);
  }
  return facts;
}

import type { Country } from "./countries";

export interface ItineraryStop {
  time: string;
  period: "amanhecer" | "manha" | "almoco" | "tarde" | "entardecer" | "jantar" | "noite";
  title: string;
  place: string;
  where?: string;
  why: string;
  tip?: string;
}

export interface Itinerary {
  city: string;
  intro: string;
  stops: ItineraryStop[];
  curated: boolean;
}

// ============================================================================
// Roteiros curados — cidade principal, lugares REAIS, horários realistas.
// Cada parada tem: local exato + endereço/bairro + o que pedir/fazer.
// ============================================================================

const CURATED: Record<string, Itinerary> = {
  BRA: {
    city: "Rio de Janeiro",
    intro: "Um dia clássico carioca: pão de queijo, praia, mirante e samba ao pôr do sol.",
    stops: [
      { time: "07:30", period: "amanhecer", title: "Café da manhã carioca", place: "Confeitaria Colombo", where: "Rua Gonçalves Dias, 32 — Centro", why: "Salão art nouveau de 1894. Peça pão de queijo, café coado e um pastel de Belém.", tip: "Chegue antes das 8h pra pegar a mesa do mezanino sem fila." },
      { time: "09:00", period: "manha", title: "Bondinho do Pão de Açúcar", place: "Praia Vermelha, Urca", why: "Suba nos dois teleféricos até 396 m. Vista de 360° da Guanabara com o Cristo ao fundo.", tip: "Compre online: fura fila e economiza 40 min." },
      { time: "12:30", period: "almoco", title: "Almoço à beira-mar", place: "Aconchego Carioca", where: "Praça Edmundo Rego, 30 — Tijuca", why: "Bolinho de feijoada premiado no Comida di Buteco. Peça com cachaça artesanal." },
      { time: "14:30", period: "tarde", title: "Praia de Ipanema — Posto 9", place: "Rua Vinícius de Moraes", why: "O trecho mais vibrante da orla. Alugue cadeira e peça um mate com biscoito Globo." },
      { time: "17:30", period: "entardecer", title: "Pôr do sol no Arpoador", place: "Pedra do Arpoador", why: "Ritual carioca: quando o sol se põe no mar, todo mundo aplaude. Sério." },
      { time: "20:00", period: "jantar", title: "Feijoada e samba", place: "Bar Urca / Rio Scenarium", where: "Rua do Lavradio, 20 — Lapa", why: "Casarão de 3 andares com roda de samba ao vivo e cozinha brasileira honesta." },
      { time: "23:00", period: "noite", title: "Boemia da Lapa", place: "Arcos da Lapa", why: "Rua vira palco: choro, forró, caipirinha de R$ 15. Fica até o sol raiar." },
    ],
    curated: true,
  },
  JPN: {
    city: "Tóquio",
    intro: "Do mercado do peixe ao neon de Shinjuku, atravessando templo, jardim e sushi de balcão.",
    stops: [
      { time: "06:30", period: "amanhecer", title: "Café de tamagoyaki", place: "Mercado Externo de Tsukiji", where: "Chuo City", why: "Ovos doces grelhados no espeto, ostras cruas e chá matcha direto do produtor.", tip: "Vá antes das 8h — depois vira turismo puro." },
      { time: "09:00", period: "manha", title: "Templo Sensō-ji", place: "Asakusa", why: "Templo budista mais antigo de Tóquio (645 d.C.). Compre um omikuji (sorte por 100¥)." },
      { time: "11:30", period: "manha", title: "Jardim Hamarikyū", place: "Chuo City", why: "Antigo jardim do xogum. Pare na casa de chá Nakajima pra um matcha cerimonial (720¥)." },
      { time: "13:00", period: "almoco", title: "Sushi de balcão", place: "Sushi Dai (ou Daiwa)", where: "Toyosu Market", why: "Omakase de 10 peças com atum leiloado no mesmo dia. ~4.500¥." },
      { time: "15:00", period: "tarde", title: "Cruzamento de Shibuya + Hachikō", place: "Shibuya Scramble", why: "3.000 pessoas atravessando ao mesmo tempo. Suba no Starbucks do Q-Front pra filmar de cima." },
      { time: "17:30", period: "entardecer", title: "Observatório grátis", place: "Tokyo Metropolitan Government Building", where: "Shinjuku", why: "202 m de altura, entrada zero. Se o dia estiver limpo, dá pra ver o Fuji." },
      { time: "19:30", period: "jantar", title: "Yakitori em beco", place: "Omoide Yokochō", where: "Nishi-Shinjuku", why: "'Beco das memórias': 60 barzinhos apertados de espetinhos e cerveja gelada." },
      { time: "22:00", period: "noite", title: "Golden Gai", place: "Kabukichō", why: "6 vielas com 200 bares minúsculos (5 lugares cada). Escolha um sem couvert e converse com o dono." },
    ],
    curated: true,
  },
  ITA: {
    city: "Roma",
    intro: "Café no balcão, ruínas imperiais, cacio e pepe em Trastevere e gelato à meia-noite.",
    stops: [
      { time: "07:30", period: "amanhecer", title: "Espresso em pé", place: "Sant'Eustachio Il Caffè", where: "Piazza di Sant'Eustachio, 82", why: "O café mais famoso de Roma. Peça un gran caffè no balcão (€1,30) — sentar custa o triplo." },
      { time: "09:00", period: "manha", title: "Coliseu + Fórum Romano", place: "Piazza del Colosseo", why: "Ticket combo €18. Reserve online com hora marcada — fila presencial passa de 2h." },
      { time: "12:00", period: "manha", title: "Panteão", place: "Piazza della Rotonda", why: "Cúpula de concreto de 43 m intacta desde 126 d.C. Entrada €5, 20 min bastam." },
      { time: "13:00", period: "almoco", title: "Cacio e pepe autêntico", place: "Felice a Testaccio", where: "Via Mastro Giorgio, 29", why: "Massa misturada na mesa. Também peça saltimbocca. Reserve." },
      { time: "15:30", period: "tarde", title: "Fontana di Trevi + Escadaria Espanhola", place: "Centro Storico", why: "Jogue a moeda com a mão direita por cima do ombro esquerdo — garante volta a Roma." },
      { time: "17:30", period: "entardecer", title: "Aperitivo com vista", place: "Terrazza Borromini", where: "Piazza Navona, 14", why: "Rooftop sobre a cúpula de Sant'Agnese. Spritz + tábua de queijos ~€20." },
      { time: "20:00", period: "jantar", title: "Jantar em Trastevere", place: "Da Enzo al 29", where: "Via dei Vascellari, 29", why: "Trattoria de 20 lugares. Carbonara e polpette al sugo. Chegue às 19h30 pra pegar mesa." },
      { time: "23:00", period: "noite", title: "Gelato à meia-noite", place: "Gelateria del Teatro", where: "Via dei Coronari, 65", why: "Sorvetes com ervas frescas do quintal. Peça sálvia com framboesa." },
    ],
    curated: true,
  },
  FRA: {
    city: "Paris",
    intro: "Croissant, museu, piquenique no Sena, bistrô e vinho até tarde.",
    stops: [
      { time: "08:00", period: "amanhecer", title: "Croissant premiado", place: "Du Pain et des Idées", where: "34 Rue Yves Toudic, 10º", why: "Croissant e escargot au chocolat feitos com manteiga AOP. Peça pra viagem e coma no Canal Saint-Martin." },
      { time: "09:30", period: "manha", title: "Louvre — entrada Porte des Lions", place: "Rue de Rivoli", why: "Entrada lateral com fila 5x menor. Vá direto ver a Vitória de Samotrácia antes da Mona Lisa." },
      { time: "12:30", period: "almoco", title: "Bistrô de bairro", place: "Chez Janou", where: "2 Rue Roger Verlomme, Marais", why: "Provençal descontraído. Peça ratatouille e a mousse de chocolate (buffet livre, sério)." },
      { time: "14:30", period: "tarde", title: "Musée d'Orsay", place: "1 Rue de la Légion d'Honneur", why: "Impressionistas em antiga estação de trem. 2h bastam. Não perca o relógio do 5º andar." },
      { time: "17:00", period: "entardecer", title: "Piquenique no Sena", place: "Pont des Arts / Quai de Conti", why: "Passe na Nicolas por vinho + na fromagerie Laurent Dubois por queijo. €15 total, vista de milhão." },
      { time: "19:30", period: "jantar", title: "Steak frites clássico", place: "Le Relais de l'Entrecôte", where: "20 Rue Saint-Benoît, Saint-Germain", why: "Cardápio único: entrecôte com molho secreto + fritas ilimitadas. €29." },
      { time: "22:00", period: "noite", title: "Torre Eiffel piscando", place: "Champ de Mars", why: "A cada hora cheia, 5 min de cintilação. Deite na grama com uma taça de champagne." },
    ],
    curated: true,
  },
  USA: {
    city: "Nova York",
    intro: "Bagel no Lower East Side, arte, high line e um slice de pizza depois da meia-noite.",
    stops: [
      { time: "08:00", period: "amanhecer", title: "Bagel com lox", place: "Russ & Daughters", where: "179 E Houston St", why: "Desde 1914. Peça 'The Classic': salmão defumado, cream cheese e alcaparras no bagel de gergelim." },
      { time: "09:30", period: "manha", title: "Ferry pra Estátua da Liberdade", place: "Battery Park", why: "Ou pegue o Staten Island Ferry (grátis!) que passa do lado com a mesma vista." },
      { time: "12:30", period: "almoco", title: "Chelsea Market", place: "75 9th Ave", why: "Lobster roll no Lobster Place ou taco no Los Tacos No. 1 (o melhor de Manhattan)." },
      { time: "14:00", period: "tarde", title: "The High Line", place: "Gansevoort St → 34th St", why: "Parque suspenso em antiga linha de trem. 2,3 km de arte pública e vistas do Hudson." },
      { time: "16:30", period: "tarde", title: "MoMA", place: "11 W 53rd St", why: "Van Gogh, Warhol, Picasso. Sexta 16h–20h é grátis (mas lotado). US$ 30 no resto." },
      { time: "19:00", period: "jantar", title: "Pastrami sagrado", place: "Katz's Delicatessen", where: "205 E Houston St", why: "Sanduíche de pastrami de 800g fatiado na sua frente. US$ 27, divida com alguém." },
      { time: "21:30", period: "noite", title: "Jazz no Village", place: "Village Vanguard", where: "178 7th Ave South", why: "Porão histórico desde 1935. Coltrane gravou aqui. Cover US$ 40, 2 sets por noite." },
      { time: "00:30", period: "noite", title: "Slice de madrugada", place: "Joe's Pizza", where: "7 Carmine St", why: "US$ 3,50 a fatia. Aberto até as 4h. É a pizza que Peter Parker come." },
    ],
    curated: true,
  },
  GBR: {
    city: "Londres",
    intro: "Full english, museu grátis, pub histórico e vista do Tâmisa ao entardecer.",
    stops: [
      { time: "08:30", period: "amanhecer", title: "Full english breakfast", place: "Regency Café", where: "17-19 Regency St, Westminster", why: "Café operário desde 1946. Ovos, bacon, feijão, black pudding. £8, cash only." },
      { time: "10:00", period: "manha", title: "British Museum", place: "Great Russell St", why: "Pedra de Roseta, mármores do Partenon. Entrada GRÁTIS. Vá direto pra Sala 4 (Egito)." },
      { time: "12:30", period: "almoco", title: "Fish & chips do jeito certo", place: "Poppies Fish & Chips", where: "6-8 Hanbury St, Spitalfields", why: "Bacalhau fresco de Billingsgate, batata cortada na hora. £16 com mushy peas." },
      { time: "14:30", period: "tarde", title: "Passeio por Westminster", place: "Big Ben → Abadia → Praça do Parlamento", why: "Fotos clássicas + entre na Abadia (£29) onde reis são coroados desde 1066." },
      { time: "17:00", period: "entardecer", title: "London Eye ou Sky Garden grátis", place: "Sky Garden — 20 Fenchurch St", why: "Jardim tropical no 35º andar. Reserve grátis com 3 semanas de antecedência." },
      { time: "19:00", period: "jantar", title: "Sunday roast (ou pie & mash)", place: "The Harwood Arms", where: "Walham Grove, Fulham", why: "Único pub de Londres com estrela Michelin. Reserve. Alternativa: Blackfriar (£15)." },
      { time: "21:30", period: "noite", title: "Pint em pub vitoriano", place: "Ye Olde Cheshire Cheese", where: "145 Fleet St", why: "Reconstruído em 1667 depois do incêndio. Dickens era freguês. Peça uma London Pride." },
    ],
    curated: true,
  },
  ESP: {
    city: "Barcelona",
    intro: "Churros, Gaudí, tapas no Born e vermute na praia até o sol sumir.",
    stops: [
      { time: "08:30", period: "amanhecer", title: "Churros com chocolate", place: "Granja M. Viader", where: "Carrer d'en Xuclà, 4-6", why: "Inventores do Cacaolat (1931). Chocolate quente denso + churros crocantes. €6." },
      { time: "10:00", period: "manha", title: "Sagrada Família", place: "Carrer de Mallorca, 401", why: "Reserve online COM subida à torre (€36). A luz da manhã pelos vitrais é obra à parte." },
      { time: "13:00", period: "almoco", title: "Menu del día no Born", place: "Bar del Pla", where: "Carrer de Montcada, 2", why: "3 pratos + vinho por €18. Peça os canelones e o bacalhau confitado." },
      { time: "15:30", period: "tarde", title: "Park Güell", place: "Carrer d'Olot", why: "Reserve online (€10). Suba pela escada do dragão e sente no banco ondulado de mosaico." },
      { time: "18:00", period: "entardecer", title: "Vermute na Barceloneta", place: "Bodega La Peninsular", where: "Carrer del Mar, 29", why: "Vermute da casa direto do barril (€3) com anchovas de Cantábria e olivas." },
      { time: "20:30", period: "jantar", title: "Tapas de balcão", place: "Cal Pep", where: "Plaça de les Olles, 8", why: "Sem menu — coma o que Pep servir. Peça a truita de camarão e as ameixas com bacon." },
      { time: "23:00", period: "noite", title: "Cocktail em bar secreto", place: "Paradiso", where: "Carrer de Rera Palau, 4", why: "Entrada pela geladeira de uma pastrami shop. Eleito melhor bar do mundo (2022)." },
    ],
    curated: true,
  },
  PRT: {
    city: "Lisboa",
    intro: "Pastel de nata, elétrico amarelo, bacalhau e fado numa taberna de Alfama.",
    stops: [
      { time: "08:30", period: "amanhecer", title: "Pastel de nata original", place: "Pastéis de Belém", where: "Rua de Belém, 84-92", why: "Receita secreta desde 1837. Peça 2 quentes com canela e açúcar. €1,40 cada." },
      { time: "10:00", period: "manha", title: "Mosteiro dos Jerónimos", place: "Praça do Império", why: "Manuelino em pedra caliça. €10. Vasco da Gama está enterrado ali dentro." },
      { time: "12:30", period: "almoco", title: "Bacalhau à Brás", place: "Ramiro (marisqueira)", where: "Av. Almirante Reis, 1", why: "Amêijoas à Bulhão Pato + prego no pão de sobremesa. Chegue às 12h ou pegue fila." },
      { time: "15:00", period: "tarde", title: "Elétrico 28", place: "Praça Martim Moniz", why: "€3 no bilhete simples. Passa por Graça, Alfama, Baixa e Estrela em 40 min de zigue-zague." },
      { time: "17:30", period: "entardecer", title: "Miradouro da Senhora do Monte", place: "Graça", why: "O mais alto de Lisboa. Barzinho na esquina serve ginjinha (€1,50) em copinho de chocolate." },
      { time: "20:00", period: "jantar", title: "Petiscos em Alfama", place: "A Baiuca", where: "Rua de São Miguel, 20", why: "Taberna minúscula com fado vadio — os próprios vizinhos cantam. Reserve." },
      { time: "23:00", period: "noite", title: "Rooftop no Bairro Alto", place: "Park Bar", where: "Calçada do Combro, 58 (topo do estacionamento)", why: "Escondido no 6º andar de um edifício-garagem. Vista do Tejo + DJ." },
    ],
    curated: true,
  },
  ARG: {
    city: "Buenos Aires",
    intro: "Café de especialidade, feira de San Telmo, parrilla ao meio-dia e milonga até de manhã.",
    stops: [
      { time: "09:00", period: "amanhecer", title: "Medialunas + café", place: "Full City Coffee House", where: "Thames 1535, Palermo", why: "Medialunas de manteiga com café de origem. AR$ 3.500 o combo." },
      { time: "10:30", period: "manha", title: "Recoleta + Cemitério", place: "Junín 1760", why: "Túmulo da Evita entre 4.700 mausoléus. Grátis. Depois passe no Floralis Genérica." },
      { time: "13:00", period: "almoco", title: "Parrilla clássica", place: "Don Julio", where: "Guatemala 4699, Palermo", why: "Bife de chorizo + provoleta + vinho Malbec da casa. Reserve com 2 meses (sério)." },
      { time: "16:00", period: "tarde", title: "Feira de San Telmo", place: "Plaza Dorrego (domingos) / Defensa", why: "13 quadras de antiguidades, tango na rua e alfajores de dulce de leche recém-feitos." },
      { time: "18:30", period: "entardecer", title: "Café Tortoni", place: "Av. de Mayo 825", why: "Aberto desde 1858. Peça um submarino (leite quente com barra de chocolate)." },
      { time: "21:00", period: "jantar", title: "Empanadas e vinho", place: "El Cuartito", where: "Talcahuano 937", why: "Pizza de molde e fugazzeta desde 1934. Peça meia muzza + meia fugazzeta." },
      { time: "00:00", period: "noite", title: "Milonga autêntica", place: "La Catedral Club", where: "Sarmiento 4006, Almagro", why: "Galpão com pé-direito de 12 m. Aula de tango às 22h, milonga vai até 4h." },
    ],
    curated: true,
  },
  MEX: {
    city: "Cidade do México",
    intro: "Tamal de café da manhã, muralistas, taco al pastor e mezcal em Roma Norte.",
    stops: [
      { time: "08:00", period: "amanhecer", title: "Tamales oaxaqueños", place: "Tamales Doña Emi", where: "Av. Álvaro Obregón, Roma Norte", why: "Tamal envolto em folha de bananeira + atole de morango. MX$ 60 o combo." },
      { time: "09:30", period: "manha", title: "Centro Histórico + Templo Mayor", place: "Zócalo", why: "Ruínas astecas debaixo da catedral. Entrada MX$ 95. Depois suba no Torre Latino." },
      { time: "12:00", period: "manha", title: "Museu Frida Kahlo", place: "Casa Azul — Londres 247, Coyoacán", why: "Reserve online (MX$ 270). O ateliê e as roupas dela estão intactos." },
      { time: "14:00", period: "almoco", title: "Tacos al pastor", place: "El Huequito", where: "Ayuntamiento 21, Centro", why: "Trompo giratório desde 1959. Peça 4 com abacaxi + água de jamaica. MX$ 90." },
      { time: "16:30", period: "tarde", title: "Bosque de Chapultepec + Antropologia", place: "Av. Paseo de la Reforma", why: "Museu de Antropologia (MX$ 95) tem a Pedra do Sol asteca. 2h no salão mexica." },
      { time: "19:30", period: "jantar", title: "Cozinha mexicana contemporânea", place: "Contramar", where: "Calle Durango 200, Roma Norte", why: "Só almoço/jantar cedo (fecha 18h30) — vá pra Máximo Bistrot como alternativa noturna." },
      { time: "22:00", period: "noite", title: "Mezcalería", place: "La Clandestina", where: "Álvaro Obregón 298, Roma Norte", why: "Mezcais artesanais de 6 estados. Peça uma flight de 3 com laranja e sal de gusano." },
    ],
    curated: true,
  },
  DEU: {
    city: "Berlim",
    intro: "Currywurst, história, jantar no Kreuzberg e techno até o sol nascer.",
    stops: [
      { time: "09:00", period: "amanhecer", title: "Café e brötchen", place: "Father Carpenter", where: "Münzstraße 21, Mitte", why: "Torrefação australiana em pátio escondido. Peça o avocado toast + flat white." },
      { time: "10:30", period: "manha", title: "Ilha dos Museus — Pergamon/Neues", place: "Bodestraße 1-3", why: "Busto de Nefertiti no Neues (€14). Pergamon está parcialmente fechado até 2027." },
      { time: "13:00", period: "almoco", title: "Currywurst clássica", place: "Curry 36", where: "Mehringdamm 36, Kreuzberg", why: "24h aberto. Salsicha com molho de curry + fritas €6. Vai de pé no balcão." },
      { time: "14:30", period: "tarde", title: "East Side Gallery + Portão de Brandemburgo", place: "Mühlenstraße", why: "1,3 km do Muro pintado por 118 artistas. Depois metrô 5 min até o Portão." },
      { time: "17:00", period: "entardecer", title: "Memorial do Holocausto + Reichstag", place: "Cora-Berliner-Straße", why: "2.711 blocos de concreto. Suba na cúpula do Reichstag GRÁTIS (reserve online)." },
      { time: "19:30", period: "jantar", title: "Döner elevado", place: "Mustafas Gemüse Kebap", where: "Mehringdamm 32", why: "O döner mais famoso do mundo (30 min de fila justa). Alternativa: Rüyam Gemüse." },
      { time: "22:00", period: "noite", title: "Bar de coquetéis", place: "Buck and Breck", where: "Brunnenstraße 177", why: "10 lugares, coquetel único de champagne + cognac. €18. Toque a campainha." },
      { time: "01:00", period: "noite", title: "Techno em club histórico", place: "://about blank ou Sisyphos", why: "Berghain é loteria. Estes dois são igualmente lendários e recebem mais gente. Vá de preto." },
    ],
    curated: true,
  },
  AUS: {
    city: "Sydney",
    intro: "Café de terceira onda, praia, ferry pela baía e sunset em Manly.",
    stops: [
      { time: "07:30", period: "amanhecer", title: "Brunch australiano", place: "Bills — Surry Hills", where: "359 Crown St", why: "Os ricotta hotcakes com banana caramelizada. A$26. Bills inventou o gênero." },
      { time: "09:30", period: "manha", title: "Bondi to Coogee Coastal Walk", place: "Bondi Beach", why: "6 km de trilha à beira do penhasco, 2h. Passa por 5 praias e a piscina de Icebergs." },
      { time: "13:00", period: "almoco", title: "Fish & chips na praia", place: "North Bondi Fish", where: "120 Ramsgate Ave", why: "Barramundi grelhado com salada de manga. A$32 com vista pra praia." },
      { time: "15:00", period: "tarde", title: "Opera House + Royal Botanic Garden", place: "Bennelong Point", why: "Tour interno A$47 (1h). Ou apenas caminhe pelo Mrs Macquarie's Chair pra foto clássica." },
      { time: "17:00", period: "entardecer", title: "Ferry pra Manly", place: "Circular Quay Wharf 3", why: "30 min de travessia A$8,50. Vista da Opera + Harbour Bridge de graça." },
      { time: "19:30", period: "jantar", title: "Frutos do mar modernos", place: "Sean's Panaroma", where: "270 Campbell Parade, Bondi", why: "Chef Sean Moran, ingredientes da fazenda dele. Reserve. A$120 pp." },
      { time: "22:00", period: "noite", title: "Speakeasy em beco", place: "Bulletin Place", where: "10-14 Bulletin Pl", why: "Coquetéis sazonais com ingredientes locais. Menu muda diário. A$24." },
    ],
    curated: true,
  },
  CAN: {
    city: "Toronto",
    intro: "Peameal bacon no St. Lawrence, CN Tower, poutine e cerveja artesanal em Kensington.",
    stops: [
      { time: "08:30", period: "amanhecer", title: "Peameal bacon sandwich", place: "Carousel Bakery — St. Lawrence Market", where: "93 Front St E", why: "'Sanduíche de Toronto' há 40 anos. C$8,50. Anthony Bourdain fez fila aqui." },
      { time: "10:00", period: "manha", title: "CN Tower + EdgeWalk (se ousar)", place: "290 Bremner Blvd", why: "553 m. Vista básica C$43. EdgeWalk (caminhar pelo lado de fora) C$225." },
      { time: "13:00", period: "almoco", title: "Dim sum de Chinatown", place: "Rol San", where: "323 Spadina Ave", why: "Bandejas circulando desde 1979. Peça har gow, siu mai e panquecas de nabo." },
      { time: "15:00", period: "tarde", title: "Kensington Market", place: "Augusta Ave", why: "Bairro boêmio com lojas vintage, murais e cafés. Pare no Wanda's Pie in the Sky." },
      { time: "17:00", period: "entardecer", title: "Toronto Islands", place: "Jack Layton Ferry Terminal", why: "Balsa C$9 até Ward's Island. Praia + skyline dourado ao entardecer." },
      { time: "20:00", period: "jantar", title: "Poutine gourmet", place: "Poutini's House of Poutine", where: "1112 Queen St W", why: "Batata fresca, queijo em coalhada de Quebec, gravy vegetariano opcional. C$12." },
      { time: "22:30", period: "noite", title: "Cerveja artesanal", place: "Bellwoods Brewery", where: "124 Ossington Ave", why: "IPAs sazonais + hambúrguer. Pátio nos meses quentes." },
    ],
    curated: true,
  },
  CHN: {
    city: "Xangai",
    intro: "Xiaolongbao no Yu Garden, Bund ao pôr do sol, hot pot e coquetel na Cidade Nova.",
    stops: [
      { time: "08:00", period: "amanhecer", title: "Café da manhã de rua", place: "Jian bing na esquina + café na % Arabica", where: "Ferguson Lane, Concessão Francesa", why: "Panqueca chinesa recheada com ovo + café coado. ¥35 total." },
      { time: "10:00", period: "manha", title: "Yu Garden + Templo do Deus da Cidade", place: "Anren St, Huangpu", why: "Jardim de 400 anos. Entrada ¥45. Depois se perca no bazar labiríntico do lado." },
      { time: "12:30", period: "almoco", title: "Xiaolongbao originais", place: "Jia Jia Tang Bao", where: "90 Huanghe Rd", why: "Bolinho de sopa com carne de porco. ¥20 a dúzia. Prove a mordida — cuidado com o caldo." },
      { time: "14:30", period: "tarde", title: "Museu de Xangai", place: "People's Square", why: "Bronzes da dinastia Shang + porcelanas Ming. Grátis. 2h de visita." },
      { time: "17:30", period: "entardecer", title: "Bund + Pudong ao pôr do sol", place: "Zhongshan East 1st Rd", why: "Calçadão histórico olhando pros arranha-céus futuristas. Chegue às 17h pra pegar transição dia/noite." },
      { time: "20:00", period: "jantar", title: "Hot pot de Sichuan", place: "Haidilao Hot Pot", where: "Shopping IFC, Pudong", why: "Cadeia lendária pelo atendimento. Caldo apimentado + panda ravioli. ¥250 pp." },
      { time: "23:00", period: "noite", title: "Rooftop no Bund", place: "Bar Rouge", where: "Bund 18, 7º andar", why: "Cocktail com vista Pudong iluminado. ¥130 o drink, mas a vista paga." },
    ],
    curated: true,
  },
  IND: {
    city: "Nova Deli",
    intro: "Chai fumegante, forte mogol, thali em Chandni Chowk e curry sob luzes do bazar.",
    stops: [
      { time: "07:00", period: "amanhecer", title: "Chai + parathas", place: "Moolchand Parathe Wale", where: "Chandni Chowk", why: "Paratha recheada de banana ou queijo, frita no ghee. ₹40. Chai ao lado, ₹15." },
      { time: "09:00", period: "manha", title: "Forte Vermelho", place: "Netaji Subhash Marg", why: "Fortaleza mogol de arenito (1648). ₹600 estrangeiro. Chegue cedo antes do calor." },
      { time: "11:30", period: "manha", title: "Jama Masjid + rickshaw por Chandni Chowk", place: "Meena Bazaar", why: "Maior mesquita da Índia. Suba no minarete (₹100). Depois rickshaw ₹150 pelas ruelas." },
      { time: "13:30", period: "almoco", title: "Thali vegetariano completo", place: "Karim's", where: "Gali Kababian, Jama Masjid", why: "Desde 1913, receita dos cozinheiros do último imperador mogol. Peça mutton burra. ₹500." },
      { time: "16:00", period: "tarde", title: "Túmulo de Humayun + Lodhi Garden", place: "Mathura Rd", why: "Precursor do Taj Mahal (₹600). Lodhi Garden ao lado é grátis e lindo pro fim de tarde." },
      { time: "19:00", period: "entardecer", title: "Cerimônia no Templo de Lótus (Baháʼí)", place: "Bahapur, Kalkaji", why: "Silêncio absoluto sob a flor de 27 pétalas de mármore. Grátis." },
      { time: "21:00", period: "jantar", title: "Butter chicken original", place: "Moti Mahal", where: "3704 Netaji Subhash Marg, Daryaganj", why: "Restaurante que inventou o butter chicken em 1947. ₹650. Peça naan de alho." },
    ],
    curated: true,
  },
  THA: {
    city: "Bangcoc",
    intro: "Templo dourado, mercado flutuante, pad thai de barquinho e rooftop no Chao Phraya.",
    stops: [
      { time: "07:00", period: "amanhecer", title: "Café da manhã de rua", place: "Jok Prince — congee premiado", where: "Charoen Krung Rd, Bang Rak", why: "Mingau de arroz com porco e ovo. ฿60. Bib Gourmand do Michelin." },
      { time: "09:00", period: "manha", title: "Grande Palácio + Wat Phra Kaew", place: "Na Phra Lan Rd", why: "Buda de Esmeralda. ฿500. Cubra ombros e joelhos ou não entra. Chegue às 8h30." },
      { time: "12:00", period: "manha", title: "Wat Pho — Buda Reclinado", place: "2 Sanamchai Rd", why: "46 m de Buda deitado banhado em ouro. ฿300. Peça massagem tailandesa autêntica na escola do templo (฿480/h)." },
      { time: "13:30", period: "almoco", title: "Pad thai lendário", place: "Thipsamai", where: "313-315 Maha Chai Rd", why: "Desde 1966. Pad thai h'aw kai (envolto em omelete) + suco de laranja. ฿170." },
      { time: "15:30", period: "tarde", title: "Barco pelo Chao Phraya + Wat Arun", place: "Tha Tien Pier", why: "Ferry cruzando o rio ฿5. Suba na torre do Templo do Amanhecer (฿100)." },
      { time: "18:30", period: "entardecer", title: "Mercado noturno Asiatique", place: "Charoen Krung Rd", why: "1.500 lojas + roda gigante à beira do rio. Ferry grátis do Sathorn Pier." },
      { time: "20:30", period: "jantar", title: "Curry verde e som tam", place: "Krua Apsorn", where: "Dinso Rd, Phra Nakhon", why: "Cozinha real tailandesa. Peça o crab omelette (฿480) e curry verde de frango." },
      { time: "22:30", period: "noite", title: "Rooftop cinematográfico", place: "Sky Bar — Lebua State Tower", where: "1055 Silom Rd", why: "63º andar. Cenário do Hangover 2. Peça um Hangovertini (฿890). Dress code." },
    ],
    curated: true,
  },
  ARE: {
    city: "Dubai",
    intro: "Café árabe, deserto, souk das especiarias e vista do Burj Khalifa iluminado.",
    stops: [
      { time: "08:30", period: "amanhecer", title: "Café emirati", place: "Arabian Tea House", where: "Al Fahidi Historical Neighbourhood", why: "Pátio branco e azul. Peça chebab (panqueca), qahwa e tâmaras. AED 55." },
      { time: "10:00", period: "manha", title: "Bairro histórico Al Fahidi + Museu de Dubai", place: "Bur Dubai", why: "Casas de vento restauradas dos anos 1890. Museu AED 3. Cruze o Creek de abra por AED 1." },
      { time: "12:00", period: "manha", title: "Souk do Ouro + Souk das Especiarias", place: "Deira", why: "10 toneladas de ouro expostas. Negocie sem culpa: 30–40% do preço inicial." },
      { time: "13:30", period: "almoco", title: "Shawarma clássico", place: "Al Mallah", where: "Al Diyafah St, Satwa", why: "Shawarma de frango + suco de manga fresco. AED 25. Mesas na calçada, ar de Beirute." },
      { time: "15:30", period: "tarde", title: "Safári no deserto", place: "Dunas de Lahbab", why: "Reserve com Platinum Heritage (AED 550). Dune bashing, camelo, jantar beduíno." },
      { time: "20:00", period: "jantar", title: "Cozinha libanesa em tenda", place: "(incluso no safári) ou Al Nafoorah", where: "Jumeirah Emirates Towers", why: "Se pular o deserto: mezze completo + grelhados. AED 350 pp." },
      { time: "22:00", period: "noite", title: "Fontes do Burj Khalifa + subida", place: "Downtown Dubai", why: "Fontes dançantes a cada 30 min (grátis). Suba no 148º andar do Burj (AED 379)." },
    ],
    curated: true,
  },
  EGY: {
    city: "Cairo",
    intro: "Foul no café, pirâmides ao amanhecer, museu e chá de menta no Khan el-Khalili.",
    stops: [
      { time: "06:30", period: "amanhecer", title: "Pirâmides de Gizé — na abertura", place: "Al Haram, Giza", why: "Portão abre 7h. EGP 540. Vá antes das ondas de ônibus. Entre na Grande Pirâmide (+EGP 900)." },
      { time: "10:30", period: "manha", title: "Esfinge + Templo do Vale", place: "Complexo de Gizé", why: "Ficam no mesmo ticket. Foto clássica: a 200 m da esfinge, olhando pra oeste." },
      { time: "12:30", period: "almoco", title: "Koshari nacional", place: "Abou Tarek", where: "16 Champollion St, Downtown", why: "Massa + lentilha + grão-de-bico + molho picante. EGP 55. Prato nacional egípcio." },
      { time: "14:30", period: "tarde", title: "Grande Museu Egípcio (GEM)", place: "Rodovia El Remaya, Gizé", why: "Aberto desde 2024. Tesouro completo de Tutancâmon reunido pela 1ª vez. EGP 1.200." },
      { time: "18:00", period: "entardecer", title: "Cidadela de Saladino + Mesquita de Alabastro", place: "Salah Salem", why: "Vista de Cairo inteira do alto. EGP 450. Vá pouco antes do pôr do sol." },
      { time: "20:00", period: "jantar", title: "Grelhados no Khan el-Khalili", place: "Naguib Mahfouz Café", where: "5 Al-Badestan Lane", why: "Batizado com o Nobel de literatura. Kebab misto + arroz + salada. EGP 400." },
      { time: "22:00", period: "noite", title: "Shisha em café antigo", place: "El Fishawy", where: "Khan el-Khalili", why: "Aberto 24h desde 1797. Chá de menta + narguile de maçã. EGP 100." },
    ],
    curated: true,
  },
  ZAF: {
    city: "Cidade do Cabo",
    intro: "Padaria em Woodstock, Table Mountain, vinho em Constantia e jantar com vista do Signal Hill.",
    stops: [
      { time: "08:00", period: "amanhecer", title: "Padaria + café", place: "The Test Kitchen Fledgelings / Jason Bakery", where: "185 Bree St", why: "Cruffins, sourdough e flat white. R80. Fila justa aos sábados." },
      { time: "09:30", period: "manha", title: "Table Mountain — teleférico", place: "Tafelberg Rd", why: "Suba cedo (vento fecha depois). Ticket R420 ida e volta. Trilhas de 30 min a 2h no topo." },
      { time: "13:00", period: "almoco", title: "Almoço numa vinícola", place: "Groot Constantia", where: "Constantia", why: "Vinícola mais antiga da SA (1685). Menu de degustação + wine pairing R650." },
      { time: "15:30", period: "tarde", title: "Bo-Kaap + Distrito Six", place: "Wale St", why: "Bairro cabo-malaio com casas em cores vibrantes. Museu do District Six R60." },
      { time: "17:30", period: "entardecer", title: "V&A Waterfront + Two Oceans", place: "Dock Rd", why: "Aquário R290 (tubarões, foca). Sunset no Silo Rooftop com Table Mountain de fundo." },
      { time: "20:00", period: "jantar", title: "Cozinha sul-africana", place: "The Pot Luck Club", where: "The Old Biscuit Mill, Woodstock", why: "Chef Luke Dale-Roberts. 6 tapas + carne curada. R850. Reserve." },
      { time: "22:30", period: "noite", title: "Estrelas em Signal Hill", place: "Signal Hill Rd", why: "10 min de carro do centro. Menos vento que Table Mountain e vista 360°. Leve manta." },
    ],
    curated: true,
  },
  GRC: {
    city: "Atenas",
    intro: "Café frappe, Acrópole ao amanhecer, souvlaki e ouzo em Plaka sob as estrelas.",
    stops: [
      { time: "07:30", period: "amanhecer", title: "Bougatsa + café frappé", place: "Bougatsadiko I Thessaloniki", where: "Iroon Square, Psirri", why: "Massa filo com creme de sêmola. €3,50. Frappé shakerado na hora." },
      { time: "08:30", period: "manha", title: "Acrópole — na abertura", place: "Dionysiou Areopagitou", why: "Portão abre 8h. €30 (combo €40 inclui Ágora + Templo de Zeus). Suba antes do sol pesar." },
      { time: "11:00", period: "manha", title: "Museu da Acrópole", place: "Dionysiou Areopagitou 15", why: "Ao pé da colina. €15. As Cariátides originais estão aqui. Café do 2º andar com vista do Partenon." },
      { time: "13:30", period: "almoco", title: "Souvlaki no espeto", place: "Kostas Souvlaki", where: "Pentelis 5, Syntagma", why: "Pequeno buraco na parede desde 1950. Souvlaki de porco + molho de tomate + pita. €3." },
      { time: "15:30", period: "tarde", title: "Bairro de Anafiotika + Plaka", place: "Sob a Acrópole", why: "Vielas brancas como uma ilha das Cíclades no meio de Atenas. Grátis, se perca." },
      { time: "18:00", period: "entardecer", title: "Colina de Filopappos", place: "Filopappou Hill", why: "Melhor vista do Partenon iluminado ao pôr do sol. 15 min de subida. Grátis." },
      { time: "20:30", period: "jantar", title: "Mezze grego autêntico", place: "Ta Karamanlidika Tou Fani", where: "Sokratous 1, Psirri", why: "Charcutaria histórica. Peça tirokafteri, dolmadakia, souvlaki de cordeiro. €35 pp com vinho." },
      { time: "23:00", period: "noite", title: "Ouzo em ouzeri", place: "Brettos", where: "Kydathinaion 41, Plaka", why: "Destilaria mais antiga de Atenas (1909). Parede iluminada de garrafas coloridas. Ouzo €4." },
    ],
    curated: true,
  },
  TUR: {
    city: "Istambul",
    intro: "Simit no Bósforo, Santa Sofia, kebab e narguile com vista do Corno de Ouro.",
    stops: [
      { time: "07:30", period: "amanhecer", title: "Café turco + simit", place: "Karaköy Güllüoğlu / Van Kahvaltı Evi", where: "Cihangir", why: "Café da manhã turco completo: queijos, azeitonas, ovos, mel com kaymak. ₺350." },
      { time: "09:30", period: "manha", title: "Santa Sofia + Mesquita Azul", place: "Sultanahmet Square", why: "Hagia Sofia €25 (agora mesquita, gratuito no térreo). Mesquita Azul grátis. Cubra cabeça." },
      { time: "12:00", period: "manha", title: "Palácio Topkapı + Harém", place: "Cankurtaran", why: "Residência dos sultões otomanos por 400 anos. ₺1.500 com harém. 3h mínimo." },
      { time: "14:00", period: "almoco", title: "Balık ekmek à beira do Bósforo", place: "Sob a ponte de Gálata — Eminönü", why: "Sanduíche de cavala grelhada na hora nos barcos. ₺150. Só apontar." },
      { time: "15:30", period: "tarde", title: "Grande Bazar + Bazar das Especiarias", place: "Beyazıt", why: "4.000 lojas cobertas desde 1461. Negocie a metade do preço. Café turco no Şark Kahvesi." },
      { time: "17:30", period: "entardecer", title: "Barco pelo Bósforo", place: "Eminönü Pier", why: "Ferry público até Anadolu Kavağı. ₺60. Passa por palácios, mansões e a Ásia." },
      { time: "20:00", period: "jantar", title: "Kebab de Adana", place: "Zübeyir Ocakbaşı", where: "Bekar Sk 28, Beyoğlu", why: "Grelha aberta na sua frente. Peça kebab de cordeiro + lahmacun + ayran. ₺500." },
      { time: "22:30", period: "noite", title: "Narguile no telhado", place: "5. Kat", where: "Soğancı Sk 3, Cihangir", why: "Terraço rosa-choque com vista de 180° do Bósforo. Cocktail ₺280." },
    ],
    curated: true,
  },
  NLD: {
    city: "Amsterdã",
    intro: "Stroopwafel, Van Gogh, bicicleta pelos canais e brown café até tarde.",
    stops: [
      { time: "08:30", period: "amanhecer", title: "Stroopwafel + café", place: "Winkel 43", where: "Noordermarkt 43", why: "Torta de maçã lendária (€5,50) e stroopwafel quente na feira." },
      { time: "10:00", period: "manha", title: "Museu Van Gogh", place: "Museumplein 6", why: "Maior coleção do mundo. €22, reserve online com hora. 2h30 de visita." },
      { time: "13:00", period: "almoco", title: "Broodje haring", place: "Stubbe's Haring", where: "Haarlemmersluis", why: "Arenque cru curado com cebola e picles no pãozinho. €5. Só pra bravos." },
      { time: "14:30", period: "tarde", title: "Bicicleta pelos canais", place: "MacBike — Central Station", why: "Aluguel €15/dia. Faça o circuito Jordaan → 9 Streets → Vondelpark. 3h." },
      { time: "17:30", period: "entardecer", title: "Genever tasting", place: "Wynand Fockink", where: "Pijlsteeg 31 (atrás do Dam)", why: "Destilaria de 1679. Prove o genever direto do balcão, curvado sobre a taça." },
      { time: "20:00", period: "jantar", title: "Indonésio rijsttafel", place: "Sampurna", where: "Singel 498", why: "'Mesa de arroz' — 15 pratinhos de curry, satay e sambal. €38 pp." },
      { time: "22:30", period: "noite", title: "Brown café tradicional", place: "Café 't Smalle", where: "Egelantiersgracht 12, Jordaan", why: "Desde 1786. Cerveja Wieckse Witte ao lado do canal, luz âmbar. €4,50." },
    ],
    curated: true,
  },
  CHE: {
    city: "Zurique",
    intro: "Café suíço, lago, chocolate, fondue e cocktail em antigo cofre bancário.",
    stops: [
      { time: "08:30", period: "amanhecer", title: "Café + Gipfeli", place: "Miyuko Café", where: "Zähringerstrasse 43", why: "Croissant suíço amanteigado + café de origem. CHF 12. Interior calmo e minimalista." },
      { time: "10:00", period: "manha", title: "Cidade velha + Grossmünster", place: "Grossmünsterplatz", why: "Igreja românica do séc. XII. Suba na torre (CHF 5) pra vista do lago. Depois passe na Fraumünster (vitrais de Chagall)." },
      { time: "12:30", period: "almoco", title: "Zürcher Geschnetzeltes", place: "Zeughauskeller", where: "Bahnhofstrasse 28a", why: "Prato típico: vitela cremosa com rösti. CHF 34. Cervejaria em antigo arsenal." },
      { time: "14:30", period: "tarde", title: "Kunsthaus Zürich", place: "Heimplatz 1", why: "Maior coleção de Giacometti do mundo + Munch, Monet. CHF 24." },
      { time: "16:30", period: "tarde", title: "Passeio pelo Lago Zurique", place: "Bürkliplatz", why: "Barco de 1h30 pelas margens (CHF 8,80 com Zürich Card). Ou nade em Seebad Enge no verão." },
      { time: "18:00", period: "entardecer", title: "Chocolate — degustação", place: "Sprüngli — Paradeplatz", why: "Luxemburgerli (macarons suíços). CHF 15 a caixinha. Suba pro café do 1º andar." },
      { time: "20:00", period: "jantar", title: "Fondue clássico", place: "Le Dézaley", where: "Römergasse 7", why: "Fondue moitié-moitié (Gruyère + Vacherin) com pão e batatas. CHF 45 pp." },
      { time: "22:30", period: "noite", title: "Coquetel em cofre bancário", place: "Widder Bar", where: "Widdergasse 6", why: "1.000 whiskies + piano jazz. Um dos melhores bares da Europa. CHF 22 o drink." },
    ],
    curated: true,
  },
  KOR: {
    city: "Seul",
    intro: "Café de dessert, palácio real, mercado à noite e karaokê às 3 da manhã.",
    stops: [
      { time: "08:30", period: "amanhecer", title: "Café da manhã coreano", place: "Osegye Hyang", where: "Insadong", why: "Restaurante vegetariano em templo. Bibimbap vegano + sopa de miso + banchan. ₩12.000." },
      { time: "10:00", period: "manha", title: "Palácio Gyeongbokgung", place: "161 Sajik-ro", why: "Cerimônia da troca da guarda 10h e 14h. ₩3.000. Alugue hanbok (₩15.000) — entrada vira grátis." },
      { time: "12:30", period: "almoco", title: "Kalguksu em beco", place: "Myeongdong Kyoja", where: "29 Myeongdong 10-gil", why: "Massa cortada à mão em caldo de frango + mandu. ₩11.000. Fila de 15 min vale." },
      { time: "14:30", period: "tarde", title: "Bukchon Hanok Village + Insadong", place: "Bukchon-ro 11-gil", why: "900 casas tradicionais entre palácios. Grátis. Depois compre chá verde e cerâmica em Insadong." },
      { time: "17:00", period: "entardecer", title: "Torre N Seul + Cadeados do Amor", place: "Namsan Park", why: "Suba pelo teleférico (₩14.000). Cidade inteira em 360°. Ao anoitecer, luzes acendem." },
      { time: "20:00", period: "jantar", title: "Korean BBQ premium", place: "Gwangjang Market — tenda de gogigui + noraebang depois", where: "88 Changgyeonggung-ro", why: "Mercado noturno com bindaetteok (panqueca de feijão-mungo) e mayak gimbap. ₩25.000 pp." },
      { time: "22:30", period: "noite", title: "Chimaek — frango frito + cerveja", place: "Kyochon Chicken — Hongdae", why: "Ritual coreano. Frango honey + cerveja Cass. ₩30.000 pra dois." },
      { time: "00:30", period: "noite", title: "Noraebang (karaokê privê)", place: "Su Noraebang — Hongdae", why: "Cabine privê, ₩10.000/hora. Catálogo em português. Grita sem vergonha." },
    ],
    curated: true,
  },
  MAR: {
    city: "Marraquexe",
    intro: "Chá de menta, souks, tagine com vista da Koutoubia e acrobatas na Jemaa el-Fna.",
    stops: [
      { time: "08:00", period: "amanhecer", title: "Café marroquino em riad", place: "Café des Épices", where: "75 Rahba Lakdima, Medina", why: "Terraço sobre o souk das especiarias. Msemen + chá de menta + laranja fresca. 80 MAD." },
      { time: "09:30", period: "manha", title: "Jardim Majorelle + Museu YSL", place: "Rue Yves Saint Laurent, Guéliz", why: "Jardim azul-cobalto de 1923 restaurado por YSL. Combo 240 MAD. Chegue 9h pra evitar fila." },
      { time: "12:00", period: "manha", title: "Palácio Bahia + Túmulos Saadianos", place: "Kasbah", why: "Estuques e mosaicos de tirar o fôlego. 100 MAD cada. 2h no total." },
      { time: "13:30", period: "almoco", title: "Tagine no telhado", place: "Nomad", where: "1 Derb Aarjane, Rahba Lakdima", why: "Cozinha marroquina moderna. Tagine de cordeiro com ameixa. 180 MAD. Reserve terraço." },
      { time: "15:30", period: "tarde", title: "Perder-se nos souks", place: "Souk Semmarine → Souk el-Attarine", why: "Grátis. Compre tapetes, babuchas e argan negociando pra 40% do preço inicial." },
      { time: "18:00", period: "entardecer", title: "Koutoubia ao pôr do sol", place: "Avenue Mohammed V", why: "Minarete de 77 m (séc. XII). Não entra, mas sente na praça em frente ao chamado da oração." },
      { time: "19:30", period: "jantar", title: "Espetáculo na Jemaa el-Fna", place: "Praça central da Medina", why: "40 barracas de comida à luz de lampiões. Peça sopa harira + espetinhos. 100 MAD pp." },
      { time: "22:00", period: "noite", title: "Hammam tradicional", place: "Hammam de la Rose", where: "130 Dar el Bacha", why: "Ritual completo: vapor + esfoliação + óleo de argan. 350 MAD, 90 min. Pra dormir bem." },
    ],
    curated: true,
  },
  ISL: {
    city: "Reikiavik",
    intro: "Cinnamon bun, cachoeira, hot dog nacional e aurora boreal (ou sol da meia-noite).",
    stops: [
      { time: "09:00", period: "amanhecer", title: "Café + snúður", place: "Brauð & Co", where: "Frakkastígur 16", why: "Cinnamon bun islandês (snúður) + café. ISK 900. Padaria arco-íris ao lado da Hallgrímskirkja." },
      { time: "10:00", period: "manha", title: "Hallgrímskirkja + estátua Leif Erikson", place: "Skólavörðuholt", why: "Igreja de basalto de 74 m. Suba na torre (ISK 1.400) pra ver Reykjavík em cores pastel." },
      { time: "11:30", period: "manha", title: "Golden Circle — Þingvellir", place: "1h de carro", why: "Parque nacional onde placas tectônicas se separam. Grátis. Estacionamento ISK 1.000." },
      { time: "13:30", period: "almoco", title: "Sopa de cordeiro islandesa", place: "Efstidalur II Farm", where: "Golden Circle route", why: "Fazenda com sorvete próprio. Sopa kjötsúpa + pão de centeio ISK 2.500." },
      { time: "14:30", period: "tarde", title: "Geysir + Gullfoss", place: "Golden Circle", why: "Gêiser Strokkur jorra a cada 8 min. Gullfoss é a 'cachoeira dourada' de 32 m em dois níveis. Grátis." },
      { time: "18:00", period: "entardecer", title: "Piscina geotérmica", place: "Sky Lagoon", where: "Kópavogur", why: "Ritual de 7 etapas com sauna, banho frio, óleo corporal. ISK 12.990. Alternativa mais chique ao Blue Lagoon." },
      { time: "20:30", period: "jantar", title: "Frutos do mar nórdicos", place: "Matur og Drykkur", where: "Grandagarður 2", why: "Bacalhau salgado + skyr. ISK 6.900. Reserve." },
      { time: "22:00", period: "noite", title: "Hot dog do Bill Clinton", place: "Bæjarins Beztu Pylsur", where: "Tryggvagata 1", why: "Barraca desde 1937. Peça 'ein með öllu' (com tudo): mostarda doce, cebola crocante. ISK 750." },
      { time: "23:30", period: "noite", title: "Caçar a aurora (set–abr) / passeio sol da meia-noite (mai–jul)", place: "Grótta Lighthouse", why: "Farol na ponta da península. Sem poluição luminosa. App Aurora Forecast pra checar KP." },
    ],
    curated: true,
  },
};

// Fallback genérico — usa capital do próprio país.
export function generateFallback(country: Country): Itinerary {
  const capital = country.capital?.[0] ?? "capital";
  const isCoastal = (country.latlng?.[1] ?? 0) !== 0;
  return {
    city: capital,
    intro: `Um roteiro de 24 horas sugerido para ${capital}, cobrindo o essencial: cultura, gastronomia local e o ritual noturno da cidade.`,
    stops: [
      { time: "08:00", period: "amanhecer", title: "Café da manhã local", place: `Padaria/café tradicional no centro de ${capital}`, why: "Comece com o que os moradores comem — peça o item mais vendido do balcão." },
      { time: "10:00", period: "manha", title: "Marco histórico principal", place: `Principal monumento ou praça central de ${capital}`, why: "Todo lugar tem seu ponto zero. Chegue cedo antes das excursões." },
      { time: "12:30", period: "almoco", title: "Almoço tradicional", place: `Restaurante familiar recomendado por locais em ${capital}`, why: "Peça o prato nacional — é onde a identidade da cozinha se revela." },
      { time: "15:00", period: "tarde", title: "Museu ou bairro cultural", place: `Museu nacional ou bairro histórico de ${capital}`, why: "2 horas bastam pra entender a alma do lugar." },
      { time: "17:30", period: "entardecer", title: "Mirante ou orla ao pôr do sol", place: isCoastal ? "Orla / calçadão" : "Mirante mais alto da cidade", why: "A hora dourada muda tudo — encontre o melhor ângulo." },
      { time: "20:00", period: "jantar", title: "Jantar típico", place: `Casa noturna com comida regional em ${capital}`, why: "Coma devagar. Aqui a comida é conversa." },
      { time: "22:30", period: "noite", title: "Vida noturna autêntica", place: `Bairro boêmio de ${capital}`, why: "Bar de bairro, música ao vivo se possível. Onde os moradores relaxam depois do trabalho." },
    ],
    curated: false,
  };
}

export function getItinerary(country: Country): Itinerary {
  return CURATED[country.cca3] ?? generateFallback(country);
}

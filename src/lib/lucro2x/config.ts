// ============================================================================
// CONFIGURAÇÃO CENTRAL DA OFERTA — página /lucro2x
// ============================================================================
// Edite SOMENTE este arquivo pra ajustar preço, prazo, bônus, garantia,
// entregáveis e links. Nenhum componente em src/components/lucro2x/ tem
// preço, prazo ou valor "hardcoded" — todos leem daqui, então uma mudança
// de condição comercial vira uma mudança de uma linha, não de vários
// arquivos.
//
// Campos com valor `null` ou texto entre colchetes ("[...]") ainda não têm
// informação oficial confirmada. A página foi construída pra lidar bem com
// isso: em vez de inventar número/prazo/depoimento, ela esconde o bloco
// (ex.: contador de prazo) ou mostra o texto placeholder de forma visível
// só pra quem está editando — nunca cria urgência ou prova social falsa.
// ============================================================================

export const eventInfo = {
  liveDateISO: "2026-08-11T20:00:00-03:00", // 11/ago, 20h (horário de Brasília)
  liveLabel: "11 de agosto, às 20h",
};

export const programInfo = {
  // Nome oficial do programa ainda não definido — troque aqui assim que
  // confirmado e ele se propaga pra página inteira (hero, oferta, footer…).
  name: "[NOME DO PROGRAMA]",
  tagline: "Estrutura para transformar lucro empresarial em patrimônio",
  checkoutName: "[NOME DO PROGRAMA]", // nome exibido no resumo de checkout
};

export const pricing = {
  // Preço planejado — ainda NÃO 100% confirmado (ver contexto do briefing).
  fullPriceCents: 49990, // R$ 499,90
  // Preço de referência anterior, se existir (pra ancoragem). Deixe `null`
  // enquanto não houver preço oficial anterior confirmado — a seção de
  // ancoragem se adapta sozinha e não inventa um valor "de/por".
  anchorPriceCents: null as number | null,
  installments: {
    count: 12,
    // Se `null`, o valor da parcela é calculado automaticamente
    // (preço cheio ÷ count). Defina um valor fixo aqui se a condição real
    // tiver juro/taxa de parcelamento diferente da divisão simples.
    valueCentsOverride: null as number | null,
  },
};

export const offerWindow = {
  // Prazo real da condição especial (ISO 8601, com timezone). Enquanto for
  // `null`, a página NÃO mostra contador regressivo nem "restam X vagas" —
  // só o texto genérico de "condição exclusiva deste lançamento", pra nunca
  // simular urgência que não existe.
  deadlineISO: null as string | null, // ex.: "2026-08-14T23:59:59-03:00"
  seatsLimit: null as number | null, // ex.: 150 — só preencher se for limite real
};

export const guarantee = {
  // [POLÍTICA DE GARANTIA OFICIAL] — dias e regra da garantia. Enquanto
  // `days` for null, a seção de garantia mostra o texto genérico "política
  // de garantia a confirmar" em vez de inventar 7/15/30 dias.
  days: null as number | null,
  rule: null as string | null, // ex.: "reembolso integral, sem perguntas"
};

export const checkout = {
  // [LINK DO CHECKOUT OFICIAL]
  url: "#checkout-a-confirmar",
};

export const tracking = {
  // [PIXEL_ID] / [GA_ID] — enquanto null, nenhum script de rastreamento é
  // injetado na página (ver head() em src/routes/lucro2x.tsx).
  metaPixelId: null as string | null,
  googleAnalyticsId: null as string | null,
};

export const utm = {
  // Usado só pra preservar UTM de entrada (do link do grupo) até o clique
  // no CTA — não substitui o pixel, é redundância pra análise de funil.
  paramsToForward: ["utm_source", "utm_medium", "utm_campaign", "utm_content"],
};

export type Deliverable = {
  name: string;
  what: string;
  whyItMatters: string;
  transformation: string;
};

// "O que você recebe" — 5 posições, todas placeholder. Preencher com os
// entregáveis reais confirmados (não inventar módulo/formato).
export const deliverables: Deliverable[] = [
  {
    name: "[ENTREGA 1]",
    what: "[DETALHAR CONTEÚDO OFICIAL]",
    whyItMatters: "[DETALHAR CONTEÚDO OFICIAL]",
    transformation: "[DETALHAR CONTEÚDO OFICIAL]",
  },
  {
    name: "[ENTREGA 2]",
    what: "[DETALHAR CONTEÚDO OFICIAL]",
    whyItMatters: "[DETALHAR CONTEÚDO OFICIAL]",
    transformation: "[DETALHAR CONTEÚDO OFICIAL]",
  },
  {
    name: "[ENTREGA 3]",
    what: "[DETALHAR CONTEÚDO OFICIAL]",
    whyItMatters: "[DETALHAR CONTEÚDO OFICIAL]",
    transformation: "[DETALHAR CONTEÚDO OFICIAL]",
  },
  {
    name: "[ENTREGA 4]",
    what: "[DETALHAR CONTEÚDO OFICIAL]",
    whyItMatters: "[DETALHAR CONTEÚDO OFICIAL]",
    transformation: "[DETALHAR CONTEÚDO OFICIAL]",
  },
  {
    name: "[ENTREGA 5]",
    what: "[DETALHAR CONTEÚDO OFICIAL]",
    whyItMatters: "[DETALHAR CONTEÚDO OFICIAL]",
    transformation: "[DETALHAR CONTEÚDO OFICIAL]",
  },
];

export type Bonus = {
  name: string;
  perceivedValueCents: number | null;
};

// Bônus — não preencher com valor artificial só pra inflar percepção de
// preço. Deixe `perceivedValueCents: null` até ter um valor real e
// defensável (a seção some o "R$" e mostra só o nome nesse caso).
export const bonuses: Bonus[] = [
  { name: "[BÔNUS #1 — NOME]", perceivedValueCents: null },
  { name: "[BÔNUS #2 — NOME]", perceivedValueCents: null },
  { name: "[BÔNUS #3 — NOME]", perceivedValueCents: null },
];

export type Pillar = {
  number: string;
  name: string;
  problem: string;
  principle: string;
  whatIsWorked: string;
  benefit: string;
};

// Os 4 pilares vêm confirmados do briefing oficial do evento. O que muda
// por pilar é só "o que será trabalhado" — isso ainda não tem grade
// definida, então fica como placeholder até a equipe de conteúdo confirmar.
export const pillars: Pillar[] = [
  {
    number: "01",
    name: "Geração de receita",
    problem:
      "Faturar mais e crescer de verdade nem sempre são a mesma coisa — receita nova pode custar caro demais pra ser gerada, e o lucro não acompanha o crescimento.",
    principle:
      "Receita saudável é a que se sustenta sem depender de desconto, urgência ou esforço constante do dono.",
    whatIsWorked: "[DETALHAR CONTEÚDO OFICIAL]",
    benefit: "Mais clareza sobre de onde a receita realmente vem — e onde está sendo desperdiçada.",
  },
  {
    number: "02",
    name: "Melhoria de eficiência operacional",
    problem:
      "Crescer sem revisar processo costuma aumentar a complexidade mais rápido do que o resultado — a operação fica pesada, lenta e cara de sustentar.",
    principle: "Eficiência não é fazer mais rápido. É remover o que não deveria estar no processo.",
    whatIsWorked: "[DETALHAR CONTEÚDO OFICIAL]",
    benefit: "Uma operação que sustenta o crescimento, em vez de travar nele.",
  },
  {
    number: "03",
    name: "Otimização de custos",
    problem:
      "Boa parte da margem que deveria sobrar se perde em custos que ninguém revisita — porque sempre estiveram lá.",
    principle: "Custo bom é o que gera retorno mensurável. O resto é vazamento de margem.",
    whatIsWorked: "[DETALHAR CONTEÚDO OFICIAL]",
    benefit: "Mais margem sem depender só de vender mais.",
  },
  {
    number: "04",
    name: "Criação de cultura",
    problem:
      "Empresas que crescem sem cultura clara dependem demais do dono pra tudo funcionar — e isso tem teto.",
    principle: "Cultura é o que faz a empresa decidir bem quando o dono não está olhando.",
    whatIsWorked: "[DETALHAR CONTEÚDO OFICIAL]",
    benefit: "Um time que executa a visão sem precisar ser lembrado dela toda semana.",
  },
];

export type FaqItem = { question: string; answer: string };

export const faq: FaqItem[] = [
  {
    question: "Para quem é o programa?",
    answer:
      "Para empresários e empreendedores que já têm uma empresa em operação e querem estruturar melhor a relação entre lucro do negócio e patrimônio pessoal.",
  },
  {
    question: "Para quem não é?",
    answer:
      "Não foi desenhado como introdução ao empreendedorismo para quem ainda não tem empresa nem faturamento — o conteúdo parte do princípio de que já existe uma operação rodando.",
  },
  {
    question: "Preciso ter uma empresa?",
    answer:
      "Sim. O programa trabalha decisões sobre uma operação já existente, não a criação de uma do zero.",
  },
  {
    question: "Preciso já ter faturamento?",
    answer:
      "Sim, o conteúdo é construído em cima de uma empresa que já fatura e já toma decisões reais de gestão, custo e alocação de lucro.",
  },
  {
    question: "Como funciona o acesso?",
    answer: "[DETALHAR CONTEÚDO OFICIAL]",
  },
  {
    question: "Quando recebo acesso?",
    answer: "[DETALHAR CONTEÚDO OFICIAL]",
  },
  {
    question: "Existe acompanhamento?",
    answer: "[DETALHAR CONTEÚDO OFICIAL]",
  },
  {
    question: "Quanto tempo dura?",
    answer: "[DETALHAR CONTEÚDO OFICIAL]",
  },
  {
    question: "Existe garantia?",
    answer: "[POLÍTICA DE GARANTIA OFICIAL]",
  },
  {
    question: "Posso parcelar?",
    answer: "[DETALHAR CONTEÚDO OFICIAL — condição de parcelamento]",
  },
  {
    question: "Existe suporte?",
    answer: "[DETALHAR CONTEÚDO OFICIAL]",
  },
  {
    question: "O que está incluso?",
    answer: 'Veja a lista completa na seção "O que você recebe", acima nesta página.',
  },
  {
    question: "O que não está incluso?",
    answer: "[DETALHAR CONTEÚDO OFICIAL]",
  },
];

export type Objection = { objection: string; response: string };

export const objections: Objection[] = [
  {
    objection: "Será que isso é para mim?",
    response:
      "Se você já toma decisões de gestão, custo e crescimento na sua empresa — e sente que essas decisões poderiam ser mais estruturadas — o conteúdo foi pensado exatamente pra esse momento.",
  },
  {
    objection: "Já consumo muito conteúdo sobre negócios.",
    response:
      "O objetivo aqui não é aumentar sua quantidade de informação, e sim organizar a aplicação — transformar o que você já sabe em uma estrutura de decisão que você de fato usa na empresa.",
  },
  {
    objection: "É muito investimento?",
    response:
      "Compare com o custo de continuar tomando decisões de lucro e patrimônio sem uma estrutura clara para isso — esse é o cálculo que importa, não o valor isolado.",
  },
  {
    objection: "E se eu não conseguir aplicar?",
    response: "[DETALHAR CONTEÚDO OFICIAL — processo de suporte/acompanhamento, se existir]",
  },
];

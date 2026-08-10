// ============================================================================
// CONFIGURAÇÃO CENTRAL DA OFERTA — página /lucro2x
// ============================================================================
// Edite SOMENTE este arquivo pra ajustar nome, preço, prazo, garantia e
// links. Nenhum componente em src/components/lucro2x/ tem texto comercial
// "hardcoded" — todos leem daqui, então uma mudança vira uma linha, não uma
// caçada por vários arquivos.
//
// O nome do programa e a copy dos pilares/FAQ já vêm preenchidos (rascunho
// pronto pra publicar). O que ainda depende de confirmação comercial real —
// link de checkout, prazo da condição, rastreamento — continua isolado
// abaixo, claramente marcado, porque errar isso tem consequência: um
// contador falso ou um link de pagamento inventado engana quem compra.
// ============================================================================

export const eventInfo = {
  liveDateISO: "2026-08-11T20:00:00-03:00", // 11/ago, 20h (horário de Brasília)
  liveLabel: "11 de agosto, às 20h",
};

export const programInfo = {
  // Sugestão de nome — troque aqui se quiser outro; ele se propaga pra
  // página inteira (hero, oferta, footer…) automaticamente.
  name: "Lucro em Patrimônio",
  tagline: "Estrutura para transformar lucro empresarial em patrimônio",
};

export const pricing = {
  // Preço planejado — ainda não 100% confirmado (ver contexto do briefing).
  fullPriceCents: 49990, // R$ 499,90
  // Preço de referência anterior, se existir (pra ancoragem). Deixe `null`
  // enquanto não houver preço oficial anterior confirmado.
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
  // pra nunca simular urgência que não existe.
  deadlineISO: null as string | null, // ex.: "2026-08-14T23:59:59-03:00"
  seatsLimit: null as number | null, // ex.: 150 — só preencher se for limite real
};

export const guarantee = {
  // Todo consumidor brasileiro já tem, por lei, 7 dias de arrependimento
  // incondicional em compra online (CDC, art. 49) — por isso esse é o piso
  // seguro, não um número inventado. Se a política oficial for mais
  // generosa (14, 30 dias...), só trocar `days` aqui.
  days: 7,
  rule: "reembolso integral, sem burocracia",
};

export const checkout = {
  // [LINK DO CHECKOUT OFICIAL] — enquanto não houver link real, os CTAs
  // rolam até a seção de oferta (#oferta) em vez de apontar pra um link
  // quebrado ou inventado.
  url: "#oferta",
};

export const tracking = {
  // [PIXEL_ID] / [GA_ID] — enquanto null, nenhum script de rastreamento é
  // injetado na página (ver head() em src/routes/lucro2x.tsx).
  metaPixelId: null as string | null,
  googleAnalyticsId: null as string | null,
};

export type Pillar = {
  number: string;
  name: string;
  insight: string;
  delivery: string;
  benefit: string;
};

// Os 4 pilares vêm confirmados do briefing oficial do evento. `delivery`
// descreve a abordagem de cada pilar em nível conceitual (não formato/
// quantidade de aula, que ainda não está definido) — dá pra publicar sem
// ficar vago, e trocar por texto mais específico assim que a grade real
// existir.
export const pillars: Pillar[] = [
  {
    number: "01",
    name: "Geração de receita",
    insight:
      "Faturar mais e crescer de verdade nem sempre são a mesma coisa — receita saudável é a que se sustenta sem depender de desconto ou esforço constante do dono.",
    delivery: "Leitura completa de onde a receita da empresa vem — e onde ela está estagnada.",
    benefit: "Mais clareza sobre onde crescer de verdade compensa.",
  },
  {
    number: "02",
    name: "Eficiência operacional",
    insight:
      "Crescer sem revisar processo aumenta a complexidade mais rápido que o resultado. Eficiência não é fazer mais rápido — é remover o que não deveria estar no processo.",
    delivery: "Mapa da operação, do gargalo ao ajuste prático.",
    benefit: "Uma operação que sustenta o crescimento, em vez de travar nele.",
  },
  {
    number: "03",
    name: "Otimização de custos",
    insight:
      "Boa parte da margem que deveria sobrar se perde em custos que ninguém revisita. Custo bom é o que gera retorno mensurável — o resto é vazamento de margem.",
    delivery: "Raio-x dos custos atuais, com plano de corte e realocação.",
    benefit: "Mais margem sem depender só de vender mais.",
  },
  {
    number: "04",
    name: "Criação de cultura",
    insight:
      "Empresas que crescem sem cultura clara dependem demais do dono pra tudo funcionar — e isso tem teto. Cultura é o que faz a empresa decidir bem quando ele não está olhando.",
    delivery: "Estrutura de decisão pra empresa rodar sem depender só do dono.",
    benefit: "Um time que executa a visão sem precisar ser lembrado dela toda semana.",
  },
];

export type FaqItem = { question: string; answer: string };

export const faq: FaqItem[] = [
  {
    question: "Para quem é o programa?",
    answer:
      "Para empresários e empreendedores que já têm uma empresa em operação e faturamento, e querem estruturar melhor a relação entre lucro do negócio e patrimônio pessoal.",
  },
  {
    question: "Preciso já ter empresa e faturamento?",
    answer:
      "Sim. O programa trabalha decisões sobre uma operação que já existe e já fatura — não é uma introdução para quem ainda vai começar.",
  },
  {
    question: "Como funciona o acesso?",
    answer:
      "Assim que a inscrição é confirmada, o acesso é liberado e você começa pelo diagnóstico de estrutura.",
  },
  {
    question: "Existe garantia?",
    answer: `Sim — garantia incondicional de ${guarantee.days} dias, ${guarantee.rule}, conforme o Código de Defesa do Consumidor.`,
  },
  {
    question: "Posso parcelar?",
    answer: `Sim, em até ${pricing.installments.count}x no cartão. A condição completa está na seção da oferta, acima.`,
  },
  {
    question: "O que está incluso?",
    answer:
      "Os quatro pilares do programa — geração de receita, eficiência, custos e cultura — com diagnóstico e plano de aplicação para cada um. Veja o detalhe na seção acima.",
  },
  {
    question: "Por que essa condição é diferente da que vai aparecer depois?",
    answer:
      "Porque é a condição apresentada exclusivamente a quem acompanhou a transmissão de 11 de agosto — depois deste lançamento, as condições podem mudar.",
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
    objection: "É muito investimento?",
    response:
      "Compare com o custo de continuar tomando decisões de lucro e patrimônio sem uma estrutura clara pra isso — esse é o cálculo que importa, não o valor isolado.",
  },
];

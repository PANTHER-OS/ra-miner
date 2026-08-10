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
  fullPriceCents: 35990, // R$ 359,90 — preço definitivo
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
  takeaway: string;
};

// Os 4 pilares vêm confirmados do briefing oficial do evento. `takeaway`
// junta abordagem + benefício numa linha só (nível conceitual, não formato/
// quantidade de aula, que ainda não está definido) — publicável sem ficar
// vago, e fácil de trocar por texto mais específico quando a grade existir.
export const pillars: Pillar[] = [
  {
    number: "01",
    name: "Geração de receita",
    insight:
      "Faturar mais e crescer de verdade nem sempre são a mesma coisa — receita saudável é a que se sustenta sem depender de desconto ou esforço constante do dono.",
    takeaway: "Leitura completa de onde a receita vem e onde crescer de verdade compensa.",
  },
  {
    number: "02",
    name: "Eficiência operacional",
    insight:
      "Crescer sem revisar processo aumenta a complexidade mais rápido que o resultado. Eficiência é remover o que não deveria estar no processo.",
    takeaway: "Mapa da operação, do gargalo ao ajuste prático — pra crescer sem travar.",
  },
  {
    number: "03",
    name: "Otimização de custos",
    insight:
      "Boa parte da margem que deveria sobrar se perde em custos que ninguém revisita. Custo bom é o que gera retorno mensurável.",
    takeaway: "Raio-x dos custos atuais, com plano de corte e realocação de margem.",
  },
  {
    number: "04",
    name: "Criação de cultura",
    insight:
      "Empresas que crescem sem cultura clara dependem demais do dono pra tudo funcionar — e isso tem teto.",
    takeaway: "Estrutura de decisão pra empresa rodar sem depender só do dono.",
  },
];

export type FaqItem = { question: string; answer: string };

export const faq: FaqItem[] = [
  {
    question: "Para quem é o programa?",
    answer:
      "Para empresários que já têm empresa em operação e faturamento, e querem estruturar melhor a relação entre lucro do negócio e patrimônio pessoal.",
  },
  {
    question: "Como funciona o acesso e a garantia?",
    answer: `Assim que a inscrição é confirmada, o acesso é liberado. E você tem ${guarantee.days} dias de garantia incondicional (${guarantee.rule}), conforme o Código de Defesa do Consumidor.`,
  },
  {
    question: "Posso parcelar?",
    answer: `Sim, em até ${pricing.installments.count}x no cartão — condição completa na seção da oferta, acima.`,
  },
  {
    question: "O que está incluso?",
    answer:
      "Os quatro pilares do programa — receita, eficiência, custos e cultura — com diagnóstico e plano de aplicação para cada um.",
  },
  {
    question: "Será que isso é para mim?",
    answer:
      "Se você já toma decisões de gestão, custo e crescimento na sua empresa — e sente que poderiam ser mais estruturadas — o conteúdo foi pensado pra esse momento.",
  },
  {
    question: "Por que essa condição é diferente da que vai aparecer depois?",
    answer:
      "Porque é a condição apresentada exclusivamente a quem acompanhou a transmissão de 11 de agosto — depois deste lançamento, as condições podem mudar.",
  },
];

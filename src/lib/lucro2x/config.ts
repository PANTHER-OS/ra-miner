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
  fullPriceCents: 99990, // R$ 999,90 — preço definitivo, à vista, só via Pix
  // Preço de referência anterior, se existir (pra ancoragem). Deixe `null`
  // enquanto não houver preço oficial anterior confirmado.
  anchorPriceCents: null as number | null,
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

// O checkout agora é interno (rota /lucro2x/checkout, formulário +
// geração de Pix — ver src/lib/lucro2x/payment/). Não tem link externo
// pra configurar aqui; o que falta é a chave do gateway, como variável de
// ambiente do servidor (ver src/lib/lucro2x/payment/mercadopago.ts).

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

export type Bonus = { name: string; description: string };

// Escolhidos pra reforçar o próprio produto, não pra parecer brinde
// solto: a planilha e o checklist usam o mesmo framework (os 4 pilares /
// a cadeia Receita→Patrimônio) que já é o argumento central da página.
export const bonuses: Bonus[] = [
  {
    name: "Planilha de Alocação de Lucro",
    description: "Aplique a cadeia Receita → Patrimônio direto nos números da sua empresa.",
  },
  {
    name: "Checklist de Diagnóstico de Estrutura",
    description: "Descubra em 15 minutos onde a empresa está mais frágil, entre os 4 pilares.",
  },
  {
    name: "Sessão de Diagnóstico ao Vivo",
    description: "Encontro em grupo, só pra essa turma, pra tirar dúvida com os seus números.",
  },
  {
    name: "Grupo Fechado de Execução",
    description: "Comunidade só de quem entrou nesse lançamento, pra trocar experiência aplicando.",
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
    question: "Por que só Pix?",
    answer:
      "Porque é a forma mais rápida de confirmar sua vaga na condição de lançamento — sem taxa, sem espera de compensação. O pagamento é único, à vista.",
  },
  {
    question: "O que está incluso?",
    answer:
      "Os quatro pilares do programa — receita, eficiência, custos e cultura — com diagnóstico e plano de aplicação para cada um, mais os 4 bônus da condição de lançamento.",
  },
  {
    question: "Será que isso é para mim?",
    answer:
      "Se você já toma decisões de gestão, custo e crescimento na sua empresa — e sente que poderiam ser mais estruturadas — o conteúdo foi pensado pra esse momento.",
  },
  {
    question: "Por que essa condição é diferente da que vai aparecer depois?",
    answer:
      "Porque essa é uma pré-venda antecipada — liberada hoje, antes da transmissão oficial do dia 11. É o valor mais baixo que essa oferta vai ter: a partir do dia 11, quando ela for apresentada oficialmente, o preço sobe.",
  },
];

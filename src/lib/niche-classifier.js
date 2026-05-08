/**
 * Classifica empresas em nichos de afiliação/dropshipping
 * com base no nome, segmento e conteúdo das reclamações.
 */

const NICHOS = {
  emagrecimento: {
    label: 'Emagrecimento / Saúde',
    emoji: '💊',
    keywords: [
      'emagrecimento', 'emagrecer', 'perder peso', 'dieta', 'detox', 'seco',
      'turbinado', 'queima gordura', 'termogênico', 'shake', 'chá', 'cápsulas',
      'suplemento', 'natural slim', 'colágeno', 'vitamina', 'fibra',
    ],
  },
  fitness: {
    label: 'Fitness / Suplementos',
    emoji: '💪',
    keywords: [
      'whey', 'creatina', 'bcaa', 'pré-treino', 'proteína', 'academia',
      'musculação', 'ganho de massa', 'hipercalórico', 'albumina', 'glutamina',
    ],
  },
  infoprodutos: {
    label: 'Infoprodutos / Cursos',
    emoji: '📚',
    keywords: [
      'curso', 'ebook', 'mentoria', 'treinamento', 'método', 'acesso negado',
      'plataforma', 'aula', 'conteúdo', 'certificado', 'masterclass', 'hotmart',
      'eduzz', 'monetizze', 'infoproduto', 'digital', 'apostila',
    ],
  },
  cosmeticos: {
    label: 'Cosméticos / Estética',
    emoji: '💄',
    keywords: [
      'creme', 'shampoo', 'cabelo', 'pele', 'hidratante', 'sérum', 'botox',
      'alisamento', 'maquiagem', 'perfume', 'cosmético', 'esfoliante', 'máscara facial',
      'anti-rugas', 'clareador', 'protetor solar',
    ],
  },
  apostas: {
    label: 'Apostas / Jogos',
    emoji: '🎰',
    keywords: [
      'aposta', 'bet', 'bets', 'cassino', 'slots', 'roleta', 'poker',
      'esportiva', 'odd', 'saque negado', 'bonus', 'bônus bloqueado',
      'conta suspensa bet', 'winnings', 'jogo online',
    ],
  },
  apps_saas: {
    label: 'Apps / SaaS',
    emoji: '📱',
    keywords: [
      'aplicativo', 'app', 'software', 'assinatura', 'plano', 'cancelamento',
      'cobrança indevida', 'renovação automática', 'plataforma online',
      'sistema', 'acesso bloqueado', 'conta deletada',
    ],
  },
  dropshipping: {
    label: 'Dropshipping / Importados',
    emoji: '📦',
    keywords: [
      'não recebi', 'não chegou', 'produto diferente', 'importado', 'aliexpress',
      'china', 'frete', 'rastreio', 'prazo entrega', 'produto falsificado',
      'produto errado', 'não funciona', 'qualidade ruim',
    ],
  },
  financeiro: {
    label: 'Financeiro / Crédito',
    emoji: '💳',
    keywords: [
      'empréstimo', 'crédito', 'financiamento', 'juros', 'cobrança indevida',
      'negativação', 'serasa', 'spc', 'boleto', 'cartão', 'banco',
      'fgts', 'consignado', 'refinanciamento',
    ],
  },
  outros: {
    label: 'Outros',
    emoji: '🏷️',
    keywords: [],
  },
}

export function classifyNiche(empresa, reclamacoes = []) {
  const texto = [
    empresa.nome || '',
    empresa.segmento || '',
    ...reclamacoes.slice(0, 30).map(r => `${r.titulo || ''} ${r.descricao || ''}`),
  ].join(' ').toLowerCase()

  const scores = {}
  for (const [id, nicho] of Object.entries(NICHOS)) {
    if (!nicho.keywords.length) continue
    let hits = 0
    for (const kw of nicho.keywords) {
      if (texto.includes(kw)) hits++
    }
    if (hits > 0) scores[id] = hits
  }

  if (!Object.keys(scores).length) return 'outros'
  return Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0]
}

export function getNichoInfo(id) {
  return NICHOS[id] || NICHOS.outros
}

export function listNichos() {
  return Object.entries(NICHOS).map(([id, n]) => ({ id, ...n }))
}

export function nichoKeywords(id) {
  return NICHOS[id]?.keywords || []
}

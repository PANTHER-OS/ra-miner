/**
 * Motor de análise: detecta spikes, padrões e extrai insights das reclamações.
 */
import { calcVelocity, calcAcceleration } from './scoring.js'
import { countBy, groupBy, truncate } from './utils.js'

// Detecta spike: aumento súbito em um período curto
export function detectSpike(reclamacoes, { windowDays = 3, threshold = 2.5 } = {}) {
  const now    = Date.now()
  const DAY    = 86_400_000
  const recent = reclamacoes.filter(r => now - new Date(r.data).getTime() <= windowDays * DAY)
  const base   = reclamacoes.filter(r => {
    const age = now - new Date(r.data).getTime()
    return age > windowDays * DAY && age <= windowDays * 2 * DAY
  })

  if (!base.length) return recent.length > 3  // nova empresa = spike se tiver qualquer reclamação recente
  return (recent.length / base.length) >= threshold
}

// TF-IDF simplificado para extrair palavras-chave das reclamações
export function extractKeywords(reclamacoes, topN = 12) {
  const STOPWORDS = new Set([
    'de','a','o','que','e','do','da','em','um','para','é','com','uma','os','no',
    'se','na','por','mais','as','dos','como','mas','foi','ao','ele','das','tem',
    'à','seu','sua','ou','ser','quando','muito','há','nos','já','está','eu',
    'também','só','pelo','pela','até','isso','ela','entre','era','depois','sem',
    'mesmo','aos','ter','seus','quem','nas','me','esse','eles','estão','você',
    'tinha','foram','essa','num','nem','suas','meu','às','minha','têm','numa',
    'pelos','elas','havia','seja','qual','será','nós','tenho','lhe','deles',
    'essas','esses','pelas','este','dele','tu','te','vocês','vos','lhes','meus',
    'minhas','teu','tua','teus','tuas','nosso','nossa','nossos','nossas','dela',
    'delas','esta','estes','estas','aquele','aquela','aqueles','aquelas','isto',
    'aquilo','estou','está','estamos','estão','não','sim','mais','menos','muito',
    'pouco','todo','toda','todos','todas','outro','outra','outros','outras',
  ])

  const freq = {}
  for (const r of reclamacoes) {
    const words = `${r.titulo || ''} ${r.descricao || ''}`
      .toLowerCase()
      .replace(/[^a-záàâãéèêíïóôõöúùûüçñ\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 3 && !STOPWORDS.has(w))

    for (const w of words) {
      freq[w] = (freq[w] || 0) + 1
    }
  }

  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([word, count]) => ({ word, count }))
}

// Detecta padrões recorrentes nas reclamações
export function detectPatterns(reclamacoes) {
  const PATTERNS = [
    { id: 'nao_recebeu',      label: 'Não recebeu produto',      regex: /não recebi|não chegou|sem entrega|produto não chegou/i },
    { id: 'produto_diferente', label: 'Produto diferente/falso',   regex: /produto diferente|falsificado|produto errado|não era/i },
    { id: 'cancelamento',     label: 'Dificuldade cancelar',      regex: /não consigo cancelar|cancelamento negado|impossível cancelar/i },
    { id: 'cobranca_indevida', label: 'Cobrança indevida',         regex: /cobrado indevidamente|cobrança indevida|cobraram sem|fui cobrado/i },
    { id: 'sem_resposta',     label: 'Sem retorno/atendimento',   regex: /sem resposta|não respondem|atendimento péssimo|ninguém atende/i },
    { id: 'fraude',           label: 'Suspeita de fraude',        regex: /fraude|golpe|estelionato|enganam|mentira|propaganda enganosa/i },
    { id: 'prazo_nao_cumprido', label: 'Prazo não cumprido',      regex: /prazo não cumprido|atrasado|sem previsão|perdido prazo/i },
    { id: 'reembolso',        label: 'Reembolso não realizado',   regex: /reembolso|estorno|não devolveu|dinheiro de volta/i },
  ]

  const results = []
  for (const p of PATTERNS) {
    const matches = reclamacoes.filter(r =>
      p.regex.test(`${r.titulo || ''} ${r.descricao || ''}`)
    )
    if (matches.length > 0) {
      results.push({ ...p, count: matches.length, pct: (matches.length / reclamacoes.length * 100).toFixed(1) })
    }
  }

  return results.sort((a, b) => b.count - a.count)
}

// Estimativa de volume de vendas (heurística: 1-3% de compradores reclamam)
export function estimateSalesVolume(totalReclamacoes, { reclamationRate = 0.02 } = {}) {
  const min = Math.round(totalReclamacoes / 0.04)
  const max = Math.round(totalReclamacoes / 0.01)
  const mid = Math.round(totalReclamacoes / reclamationRate)
  return { min, mid, max }
}

// Agrupa reclamações por período para sparkline
export function groupByPeriod(reclamacoes, days = 30) {
  const now = Date.now()
  const DAY = 86_400_000
  const buckets = Array.from({ length: days }, (_, i) => {
    const start = now - (days - i) * DAY
    const end   = now - (days - i - 1) * DAY
    return { date: new Date(start).toISOString().split('T')[0], start, end, count: 0 }
  })

  for (const r of reclamacoes) {
    const t = new Date(r.data).getTime()
    const bucket = buckets.find(b => t >= b.start && t < b.end)
    if (bucket) bucket.count++
  }

  return buckets
}

// Análise de sentimento simples (léxico)
export function sentimentScore(texto = '') {
  const pos = ['resolvido', 'ótimo', 'excelente', 'rápido', 'parabéns', 'grato', 'obrigado', 'satisfeito']
  const neg = ['péssimo', 'horrível', 'absurdo', 'vergonha', 'golpe', 'fraude', 'nunca', 'jamais', 'piora', 'raiva']
  const t   = texto.toLowerCase()
  const p   = pos.filter(w => t.includes(w)).length
  const n   = neg.filter(w => t.includes(w)).length
  if (p > n) return 'positivo'
  if (n > p) return 'negativo'
  return 'neutro'
}

// Status das reclamações agrupado
export function statusBreakdown(reclamacoes) {
  return countBy(reclamacoes, 'status')
}

// Distribuição por estado
export function stateDistribution(reclamacoes) {
  const byState = countBy(reclamacoes, 'estado')
  return Object.entries(byState)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([estado, count]) => ({ estado, count }))
}

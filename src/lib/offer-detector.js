/**
 * Sistema de detecção de padrões por oferta/produto.
 *
 * Algoritmo:
 *  1. Extrai tokens de oferta de cada título (remove palavras de reclamação)
 *  2. Agrupa por similaridade Jaccard (threshold configurável)
 *  3. Enriquece cada cluster: velocidade, aceleração, padrões, keywords
 *  4. Retorna lista ordenada por Offer Heat Score
 */
import { detectPatterns, extractKeywords } from './analyzer.js'

// Removidos do título para isolar o nome do produto
const COMPLAINT_WORDS = new Set([
  // Verbos de reclamação
  'nao','não','nunca','jamais','sem','falta','faltou',
  'recebi','chegou','veio','enviou','enviado','entregou','entregue','entregar',
  'comprei','paguei','comprado','comprou',
  'cancelar','cancelou','cancelado','cancelamento',
  'devolver','devolveu','devolvido','devolucao','devolução',
  'cobrado','cobrou','cobranca','cobrança','cobraram',
  'resolveu','resolvido','resolveram','resolver',
  'respondeu','responderam','resposta','responder',
  'funciona','funcionou','funcionando','funcionar',
  'problema','problemas','erro','erros','falha','falhas','defeito','defeitos',
  'reclamacao','reclamação','reclamacoes','reclamações','reclamar',
  'entrega','pedido','compra','order','encomenda','encomendas',
  'reembolso','estorno','devolutiva',
  'fraude','golpe','estelionato','propaganda','enganosa',
  'atendimento','suporte','cliente','servico','serviço',
  'prazo','atraso','demora','atrasado','atrasada',
  'qualidade','quebrado','quebrada','danificado','danificada',
  'diferente','errado','errada','incorreto','incorreta',
  'falsificado','falsificada','falso','falsa','replica',
  'site','loja','plataforma','aplicativo','app','sistema',
  'absurdo','pessimo','péssimo','horrivel','horrível','vergonha',
  'urgente','atencao','atenção','ajuda','help',
  'via','desde','ainda','mais','muito','pouco',
  // Verbos de falha física de produto
  'parou','quebrou','soltou','caiu','sumiu','travou','travado','travada','bugou',
  'parada','parado','caindo','soltando','quebrando','travando','desligou','desliga',
  'esquentou','aquecendo','superaqueceu',
  'sincroniza','sincronizar','conectar','conecta','carrega','carregar','ligar','acessar',
  // Partes/componentes do produto (não são o nome do produto)
  'tela','bateria','carregador','cabo','caixa','embalagem','capa','tampa',
  'botao','botoes','botões','sensor','sensores','pulseira','alca','alça','correia',
  'solado','ziper','zipper','costura','costuras','tecido','material',
  // Descritivos genéricos e temporais
  'sozinha','sozinho','normal','somente','apenas','todo','tuda','hora','vez',
  'vezes','dias','horas','meses','semanas','primeiro','segunda','terceiro',
  'inicial','unica','único','completo','completa','incompleto',
  'arranhado','arranhada','amassado','amassada','violada','violado','celular',
])

const STOPWORDS = new Set([
  'de','a','o','que','e','do','da','em','um','para','com','uma',
  'os','no','se','na','por','as','dos','como','mas','foi',
  'ao','das','tem','seu','sua','ou','ser','nos','já',
  'está','esta','eu','também','só','pelo','pela','até','isso','ela',
  'entre','era','depois','mesmo','aos','ter',
  'meu','minha','meus','minhas','esse','essa','esses','essas',
  'este','estes','estas','aqui','ali','la','lá',
  'me','te','lhe','nos','vos','lhes','foi','ser','estar',
  'quando','onde','como','quem','qual','quais',
])

function normalize(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function extractOfferTokens(titulo) {
  return normalize(titulo)
    .split(' ')
    .filter(w => w.length > 2 && !STOPWORDS.has(w) && !COMPLAINT_WORDS.has(w))
}

function jaccard(a, b) {
  if (!a.length || !b.length) return 0
  const sa = new Set(a)
  const sb = new Set(b)
  let inter = 0
  for (const t of sa) if (sb.has(t)) inter++
  return inter / (sa.size + sb.size - inter)
}

/**
 * Detecta e agrupa reclamações por padrão de oferta/produto.
 *
 * @param {Array}  reclamacoes          — array de reclamações com { id, titulo, descricao, data, status, curtidas, comentarios }
 * @param {Object} opts
 * @param {number} opts.minCount         — mínimo de reclamações para formar um cluster (default 2)
 * @param {number} opts.similarityThreshold — limiar de similaridade Jaccard (default 0.35)
 * @param {number} opts.topN             — máximo de clusters retornados (default 8)
 * @returns {Array} clusters ordenados por Offer Heat Score
 */
export function detectOffers(reclamacoes, {
  minCount            = 2,
  similarityThreshold = 0.35,
  topN                = 8,
} = {}) {
  if (!reclamacoes?.length) return []

  const items = reclamacoes
    .filter(r => r.titulo?.trim())
    .map((r, i) => ({ i, r, tokens: extractOfferTokens(r.titulo) }))
    .filter(x => x.tokens.length >= 2)

  if (items.length < minCount) return []

  // Greedy single-linkage clustering
  const assigned = new Set()
  const clusters  = []

  for (let a = 0; a < items.length; a++) {
    if (assigned.has(a)) continue
    assigned.add(a)

    const members = [items[a]]

    for (let b = a + 1; b < items.length; b++) {
      if (assigned.has(b)) continue
      if (jaccard(items[a].tokens, items[b].tokens) >= similarityThreshold) {
        members.push(items[b])
        assigned.add(b)
      }
    }

    if (members.length >= minCount) clusters.push(members)
  }

  if (!clusters.length) return []

  const now = Date.now()
  const SETE = 7 * 86_400_000

  return clusters
    .map(members => {
      const recls = members.map(m => m.r)

      // Most frequent title variant → display name
      const freq = {}
      for (const r of recls) {
        const k = r.titulo.toLowerCase().trim()
        freq[k] = (freq[k] || 0) + 1
      }
      const topTitle   = Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0]
      const variantes  = [...new Set(recls.map(r => r.titulo))].slice(0, 5)

      // Date range
      const timestamps = recls.map(r => new Date(r.data).getTime()).filter(t => !isNaN(t))
      const minTs = timestamps.length ? Math.min(...timestamps) : null
      const maxTs = timestamps.length ? Math.max(...timestamps) : null

      // Velocity & acceleration (complaints/day)
      const recent7  = recls.filter(r => now - new Date(r.data).getTime() <= SETE).length
      const prev7    = recls.filter(r => {
        const age = now - new Date(r.data).getTime()
        return age > SETE && age <= 2 * SETE
      }).length
      const velocidade  = parseFloat((recent7 / 7).toFixed(2))
      const aceleracao  = prev7 > 0
        ? parseFloat(((recent7 - prev7) / prev7 * 100).toFixed(1))
        : (recent7 > 0 ? 100 : 0)

      const padroes  = detectPatterns(recls)
      const keywords = extractKeywords(recls, 6)

      const statusMap = {}
      for (const r of recls) {
        const s = r.status || 'ABERTA'
        statusMap[s] = (statusMap[s] || 0) + 1
      }

      const curtidas    = recls.reduce((s, r) => s + (r.curtidas    || 0), 0)
      const comentarios = recls.reduce((s, r) => s + (r.comentarios || 0), 0)

      // Offer Heat Score
      const countScore   = Math.min(recls.length / 30 * 40, 40)
      const velocScore   = Math.min(velocidade * 6, 25)
      const accelScore   = Math.min(Math.max(aceleracao / 100 * 15, 0), 15)
      const engageScore  = Math.min((curtidas + comentarios) / 50 * 10, 10)
      const recencyDays  = maxTs ? (now - maxTs) / 86_400_000 : 999
      const recencyScore = Math.max(10 - recencyDays * 2, 0)
      const score        = Math.round(countScore + velocScore + accelScore + engageScore + recencyScore)

      return {
        id:                 members[0].tokens.slice(0, 4).join('_').substring(0, 40),
        nome:               _titleCase(topTitle),
        variantes,
        count:              recls.length,
        velocidade,
        aceleracao,
        primeiraReclamacao: minTs ? new Date(minTs).toISOString() : null,
        ultimaReclamacao:   maxTs ? new Date(maxTs).toISOString() : null,
        padroes,
        keywords,
        statusMap,
        curtidas,
        comentarios,
        score,
      }
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, topN)
}

function _titleCase(str) {
  const minor = new Set(['de','da','do','das','dos','em','no','na','nos','nas','e'])
  return str.split(' ').map((w, i) =>
    i === 0 || !minor.has(w) ? w.charAt(0).toUpperCase() + w.slice(1) : w
  ).join(' ')
}

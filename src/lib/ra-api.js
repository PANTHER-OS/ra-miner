/**
 * Wrapper da API interna do Reclame Aqui.
 * O RA usa uma API REST + GraphQL sob o domínio iosearch.reclameaqui.com.br.
 * Todos os requests passam pelo rate limiter.
 */
import { defaultLimiter } from './rate-limiter.js'
import { pageCache } from './cache.js'

const BASE_SEARCH  = 'https://iosearch.reclameaqui.com.br/raichu-io-site-search-api'
const BASE_SCORER  = 'https://iscorer.reclameaqui.com.br'
const BASE_RA      = 'https://www.reclameaqui.com.br'

const HEADERS = {
  'Accept':          'application/json, text/plain, */*',
  'Accept-Language': 'pt-BR,pt;q=0.9',
  'Origin':          'https://www.reclameaqui.com.br',
  'Referer':         'https://www.reclameaqui.com.br/',
}

async function _fetch(url, opts = {}) {
  await defaultLimiter.acquire()
  const cached = pageCache.get(url)
  if (cached) return cached

  const res = await fetch(url, {
    headers: { ...HEADERS, ...(opts.headers || {}) },
    signal: opts.signal,
  })

  if (!res.ok) throw new Error(`RA API ${res.status}: ${url}`)
  const data = await res.json()
  pageCache.set(url, data, opts.ttl || 5 * 60_000)
  return data
}

// Busca empresas por query
export async function searchEmpresas(query, { offset = 0, limit = 10 } = {}) {
  const url = `${BASE_SEARCH}/query/companyComplains/${offset}/${limit}?q=${encodeURIComponent(query)}`
  const data = await _fetch(url)
  return _parseSearchResult(data)
}

// Reclamações de uma empresa pelo slug
export async function fetchReclamacoesEmpresa(slug, { offset = 0, limit = 20, orderBy = 'CREATED_DATE' } = {}) {
  const url = `${BASE_SEARCH}/query/companyComplains/${offset}/${limit}?company=${encodeURIComponent(slug)}&order=${orderBy}`
  const data = await _fetch(url, { ttl: 3 * 60_000 })
  return _parseComplaints(data)
}

// Score / índice RA da empresa
export async function fetchEmpresaScore(companyId) {
  const url = `${BASE_SCORER}/companies/${companyId}/score`
  try {
    return await _fetch(url, { ttl: 15 * 60_000 })
  } catch {
    return null
  }
}

// Ranking geral do RA (Top empresas por segmento)
export async function fetchRanking({ segmento = '', page = 1 } = {}) {
  const params = new URLSearchParams({ page: String(page), order: 'COMPLAINS_QUANTITY' })
  if (segmento) params.set('segment', segmento)
  const url = `${BASE_SEARCH}/query/rankingComplains/0/50?${params}`
  const data = await _fetch(url, { ttl: 30 * 60_000 })
  return _parseSearchResult(data)
}

// Dados de uma empresa a partir do slug (tenta extrair do HTML/NEXT_DATA)
export async function fetchEmpresaPage(slug) {
  await defaultLimiter.acquire()
  const url    = `${BASE_RA}/empresa/${slug}/`
  const cacheKey = `page:${slug}`
  const cached   = pageCache.get(cacheKey)
  if (cached) return cached

  const res  = await fetch(url, { headers: { ...HEADERS, 'Accept': 'text/html' } })
  if (!res.ok) throw new Error(`Página ${slug} retornou ${res.status}`)
  const html = await res.text()
  const data = _extractNextData(html)
  if (data) pageCache.set(cacheKey, data, 10 * 60_000)
  return data
}

// Reclamações recentes via endpoint público (fallback DOM-based)
export async function fetchRecentComplaints(slug, pages = 3) {
  const all = []
  for (let p = 0; p < pages; p++) {
    try {
      const batch = await fetchReclamacoesEmpresa(slug, { offset: p * 20, limit: 20 })
      all.push(...batch)
      if (batch.length < 20) break
    } catch {
      break
    }
  }
  return all
}

// --- Parsers internos ---

function _parseSearchResult(data) {
  const items = data?.complainResult?.complains || data?.data || data?.items || []
  return items.map(item => ({
    id:                item.id || item.companyId,
    nome:              item.companyName || item.name || '',
    slug:              item.companySlug || item.slug || '',
    segmento:          item.segmentName || item.segment || '',
    total_reclamacoes: parseInt(item.complainsCount || item.totalComplains || 0, 10),
    score_ra:          parseFloat(item.score || 0),
    respondidas_pct:   parseFloat(item.answeredPercentage || 0),
    resolvidas_pct:    parseFloat(item.resolvedPercentage || 0),
    avaliacao_media:   parseFloat(item.averageEvaluation || 0),
  }))
}

function _parseComplaints(data) {
  const items = data?.complainResult?.complains || data?.data || []
  return items.map(item => ({
    id:          item.id,
    empresa_id:  null,  // preenchido pelo chamador
    titulo:      item.title || item.complain || '',
    descricao:   item.description || item.body || '',
    data:        item.createdDate || item.date || new Date().toISOString(),
    status:      item.status || 'ABERTA',
    estado:      item.city?.state || item.state || '',
    cidade:      item.city?.name || item.city || '',
    curtidas:    parseInt(item.votes || 0, 10),
    comentarios: parseInt(item.commentsCount || 0, 10),
  }))
}

function _extractNextData(html) {
  const match = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/)
  if (!match) return null
  try {
    return JSON.parse(match[1])
  } catch {
    return null
  }
}

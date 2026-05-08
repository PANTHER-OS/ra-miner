/**
 * Motor de scraping orquestrado.
 * Coordena coleta de dados de uma empresa via API + fallback DOM,
 * persiste no IndexedDB e recalcula Heat Score.
 */
import { fetchRecentComplaints, fetchEmpresaPage, searchEmpresas } from './ra-api.js'
import { calcHeatScore } from './scoring.js'
import { classifyNiche } from './niche-classifier.js'
import { upsertEmpresa, bulkUpsertReclamacoes, addSnapshot, getReclamacoes } from './storage.js'
import { slugFromUrl, sleep } from './utils.js'

export async function scrapeEmpresa(slugOrUrl) {
  const slug = slugOrUrl.includes('/') ? slugFromUrl(slugOrUrl) : slugOrUrl
  if (!slug) throw new Error('Slug inválido')

  // 1. Busca dados básicos (tenta API, fallback NEXT_DATA)
  let empresaDados
  try {
    const pageData = await fetchEmpresaPage(slug)
    empresaDados = _extractEmpresaFromNextData(pageData, slug)
  } catch {
    const results = await searchEmpresas(slug, { limit: 1 })
    empresaDados = results[0] || { slug, nome: slug, total_reclamacoes: 0 }
  }

  // 2. Persiste empresa
  const empresaId = await upsertEmpresa({ ...empresaDados, slug })

  // 3. Coleta reclamações recentes (últimas 60 = ~3 páginas)
  const recentes = await fetchRecentComplaints(slug, 3)
  const comEmpresa = recentes.map(r => ({ ...r, empresa_id: empresaId }))
  await bulkUpsertReclamacoes(comEmpresa)

  // 4. Classifica nicho
  const todasReclamacoes = await getReclamacoes(empresaId, { days: 30 })
  const nicho = classifyNiche(empresaDados, todasReclamacoes)

  // 5. Calcula Heat Score
  const heatScore = calcHeatScore(
    { ...empresaDados, primeiro_visto: Date.now() },
    todasReclamacoes
  )

  // 6. Atualiza empresa com score e nicho
  await upsertEmpresa({
    ...empresaDados,
    slug,
    nicho_inferido: nicho,
    heat_score: heatScore,
  })

  // 7. Salva snapshot
  await addSnapshot({
    empresa_id:        empresaId,
    timestamp:         Date.now(),
    total_reclamacoes: empresaDados.total_reclamacoes || 0,
    heat_score:        heatScore,
    velocity_7d:       todasReclamacoes.filter(r =>
      Date.now() - new Date(r.data).getTime() <= 7 * 86_400_000
    ).length / 7,
  })

  return { empresaId, slug, heatScore, nicho, totalReclamacoes: recentes.length }
}

// Scraping em lote (watchlist ou ranking)
export async function scrapeLote(slugs, { onProgress } = {}) {
  const results = []
  for (let i = 0; i < slugs.length; i++) {
    try {
      const r = await scrapeEmpresa(slugs[i])
      results.push({ ok: true, ...r })
    } catch (err) {
      results.push({ ok: false, slug: slugs[i], error: err.message })
    }
    onProgress?.(i + 1, slugs.length)
    if (i < slugs.length - 1) await sleep(1200 + Math.random() * 600)
  }
  return results
}

function _extractEmpresaFromNextData(nextData, slug) {
  if (!nextData) return { slug, nome: slug, total_reclamacoes: 0 }

  const props = nextData?.props?.pageProps
  const co = props?.company || props?.companyData || props?.data?.company || {}

  return {
    slug,
    nome:              co.name || co.companyName || slug,
    segmento:          co.segmentName || co.segment || '',
    total_reclamacoes: parseInt(co.complainsCount || co.totalComplains || 0, 10),
    score_ra:          parseFloat(co.score || 0),
    respondidas_pct:   parseFloat(co.answeredPercentage || 0),
    resolvidas_pct:    parseFloat(co.resolvedPercentage || 0),
  }
}

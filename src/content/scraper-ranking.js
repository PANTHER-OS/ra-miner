/**
 * Scraper das páginas de ranking e segmentos do Reclame Aqui.
 */
import { sanitizeText, extractNextData } from '../lib/utils.js'

export async function scrapeRankingPage() {
  const empresas = _extractFromNextData() || _extractFromDom()
  if (!empresas.length) return []

  const res = await chrome.runtime.sendMessage({
    type:    'SCRAPE_LOTE',
    payload: { slugs: empresas.map(e => e.slug).filter(Boolean) },
  })

  return res?.data || []
}

function _extractFromNextData() {
  const nd = extractNextData(document)
  if (!nd) return null

  const items =
    nd?.props?.pageProps?.ranking?.companies ||
    nd?.props?.pageProps?.companies ||
    nd?.props?.pageProps?.data ||
    null

  if (!Array.isArray(items)) return null

  return items.map(co => ({
    slug:              co.slug || co.companySlug || '',
    nome:              co.name || co.companyName || '',
    segmento:          co.segmentName || co.segment || '',
    total_reclamacoes: parseInt(co.complainsCount || co.totalComplains || 0, 10),
    score_ra:          parseFloat(co.score || 0),
    respondidas_pct:   parseFloat(co.answeredPercentage || 0),
  }))
}

function _extractFromDom() {
  const rows = document.querySelectorAll(
    '[data-testid="ranking-row"], .ranking-item, .company-ranking-row'
  )

  return Array.from(rows).map(row => {
    const link  = row.querySelector('a[href]')
    const nome  = row.querySelector('.company-name, h2, h3, td:nth-child(2)')
    const slug  = (link?.getAttribute('href') || '').split('/').filter(Boolean)[0] || ''

    return {
      slug,
      nome: sanitizeText(nome?.textContent || slug),
    }
  }).filter(e => e.slug)
}

/**
 * Scraper da página de busca/listagem do Reclame Aqui.
 * Coleta cards de empresas listadas nos resultados.
 */
import { sanitizeText, extractNextData } from '../lib/utils.js'

export async function scrapeBuscaPage() {
  const empresas = _extractFromNextData() || _extractFromDom()
  if (!empresas.length) return []

  // Envia para background processar em lote silencioso
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
    nd?.props?.pageProps?.companies ||
    nd?.props?.pageProps?.searchResult?.companies ||
    nd?.props?.pageProps?.data?.companies ||
    null

  if (!Array.isArray(items)) return null

  return items.map(co => ({
    slug:              co.slug || co.companySlug || '',
    nome:              co.name || co.companyName || '',
    total_reclamacoes: parseInt(co.complainsCount || 0, 10),
    score_ra:          parseFloat(co.score || 0),
    segmento:          co.segmentName || '',
  }))
}

function _extractFromDom() {
  const cards = document.querySelectorAll(
    '[data-testid="company-card"], .company-card, .search-result-item'
  )

  return Array.from(cards).map(card => {
    const link  = card.querySelector('a[href]')
    const nome  = card.querySelector('[data-testid="company-name"], .company-name, h2, h3')
    const count = card.querySelector('[data-testid="complains-count"], .complains-count')

    const href = link?.getAttribute('href') || ''
    const slug = href.split('/').filter(Boolean)[0] || ''

    return {
      slug,
      nome:              sanitizeText(nome?.textContent || slug),
      total_reclamacoes: parseInt(count?.textContent?.replace(/\D/g, '') || '0', 10),
    }
  }).filter(e => e.slug)
}

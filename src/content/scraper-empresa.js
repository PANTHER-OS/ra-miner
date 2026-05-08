/**
 * Scraper da página de empresa do Reclame Aqui.
 * Extrai dados do NEXT_DATA e do DOM como fallback.
 */
import { extractNextData, slugFromUrl, sanitizeText } from '../lib/utils.js'

export async function scrapeEmpresaPage() {
  const slug = slugFromUrl(location.href)
  if (!slug) return null

  const empresa    = _extractEmpresaDom() || _extractEmpresaNextData() || { slug }
  const reclamacoes = _extractReclamacoesDom()

  const payload = { slug, empresa, reclamacoes }

  const res = await chrome.runtime.sendMessage({ type: 'SCRAPE_EMPRESA', payload: { slug } })
  return res?.data
}

function _extractEmpresaNextData() {
  const nd = extractNextData(document)
  if (!nd) return null
  const props = nd?.props?.pageProps
  const co    = props?.company || props?.companyData || {}
  const nome  = co.companyName || co.name || ''
  if (!nome) return null
  return {
    id:                co.id || co.companyId || '',
    nome,
    slug:              co.shortname || co.slug || '',
    segmento:          co.segmentName || co.segment || '',
    total_reclamacoes: parseInt(co.complainsCount || co.totalComplains || 0, 10),
    score_ra:          parseFloat(co.score || 0),
    respondidas_pct:   parseFloat(co.answeredPercentage || 0),
    resolvidas_pct:    parseFloat(co.resolvedPercentage || 0),
  }
}

function _extractEmpresaDom() {
  const nameEl   = document.querySelector('[data-testid="company-name"], h1.company-name, .company-header h1')
  if (!nameEl) return null

  const totalEl  = document.querySelector('[data-testid="complains-count"], .complains-count')
  const scoreEl  = document.querySelector('[data-testid="company-score"], .company-score')

  return {
    nome:              sanitizeText(nameEl.textContent),
    total_reclamacoes: parseInt(totalEl?.textContent?.replace(/\D/g, '') || '0', 10),
    score_ra:          parseFloat(scoreEl?.textContent?.replace(',', '.') || '0'),
  }
}

function _extractReclamacoesDom() {
  const cards = document.querySelectorAll(
    '[data-testid="complaint-card"], .complaint-item, .reclamacao-card'
  )

  return Array.from(cards).map(card => {
    const titulo = card.querySelector('[data-testid="complaint-title"], .title, h3')
    const data   = card.querySelector('[data-testid="complaint-date"], .date, time')
    const status = card.querySelector('[data-testid="complaint-status"], .status-badge')

    return {
      titulo:  sanitizeText(titulo?.textContent || ''),
      data:    data?.getAttribute('datetime') || data?.textContent || new Date().toISOString(),
      status:  sanitizeText(status?.textContent || 'ABERTA').toUpperCase(),
    }
  }).filter(r => r.titulo)
}

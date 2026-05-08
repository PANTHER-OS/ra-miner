/**
 * Injeta badges "ESCALADA / EXPLODINDO" nos cards de empresa
 * nas listagens do Reclame Aqui.
 */
import { getHeatTag } from '../lib/scoring.js'

const INJECTED_ATTR = 'data-ram-injected'

export function injectOverlays() {
  _injectOnCards()

  // Reinjeta quando o DOM muda (SPA navigation / infinite scroll)
  const observer = new MutationObserver(() => _injectOnCards())
  observer.observe(document.body, { childList: true, subtree: true })
}

async function _injectOnCards() {
  const cards = document.querySelectorAll(
    `[data-testid="company-card"]:not([${INJECTED_ATTR}]),
     .company-card:not([${INJECTED_ATTR}]),
     .search-result-item:not([${INJECTED_ATTR}]),
     [data-testid="ranking-row"]:not([${INJECTED_ATTR}])`
  )

  for (const card of cards) {
    card.setAttribute(INJECTED_ATTR, '1')
    const slug = _extractSlugFromCard(card)
    if (!slug) continue

    const res = await chrome.runtime.sendMessage({
      type:    'GET_EMPRESA',
      payload: { slug },
    })

    const empresa = res?.data
    if (!empresa?.heat_score) continue

    _injectBadge(card, empresa)
  }
}

function _injectBadge(card, empresa) {
  const { heat_score, nicho_inferido } = empresa
  const { tag, emoji, color }          = getHeatTag(heat_score)

  const badge = document.createElement('div')
  badge.className      = 'ram-badge'
  badge.dataset.score  = heat_score
  badge.innerHTML = `
    <span class="ram-badge__emoji">${emoji}</span>
    <span class="ram-badge__tag">${tag}</span>
    <span class="ram-badge__score">${heat_score}</span>
  `
  badge.style.setProperty('--ram-color', color)
  badge.title = `Heat Score: ${heat_score}/100 · Nicho: ${nicho_inferido || '?'}`

  // Posiciona no canto superior direito do card
  const pos = getComputedStyle(card).position
  if (pos === 'static') card.style.position = 'relative'
  card.appendChild(badge)
}

function _extractSlugFromCard(card) {
  const link = card.querySelector('a[href*="reclameaqui.com.br"]') || card.querySelector('a[href^="/"]')
  if (!link) return null
  const href = link.getAttribute('href')
  return href?.split('/').filter(Boolean)[0] || null
}

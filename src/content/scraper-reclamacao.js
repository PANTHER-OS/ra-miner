/**
 * Scraper de página individual de reclamação.
 * Extrai todos os detalhes: descrição completa, status, avaliação, comentários.
 */
import { extractNextData, sanitizeText } from '../lib/utils.js'

export function scrapeReclamacaoPage() {
  const nd = extractNextData(document)
  if (nd) {
    const complain = nd?.props?.pageProps?.complain || nd?.props?.pageProps?.data?.complain
    if (complain) return _fromNextData(complain)
  }
  return _fromDom()
}

function _fromNextData(c) {
  return {
    id:          c.id,
    titulo:      c.title || '',
    descricao:   c.description || c.body || '',
    data:        c.createdDate || c.date || '',
    status:      c.status || 'ABERTA',
    estado:      c.city?.state || '',
    cidade:      c.city?.name || '',
    curtidas:    parseInt(c.votes || 0, 10),
    comentarios: parseInt(c.commentsCount || 0, 10),
    avaliacao:   parseFloat(c.evaluation || 0),
    respondida:  !!c.answeredDate,
    resolvida:   c.status === 'RESPONDIDA' || c.status === 'RESOLVIDA',
    url:         location.href,
  }
}

function _fromDom() {
  const titulo    = document.querySelector('[data-testid="complaint-title"], h1.complaint-title')
  const descricao = document.querySelector('[data-testid="complaint-description"], .complaint-description')
  const data      = document.querySelector('[data-testid="complaint-date"], time')
  const status    = document.querySelector('[data-testid="status-badge"], .status')

  return {
    id:          null,
    titulo:      sanitizeText(titulo?.textContent || ''),
    descricao:   sanitizeText(descricao?.textContent || ''),
    data:        data?.getAttribute('datetime') || data?.textContent || '',
    status:      sanitizeText(status?.textContent || 'ABERTA').toUpperCase(),
    url:         location.href,
  }
}

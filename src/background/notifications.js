/**
 * Notificações Chrome para spikes de reclamação na watchlist.
 */
import { getWatchlist, getReclamacoes, getConfig } from '../lib/storage.js'
import { detectSpike } from '../lib/analyzer.js'
import { getHeatTag } from '../lib/scoring.js'

export async function checkAndNotifySpikes(scrapeResults = []) {
  const notificationsEnabled = await getConfig('notificacoes_ativas', true)
  if (!notificationsEnabled) return

  for (const result of scrapeResults) {
    if (!result.ok) continue
    const { empresaId, slug, heatScore } = result

    const threshold = parseInt(await getConfig('threshold_notificacao', '60'), 10)
    if (heatScore < threshold) continue

    const reclamacoes = await getReclamacoes(empresaId, { days: 7 })
    const isSpike     = detectSpike(reclamacoes, { windowDays: 3, threshold: 2 })

    if (isSpike) {
      await _sendSpike({ empresaId, slug, heatScore, reclamacoes })
    }
  }
}

async function _sendSpike({ slug, heatScore, reclamacoes }) {
  const tag  = getHeatTag(heatScore)
  const url  = `https://www.reclameaqui.com.br/${slug}/`

  chrome.notifications.create(`spike-${slug}-${Date.now()}`, {
    type:    'basic',
    iconUrl: chrome.runtime.getURL('icons/icon-48.png'),
    title:   `${tag.emoji} ${slug} — ${tag.tag}`,
    message: `Heat Score: ${heatScore}/100 · ${reclamacoes.length} reclamações nos últimos 7 dias`,
    buttons: [{ title: 'Ver no RA' }],
    priority: 2,
  })
}

// Notificação de digest diário
export async function sendDailyDigest() {
  const watchlist = await getWatchlist()
  if (!watchlist.length) return

  const empresas = watchlist
    .map(w => w.empresa)
    .filter(Boolean)
    .sort((a, b) => (b.heat_score || 0) - (a.heat_score || 0))
    .slice(0, 5)

  if (!empresas.length) return

  const top = empresas[0]
  const tag = getHeatTag(top.heat_score || 0)

  chrome.notifications.create(`digest-${Date.now()}`, {
    type:    'list',
    iconUrl: chrome.runtime.getURL('icons/icon-48.png'),
    title:   '🔥 RA Miner — Digest Diário',
    message: `Top: ${top.nome} (${top.heat_score}/100)`,
    items:   empresas.slice(0, 5).map(e => ({
      title:   e.nome,
      message: `Heat: ${e.heat_score || 0}/100`,
    })),
    priority: 1,
  })
}

export async function notifyUpdateAvailable(update) {
  chrome.notifications.create('update-available', {
    type:               'basic',
    iconUrl:            chrome.runtime.getURL('icons/icon-48.png'),
    title:              '🔄 RA Miner — Atualização disponível',
    message:            `Versão ${update.version} pronta para instalar. Clique para ver.`,
    buttons:            [{ title: 'Ver atualização' }],
    priority:           2,
    requireInteraction: true,
  })
}

chrome.notifications.onButtonClicked.addListener((notifId, btnIdx) => {
  if (notifId === 'update-available' && btnIdx === 0) {
    chrome.runtime.openOptionsPage()
    return
  }
  if (btnIdx === 0 && notifId.startsWith('spike-')) {
    const slug = notifId.split('-')[1]
    chrome.tabs.create({ url: `https://www.reclameaqui.com.br/empresa/${slug}/` })
  }
})

/**
 * Alarmes periódicos para coleta agendada de dados.
 */
import { getConfig } from '../lib/storage.js'
import { scrapeLote } from '../lib/scraper-engine.js'
import { getWatchlist } from '../lib/storage.js'
import { checkAndNotifySpikes } from './notifications.js'

const ALARM_WATCHLIST    = 'watchlist-sync'
const ALARM_CLEANUP      = 'data-cleanup'
const ALARM_UPDATE_CHECK = 'update-check'

export async function setupAlarms() {
  const intervalHours = parseFloat(await getConfig('coleta_intervalo_horas', '4'))

  await chrome.alarms.clearAll()

  chrome.alarms.create(ALARM_WATCHLIST, {
    periodInMinutes: intervalHours * 60,
    delayInMinutes:  5,
  })

  chrome.alarms.create(ALARM_CLEANUP, {
    periodInMinutes: 24 * 60,
    delayInMinutes:  60,
  })

  chrome.alarms.create(ALARM_UPDATE_CHECK, {
    periodInMinutes: 6 * 60,
    delayInMinutes:  1,       // 1 min após instalar/recarregar
  })
}

export async function handleAlarm({ name }) {
  if (name === ALARM_WATCHLIST) {
    await _syncWatchlist()
  } else if (name === ALARM_CLEANUP) {
    await _cleanup()
  } else if (name === ALARM_UPDATE_CHECK) {
    await _checkUpdate()
  }
}

async function _syncWatchlist() {
  const watchlist = await getWatchlist()
  if (!watchlist.length) return

  const slugs = watchlist.map(w => w.empresa?.slug).filter(Boolean)
  const results = await scrapeLote(slugs, {
    onProgress: (done, total) => {
      console.log(`[RA Miner] Watchlist sync: ${done}/${total}`)
    },
  })

  await checkAndNotifySpikes(results)
}

async function _cleanup() {
  const { clearOldData } = await import('../lib/storage.js')
  const diasRetencao = parseInt(await getConfig('dias_retencao', '90'), 10)
  await clearOldData(diasRetencao)
}

async function _checkUpdate() {
  const { checkForUpdate }       = await import('../lib/updater.js')
  const { notifyUpdateAvailable } = await import('./notifications.js')
  const update = await checkForUpdate()
  if (update) await notifyUpdateAvailable(update)
}

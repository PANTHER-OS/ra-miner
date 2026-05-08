/**
 * Roteador central de mensagens entre contextos da extensão.
 * Mensagens usam o formato: { type: 'ACAO', payload: {...} }
 */
import { scrapeEmpresa } from '../lib/scraper-engine.js'
import {
  listEmpresas, getEmpresa, getReclamacoes, getSnapshots,
  addToWatchlist, removeFromWatchlist, isInWatchlist, getWatchlist,
  getConfig, setConfig, exportAll, clearOldData,
} from '../lib/storage.js'
import { calcHeatScore } from '../lib/scoring.js'
import { detectSpike, extractKeywords, detectPatterns, estimateSalesVolume } from '../lib/analyzer.js'
import { detectOffers } from '../lib/offer-detector.js'
import { syncWithPanther } from '../lib/sync-panther.js'
import { setupAlarms } from './alarms.js'
import { checkForUpdate, getUpdateInfo, dismissUpdate, downloadUpdate } from '../lib/updater.js'
import { notifyUpdateAvailable } from './notifications.js'

const HANDLERS = {

  // --- Scraping ---
  SCRAPE_EMPRESA: async ({ slug }) => scrapeEmpresa(slug),

  SCRAPE_LOTE: async ({ slugs }) => {
    const { scrapeLote } = await import('../lib/scraper-engine.js')
    return scrapeLote(slugs)
  },

  // --- Consultas ---
  LIST_EMPRESAS: async (payload) => listEmpresas(payload),

  GET_EMPRESA: async ({ slug }) => getEmpresa(slug),

  GET_RECLAMACOES: async ({ empresaId, days }) => getReclamacoes(empresaId, { days }),

  GET_SNAPSHOTS: async ({ empresaId }) => getSnapshots(empresaId),

  GET_ANALYSIS: async ({ empresaId, slug }) => {
    const empresa      = slug ? await getEmpresa(slug) : { id: empresaId }
    const reclamacoes  = await getReclamacoes(empresa.id, { days: 60 })
    const snapshots    = await getSnapshots(empresa.id)
    const heatScore    = calcHeatScore(empresa, reclamacoes)
    const spike        = detectSpike(reclamacoes)
    const keywords     = extractKeywords(reclamacoes)
    const patterns     = detectPatterns(reclamacoes)
    const salesEst     = estimateSalesVolume(empresa.total_reclamacoes || 0)
    const offers       = detectOffers(reclamacoes, { topN: 8 })
    return { empresa, heatScore, spike, keywords, patterns, salesEst, snapshots, offers }
  },

  // --- Watchlist ---
  ADD_WATCHLIST:    async ({ empresaId }) => addToWatchlist(empresaId),
  REMOVE_WATCHLIST: async ({ empresaId }) => removeFromWatchlist(empresaId),
  IS_WATCHLIST:     async ({ empresaId }) => isInWatchlist(empresaId),
  GET_WATCHLIST:    async () => getWatchlist(),

  // --- Config ---
  GET_CONFIG: async ({ chave, fallback }) => getConfig(chave, fallback),
  SET_CONFIG: async ({ chave, valor })    => setConfig(chave, valor),

  // --- Dashboard ---
  OPEN_DASHBOARD: async () => {
    const url = chrome.runtime.getURL('src/dashboard/dashboard.html')
    const tabs = await chrome.tabs.query({ url })
    if (tabs.length) {
      await chrome.tabs.update(tabs[0].id, { active: true })
      await chrome.windows.update(tabs[0].windowId, { focused: true })
    } else {
      await chrome.tabs.create({ url })
    }
    return { ok: true }
  },

  // --- Panther OS ---
  SYNC_PANTHER: async () => {
    const empresas = await listEmpresas({ minScore: 40, limit: 100 })
    return syncWithPanther(empresas)
  },

  // --- Manutenção ---
  EXPORT_ALL:   async () => exportAll(),
  CLEAR_DATA:   async ({ dias }) => clearOldData(dias),
  SETUP_ALARMS: async () => setupAlarms(),

  // --- Auto-update ---
  CHECK_UPDATE: async () => {
    const update = await checkForUpdate()
    if (update) await notifyUpdateAvailable(update)
    return update
  },
  GET_UPDATE_INFO:  async () => getUpdateInfo(),
  DISMISS_UPDATE:   async () => dismissUpdate(),
  DOWNLOAD_UPDATE:  async ({ downloadUrl }) => downloadUpdate(downloadUrl),

  // Injeta um update falso no storage para testar o fluxo completo
  SIMULATE_UPDATE: async () => {
    const current = chrome.runtime.getManifest().version
    const [major, minor, patch] = current.split('.').map(Number)
    const fakeVersion = `${major}.${minor + 1}.0`
    const fake = {
      version:      fakeVersion,
      releaseDate:  new Date().toISOString().split('T')[0],
      notes:        `- Melhoria de desempenho\n- Novos nichos detectados\n- Correções de bugs`,
      downloadUrl:  '',
      changelogUrl: '',
      checkedAt:    Date.now(),
      _simulated:   true,
    }
    await chrome.storage.local.set({ update_available: fake })
    await notifyUpdateAvailable(fake)
    return fake
  },
}

export async function routeMessage({ type, payload = {} }, sender) {
  const handler = HANDLERS[type]
  if (!handler) return { ok: false, error: `Tipo desconhecido: ${type}` }
  try {
    const result = await handler(payload, sender)
    return { ok: true, data: result }
  } catch (err) {
    console.error(`[RA Miner] Erro em ${type}:`, err)
    return { ok: false, error: err.message }
  }
}

// Helper usado pelas UIs para enviar mensagens ao background
export function send(type, payload = {}) {
  return chrome.runtime.sendMessage({ type, payload })
}

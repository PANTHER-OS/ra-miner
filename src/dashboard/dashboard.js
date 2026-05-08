import { renderRadar }     from './views/view-radar.js'
import { renderTrending }  from './views/view-trending.js'
import { renderNichos }    from './views/view-nichos.js'
import { renderWatchlist } from './views/view-watchlist.js'
import { renderComparador } from './views/view-comparador.js'
import { renderHistorico } from './views/view-historico.js'
import { exportCSV, exportJSON, exportPDF, copyToClipboard, empresasToRows } from '../lib/exporter.js'
import { syncWithPanther } from '../lib/sync-panther.js'

const $ = (id) => document.getElementById(id)

async function send(type, payload = {}) {
  return chrome.runtime.sendMessage({ type, payload })
}

// --- Roteamento de views ---
const VIEWS = {
  radar:      { title: 'Radar de Ofertas',    subtitle: 'Top 50 empresas com maior Heat Score',    render: renderRadar      },
  trending:   { title: 'Trending',            subtitle: 'Subindo rápido nas últimas 24h e 7 dias', render: renderTrending   },
  nichos:     { title: 'Análise por Nicho',   subtitle: 'Distribuição de calor por categoria',     render: renderNichos     },
  watchlist:  { title: 'Watchlist',           subtitle: 'Empresas que você monitora',              render: renderWatchlist  },
  comparador: { title: 'Comparador',          subtitle: 'Compare até 5 empresas lado a lado',      render: renderComparador },
  historico:  { title: 'Histórico',           subtitle: 'Snapshots e evolução temporal',           render: renderHistorico  },
}

let currentView     = 'radar'
let empresasCache   = []

async function navigateTo(viewId) {
  if (!VIEWS[viewId]) return

  // Atualiza nav
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.view === viewId)
  })

  // Troca view visível
  document.querySelectorAll('.view').forEach(el => {
    el.classList.toggle('active', el.id === `view-${viewId}`)
    el.classList.toggle('hidden', el.id !== `view-${viewId}`)
  })

  const { title, subtitle, render } = VIEWS[viewId]
  $('view-title').textContent    = title
  $('view-subtitle').textContent = subtitle
  currentView = viewId

  const container = $(`view-${viewId}`)
  container.innerHTML = '<div class="view-loading"><div class="spinner"></div></div>'

  try {
    await render(container, { send, empresasCache, refreshEmpresas })
  } catch (err) {
    container.innerHTML = `<div class="view-error">Erro ao carregar: ${err.message}</div>`
    console.error(err)
  }
}

async function refreshEmpresas() {
  const res = await send('LIST_EMPRESAS', { minScore: 0, limit: 200, orderBy: 'heat_score' })
  empresasCache = res?.data || []
  return empresasCache
}

// --- Exportação ---
async function handleExport(format) {
  const res  = await send('LIST_EMPRESAS', { minScore: 0, limit: 500 })
  const rows = empresasToRows(res?.data || [])
  const name = `ra-miner-${new Date().toISOString().split('T')[0]}`

  if (format === 'csv')  exportCSV(rows,  `${name}.csv`)
  if (format === 'json') exportJSON(res?.data, `${name}.json`)
  if (format === 'pdf')  await exportPDF(rows.slice(0, 100), { title: 'RA Miner — Radar', filename: `${name}.pdf` })
  if (format === 'copy') {
    const n = await copyToClipboard(rows)
    showToast(`${n} linhas copiadas!`)
  }
  closeModal()
}

// --- Toast ---
function showToast(msg, type = 'info') {
  const t = document.createElement('div')
  t.className  = `toast toast--${type}`
  t.textContent = msg
  document.body.appendChild(t)
  setTimeout(() => t.remove(), 3000)
}

// --- Modal ---
function openModal()  { $('export-modal').classList.remove('hidden') }
function closeModal() { $('export-modal').classList.add('hidden') }

// --- Eventos ---
document.querySelectorAll('.nav-item[data-view]').forEach(el => {
  el.addEventListener('click', (e) => {
    e.preventDefault()
    navigateTo(el.dataset.view)
    history.pushState(null, '', `#${el.dataset.view}`)
  })
})

$('btn-export').addEventListener('click', openModal)
$('modal-close').addEventListener('click', closeModal)
$('export-modal').addEventListener('click', (e) => {
  if (e.target === $('export-modal')) closeModal()
})

document.querySelectorAll('[data-format]').forEach(btn => {
  btn.addEventListener('click', () => handleExport(btn.dataset.format))
})

$('btn-sync-panther').addEventListener('click', async () => {
  const btn = $('btn-sync-panther')
  btn.disabled    = true
  btn.textContent = '⏳ Sincronizando...'
  const res = await send('SYNC_PANTHER')
  btn.disabled    = false
  btn.textContent = 'Sync Panther'
  showToast(res?.data?.ok ? '✓ Sincronizado com Panther OS' : '✗ Falha na sincronização', res?.data?.ok ? 'success' : 'error')
})

// --- Init ---
async function init() {
  await refreshEmpresas()
  const hash = location.hash.replace('#', '') || 'radar'
  await navigateTo(VIEWS[hash] ? hash : 'radar')
}

window.addEventListener('popstate', () => {
  const hash = location.hash.replace('#', '') || 'radar'
  navigateTo(VIEWS[hash] ? hash : 'radar')
})

init().catch(console.error)

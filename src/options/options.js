import { getConfig, setConfig, exportAll, clearOldData } from '../lib/storage.js'
import { testPantherConnection } from '../lib/sync-panther.js'
import { exportJSON } from '../lib/exporter.js'
import { setupAlarms } from '../background/alarms.js'

const $ = (id) => document.getElementById(id)

const CONFIG_KEYS = [
  'coleta_intervalo_horas', 'paginas_por_scrape', 'scraping_automatico',
  'w_velocity', 'w_acceleration', 'w_recency', 'w_freshness', 'w_engagement',
  'notificacoes_ativas', 'threshold_notificacao', 'digest_diario',
  'panther_endpoint', 'panther_token',
  'dias_retencao', 'overlay_badges', 'tema',
  'update_check_url',
]

const DEFAULTS = {
  coleta_intervalo_horas: '4',
  paginas_por_scrape:     '3',
  scraping_automatico:    true,
  w_velocity:             35,
  w_acceleration:         30,
  w_recency:              20,
  w_freshness:            10,
  w_engagement:           5,
  notificacoes_ativas:    true,
  threshold_notificacao:  60,
  digest_diario:          false,
  panther_endpoint:       '',
  panther_token:          '',
  dias_retencao:          '90',
  overlay_badges:         true,
  tema:                   'dark',
  update_check_url: 'https://raw.githubusercontent.com/PANTHER-OS/ra-miner/main/version.json',
}

// --- Tabs ---
document.querySelectorAll('.opts-nav__item').forEach(item => {
  item.addEventListener('click', (e) => {
    e.preventDefault()
    const tab = item.dataset.tab
    document.querySelectorAll('.opts-nav__item').forEach(i => i.classList.remove('active'))
    document.querySelectorAll('.opts-tab').forEach(t => { t.classList.add('hidden'); t.classList.remove('active') })
    item.classList.add('active')
    const section = $(`tab-${tab}`)
    section.classList.remove('hidden')
    section.classList.add('active')
  })
})

// --- Pesos de scoring ---
document.querySelectorAll('.weight-slider').forEach(slider => {
  slider.addEventListener('input', () => {
    $(`${slider.id}_val`).textContent = `${slider.value}%`
    updateWeightsSum()
  })
})

function updateWeightsSum() {
  const sliders = document.querySelectorAll('.weight-slider')
  const sum     = [...sliders].reduce((s, sl) => s + parseInt(sl.value), 0)
  $('weights-sum').textContent = sum
  const warn = $('weights-warning')
  if (sum !== 100) warn.classList.remove('hidden')
  else             warn.classList.add('hidden')
}

$('btn-reset-weights')?.addEventListener('click', () => {
  ;[['w_velocity', 35], ['w_acceleration', 30], ['w_recency', 20], ['w_freshness', 10], ['w_engagement', 5]]
    .forEach(([id, val]) => {
      $(id).value                   = val
      $(`${id}_val`).textContent    = `${val}%`
    })
  updateWeightsSum()
})

// --- Threshold slider ---
$('threshold_notificacao')?.addEventListener('input', () => {
  $('threshold_val').textContent = $('threshold_notificacao').value
})

// --- Panther test ---
$('btn-test-panther')?.addEventListener('click', async () => {
  const btn    = $('btn-test-panther')
  const result = $('panther-test-result')
  btn.disabled     = true
  result.textContent = '⏳ Testando...'
  const res = await testPantherConnection()
  btn.disabled = false
  result.textContent  = res.ok ? '✓ Conectado com sucesso' : `✗ Falha: ${res.reason}`
  result.style.color  = res.ok ? 'var(--c-green)' : 'var(--c-red)'
})

// --- Exportar backup ---
$('btn-export-backup')?.addEventListener('click', async () => {
  const data = await chrome.runtime.sendMessage({ type: 'EXPORT_ALL' })
  exportJSON(data?.data, `ra-miner-backup-${new Date().toISOString().split('T')[0]}.json`)
})

$('btn-clear-recl')?.addEventListener('click', async () => {
  if (!confirm('Limpar reclamações antigas (mantém últimos 30 dias)?')) return
  await chrome.runtime.sendMessage({ type: 'CLEAR_DATA', payload: { dias: 30 } })
  showToast('Dados antigos removidos.')
})

$('btn-clear-all')?.addEventListener('click', async () => {
  if (!confirm('⚠️ APAGAR TODOS os dados do RA Miner? Isto é irreversível.')) return
  if (!confirm('Tem certeza absoluta?')) return
  const db = (await import('../lib/storage.js')).default
  await db.delete()
  showToast('Todos os dados foram apagados.', 'error')
  setTimeout(() => location.reload(), 1500)
})

// --- Load config ---
async function loadConfig() {
  for (const key of CONFIG_KEYS) {
    const val = await getConfig(key, DEFAULTS[key])
    const el  = $(key)
    if (!el) continue
    if (el.type === 'checkbox') el.checked = val === true || val === 'true'
    else if (el.type === 'radio') {
      document.querySelectorAll(`input[name="${key}"]`).forEach(r => { r.checked = r.value === val })
    } else {
      el.value = val
      // Atualiza display dos sliders
      const display = $(`${key}_val`)
      if (display) display.textContent = `${val}%`
    }
  }
  $('threshold_val').textContent = await getConfig('threshold_notificacao', 60)
  updateWeightsSum()
}

// --- Save config ---
$('btn-save').addEventListener('click', async () => {
  for (const key of CONFIG_KEYS) {
    const el = $(key)
    if (!el) {
      const radio = document.querySelector(`input[name="${key}"]:checked`)
      if (radio) await setConfig(key, radio.value)
      continue
    }
    const val = el.type === 'checkbox' ? el.checked : el.value
    await setConfig(key, val)
  }

  // Reconfigura alarmes com novo intervalo
  await chrome.runtime.sendMessage({ type: 'SETUP_ALARMS' })

  showToast('✓ Configurações salvas')
})

function showToast(msg, type = 'success') {
  const t     = $('toast-saved')
  t.textContent = msg
  t.className   = `opts-toast opts-toast--${type}`
  t.classList.remove('hidden')
  setTimeout(() => t.classList.add('hidden'), 2500)
}

// ---------- Aba Atualizações ----------
async function initUpdateTab() {
  const manifest = chrome.runtime.getManifest()
  $('update-current-version').textContent = `v${manifest.version}`

  // Mostra info de update pendente se houver
  await _refreshUpdateStatus()

  // Mostra aviso se URL não configurada
  const urlInput = $('update_check_url')
  function _checkUrlHint() {
    const hint = $('update-url-hint')
    if (!hint) return
    if (!urlInput?.value?.trim()) hint.classList.remove('hidden')
    else                          hint.classList.add('hidden')
  }
  urlInput?.addEventListener('input', _checkUrlHint)
  _checkUrlHint()

  // Simular atualização disponível
  $('btn-simulate-upd').addEventListener('click', async () => {
    const btn = $('btn-simulate-upd')
    btn.disabled    = true
    btn.textContent = '⏳ Simulando...'
    await chrome.runtime.sendMessage({ type: 'SIMULATE_UPDATE' })
    await _refreshUpdateStatus()
    btn.disabled    = false
    btn.textContent = '🧪 Simular atualização'
    $('update-check-msg').textContent = '✓ Simulação ativa! Feche e abra o popup para ver o banner.'
    $('update-check-msg').style.color = 'var(--c-green)'
  })

  // Verificar agora
  $('btn-check-update').addEventListener('click', async () => {
    const btn = $('btn-check-update')
    btn.disabled    = true
    btn.textContent = '⏳ Verificando...'
    $('update-check-msg').textContent = ''

    const res = await chrome.runtime.sendMessage({ type: 'CHECK_UPDATE' })
    btn.disabled    = false
    btn.textContent = '🔍 Verificar agora'

    if (res?.data) {
      await _refreshUpdateStatus()
      $('update-check-msg').textContent = ''
    } else {
      $('update-check-msg').textContent = '✓ Você já está na versão mais recente.'
      $('update-check-msg').style.color = 'var(--c-green)'
    }
  })

  // Baixar e instalar
  $('btn-do-update').addEventListener('click', async () => {
    const res = await chrome.runtime.sendMessage({ type: 'GET_UPDATE_INFO' })
    const update = res?.data
    if (!update?.downloadUrl) {
      alert('Nenhuma URL de download configurada no version.json')
      return
    }
    $('btn-do-update').textContent = '⏳ Baixando...'
    $('btn-do-update').disabled    = true

    const dl = await chrome.runtime.sendMessage({
      type: 'DOWNLOAD_UPDATE',
      payload: { downloadUrl: update.downloadUrl },
    })

    if (dl?.ok) {
      $('update-install-guide').classList.remove('hidden')
      $('btn-do-update').classList.add('hidden')
      $('btn-dismiss-upd').classList.add('hidden')
    } else {
      alert('Erro ao baixar: ' + (dl?.error || 'desconhecido'))
      $('btn-do-update').textContent = '⬇ Baixar e instalar'
      $('btn-do-update').disabled    = false
    }
  })

  // Dispensar
  $('btn-dismiss-upd').addEventListener('click', async () => {
    await chrome.runtime.sendMessage({ type: 'DISMISS_UPDATE' })
    $('update-new-row').style.display  = 'none'
    $('update-notes-box').classList.add('hidden')
    $('btn-do-update').classList.add('hidden')
    $('btn-dismiss-upd').classList.add('hidden')
    $('update-status-text').textContent  = 'Atualização dispensada'
    $('update-status-text').style.color  = ''
    $('update-check-msg').textContent    = ''
  })

  // Link para chrome://extensions no guia
  $('link-ext-page')?.addEventListener('click', (e) => {
    e.preventDefault()
    chrome.tabs.create({ url: 'chrome://extensions' })
  })
}

async function _refreshUpdateStatus() {
  const res    = await chrome.runtime.sendMessage({ type: 'GET_UPDATE_INFO' })
  const update = res?.data

  if (!update) return

  $('update-new-row').style.display    = 'flex'
  $('update-new-version').textContent  = `v${update.version}`
  $('update-status-text').textContent  = '🟠 Nova versão disponível!'
  $('update-status-text').style.color  = 'var(--c-accent)'
  $('btn-do-update').classList.remove('hidden')
  $('btn-dismiss-upd').classList.remove('hidden')

  if (update.notes) {
    $('update-notes-text').textContent = update.notes
    $('update-notes-box').classList.remove('hidden')
  }
}
// --------------------------------------

loadConfig()
initUpdateTab().catch(console.error)

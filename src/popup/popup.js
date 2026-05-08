import { getHeatTag } from '../lib/scoring.js'
import { formatRelative, truncate } from '../lib/utils.js'

const $ = (sel) => document.querySelector(sel)

async function send(type, payload = {}) {
  return chrome.runtime.sendMessage({ type, payload })
}

// ---------- Update banner ----------
async function initUpdateBanner() {
  const res = await send('GET_UPDATE_INFO')
  const update = res?.data
  if (!update) return

  const banner = $('#update-banner')
  $('#update-banner-version').textContent = `Versão ${update.version} disponível!`
  banner.classList.remove('hidden')

  $('#btn-update-now').addEventListener('click', async () => {
    $('#btn-update-now').textContent = '⏳ Baixando...'
    $('#btn-update-now').disabled = true
    const dl = await send('DOWNLOAD_UPDATE', { downloadUrl: update.downloadUrl })
    if (dl?.ok) {
      _showUpdateGuide(update)
    } else {
      alert('Erro ao baixar: ' + (dl?.error || 'tente manualmente'))
      $('#btn-update-now').textContent = 'Atualizar'
      $('#btn-update-now').disabled = false
    }
  })

  $('#btn-update-dismiss').addEventListener('click', async () => {
    await send('DISMISS_UPDATE')
    banner.classList.add('hidden')
  })
}

function _showUpdateGuide(update) {
  const banner = $('#update-banner')
  banner.innerHTML = `
    <div class="update-guide">
      <strong>✅ Download concluído!</strong>
      <p class="update-guide__sub">Arquivo: <code>ra-miner-update.zip</code> na pasta Downloads</p>
      <ol class="update-guide__steps">
        <li>Extraia o ZIP e substitua a pasta <code>dist/</code> da extensão</li>
        <li><a id="link-extensions" href="#" class="update-link">Clique aqui → chrome://extensions</a></li>
        <li>Pressione o ícone <strong>↺</strong> ao lado do RA Miner</li>
      </ol>
      ${update.changelogUrl ? `<a href="${update.changelogUrl}" target="_blank" class="update-changelog">Ver changelog ↗</a>` : ''}
    </div>
  `
  document.getElementById('link-extensions')?.addEventListener('click', (e) => {
    e.preventDefault()
    chrome.tabs.create({ url: 'chrome://extensions' })
  })
}
// -----------------------------------

async function init() {
  const [listRes, watchRes] = await Promise.all([
    send('LIST_EMPRESAS', { minScore: 0, limit: 50, orderBy: 'heat_score' }),
    send('GET_WATCHLIST'),
  ])

  const empresas  = listRes?.data || []
  const watchlist = new Set((watchRes?.data || []).map(w => w.empresa_id))

  // Stats
  const quentes = empresas.filter(e => (e.heat_score || 0) >= 60).length
  const spikes  = empresas.filter(e => {
    const age = Date.now() - (e.ultimo_scrape || 0)
    return (e.heat_score || 0) >= 70 && age < 86_400_000
  }).length

  $('#stat-total').textContent  = empresas.length
  $('#stat-quentes').textContent = quentes
  $('#stat-spikes').textContent  = spikes

  const top10 = empresas.slice(0, 10)
  $('#loading').classList.add('hidden')

  if (!top10.length) {
    $('#empty').classList.remove('hidden')
    return
  }

  const list = $('#list')
  list.classList.remove('hidden')

  for (const e of top10) {
    const { emoji, tag, css } = getHeatTag(e.heat_score || 0)
    const li = document.createElement('li')
    li.className = 'empresa-item'
    li.innerHTML = `
      <div class="empresa-item__score">
        <span class="score-num">${e.heat_score || 0}</span>
        <span class="score-label">score</span>
      </div>
      <div class="empresa-item__info">
        <div class="empresa-item__nome">${truncate(e.nome, 28)}</div>
        <div class="empresa-item__meta">
          <span class="tag ${css}">${emoji} ${tag}</span>
          <span class="text-muted">${formatRelative(e.ultimo_scrape)}</span>
        </div>
      </div>
      <button class="btn btn-ghost btn-icon empresa-item__action" data-slug="${e.slug}" title="Abrir no RA">↗</button>
    `
    list.appendChild(li)
  }

  list.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-slug]')
    if (btn) {
      const slug = btn.dataset.slug
      chrome.tabs.create({ url: `https://www.reclameaqui.com.br/${slug}/` })
    }
  })
}

$('#btn-dashboard').addEventListener('click', () => {
  send('OPEN_DASHBOARD')
  window.close()
})

$('#btn-sidepanel').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  chrome.sidePanel.open({ windowId: tab.windowId })
  window.close()
})

$('#btn-options').addEventListener('click', () => {
  chrome.runtime.openOptionsPage()
  window.close()
})

init().catch(console.error)
initUpdateBanner().catch(console.error)

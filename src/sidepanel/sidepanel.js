import { Chart } from 'chart.js/auto'
import { getHeatTag, calcVelocity, calcAcceleration } from '../lib/scoring.js'
import { getNichoInfo } from '../lib/niche-classifier.js'
import { groupByPeriod } from '../lib/analyzer.js'
import { formatNumber } from '../lib/utils.js'

const $ = (id) => document.getElementById(id)
let currentSlug   = null
let isInWatchlist = false
let sparkChart    = null

async function send(type, payload = {}) {
  return chrome.runtime.sendMessage({ type, payload })
}

// ---------- Update banner ----------
let _updateBannerInit = false
async function initUpdateBanner() {
  if (_updateBannerInit) return
  _updateBannerInit = true
  const res    = await send('GET_UPDATE_INFO')
  const update = res?.data
  if (!update) return

  $('update-banner-version').textContent = `Versão ${update.version} disponível!`
  $('update-banner').classList.remove('hidden')

  $('btn-update-now').addEventListener('click', async () => {
    $('btn-update-now').textContent = '⏳ Baixando...'
    $('btn-update-now').disabled    = true
    const dl = await send('DOWNLOAD_UPDATE', { downloadUrl: update.downloadUrl })
    if (dl?.ok) {
      _showUpdateGuide(update)
    } else {
      alert('Erro ao baixar: ' + (dl?.error || 'tente manualmente'))
      $('btn-update-now').textContent = 'Atualizar'
      $('btn-update-now').disabled    = false
    }
  })

  $('btn-update-dismiss').addEventListener('click', async () => {
    await send('DISMISS_UPDATE')
    $('update-banner').classList.add('hidden')
  })
}

function _showUpdateGuide(update) {
  $('update-banner').innerHTML = `
    <div class="update-guide">
      <strong>✅ Download concluído!</strong>
      <p class="update-guide__sub">Arquivo: <code>ra-miner-update.zip</code> na pasta Downloads</p>
      <ol class="update-guide__steps">
        <li>Extraia o ZIP e substitua a pasta <code>dist/</code> da extensão</li>
        <li><a id="link-extensions" href="#" class="update-link">Clique aqui → chrome://extensions</a></li>
        <li>Clique no ícone <strong>↺</strong> ao lado do RA Miner</li>
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

async function getCurrentSlug() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (!tab?.url?.includes('reclameaqui.com.br')) return null
  try {
    const res = await chrome.tabs.sendMessage(tab.id, { type: 'GET_CURRENT_SLUG' })
    return res?.data?.slug || null
  } catch {
    // /empresa/slug → capture slug after /empresa/
    const match = tab.url.match(/reclameaqui\.com\.br\/empresa\/([a-z0-9_-]+)/i)
                  || tab.url.match(/reclameaqui\.com\.br\/([a-z0-9_-]+)/i)
    const slug = match?.[1] || null
    return (slug === 'empresa') ? null : slug
  }
}

async function loadAnalysis(slug) {
  setState('loading')
  currentSlug = slug

  try {
    const res = await send('GET_ANALYSIS', { slug })
    if (!res?.ok || !res.data) { setState('nopage'); return }

    const { empresa, heatScore, spike, keywords, patterns, salesEst, snapshots, offers } = res.data
    const watchRes = await send('IS_WATCHLIST', { empresaId: empresa.id })
    isInWatchlist  = watchRes?.data || false

    render({ empresa, heatScore, spike, keywords, patterns, salesEst, snapshots, offers })
    setState('content')
    updateWatchlistBtn()
  } catch (err) {
    console.error('[RA Miner Side Panel]', err)
    setState('nopage')
  }
}

function render({ empresa, heatScore, spike, keywords, patterns, salesEst, snapshots, offers }) {
  const { emoji, tag, css } = getHeatTag(heatScore)
  const nicho = getNichoInfo(empresa.nicho_inferido || 'outros')

  $('empresa-nome').textContent    = empresa.nome || empresa.slug
  $('empresa-segmento').textContent = empresa.segmento || ''
  $('heat-score-value').textContent = heatScore
  $('heat-score-value').style.color = getComputedStyle(document.documentElement)
    .getPropertyValue(`--c-${css.replace('tag-', '')}`) || 'var(--c-accent)'

  $('heat-tag-el').innerHTML = `<span class="tag ${css}">${emoji} ${tag}</span>`

  // Métricas
  const reclamacoes = snapshots // usamos snapshots como proxy aqui
  $('m-velocity').textContent     = '—'
  $('m-acceleration').textContent = '—'
  $('m-total').textContent        = formatNumber(empresa.total_reclamacoes)
  $('m-score-ra').textContent     = empresa.score_ra ? empresa.score_ra.toFixed(1) : '—'

  // Nicho
  $('nicho-badge').innerHTML = `<span style="font-size:18px">${nicho.emoji}</span> <strong>${nicho.label}</strong>`

  // Spike alert
  if (spike) $('spike-alert').classList.remove('hidden')
  else       $('spike-alert').classList.add('hidden')

  // Padrões
  const patList = $('patterns-list')
  patList.innerHTML = patterns.length
    ? patterns.slice(0, 5).map(p => `
        <div class="pattern-row">
          <span class="pattern-label">${p.label}</span>
          <span class="pattern-count">${p.count} <span class="text-muted">(${p.pct}%)</span></span>
          <div class="pattern-bar">
            <div class="pattern-bar__fill" style="width:${p.pct}%"></div>
          </div>
        </div>
      `).join('')
    : '<p class="text-muted" style="font-size:12px">Nenhum padrão detectado.</p>'

  // Keywords
  const cloud = $('keywords-cloud')
  cloud.innerHTML = keywords.slice(0, 14).map(k => `
    <span class="keyword" style="font-size:${Math.min(16, 10 + k.count / 2)}px">${k.word}</span>
  `).join('')

  // Ofertas problemáticas
  renderOffers(offers || [])

  // Estimativa de vendas
  $('sales-min').textContent = formatNumber(salesEst.min)
  $('sales-mid').textContent = formatNumber(salesEst.mid)
  $('sales-max').textContent = formatNumber(salesEst.max)

  // Sparkline
  renderSparkline(snapshots)
}

function renderOffers(offers) {
  const list  = $('offers-list')
  const badge = $('offers-count-badge')

  if (!offers.length) {
    $('section-offers').classList.add('hidden')
    return
  }

  $('section-offers').classList.remove('hidden')
  badge.textContent = `${offers.length} oferta${offers.length > 1 ? 's' : ''}`

  list.innerHTML = offers.map(offer => {
    const accelHtml = offer.aceleracao > 0
      ? `<span class="offer-accel offer-accel--up">▲ +${offer.aceleracao}%</span>`
      : offer.aceleracao < 0
        ? `<span class="offer-accel offer-accel--down">▼ ${offer.aceleracao}%</span>`
        : ''

    const topPadrao = offer.padroes[0]
    const padroesHtml = topPadrao
      ? `<span class="offer-pattern">${topPadrao.label} <span class="offer-pattern__pct">${topPadrao.pct}%</span></span>`
      : ''

    const kwHtml = offer.keywords.slice(0, 4)
      .map(k => `<span class="offer-kw">${k.word}</span>`)
      .join('')

    const lastDate = offer.ultimaReclamacao
      ? _relativeDate(offer.ultimaReclamacao)
      : ''

    const scoreClass = offer.score >= 70 ? 'offer-score--high'
                     : offer.score >= 40 ? 'offer-score--mid'
                     : 'offer-score--low'

    return `
      <div class="offer-card">
        <div class="offer-card__header">
          <span class="offer-card__name" title="${offer.variantes.join(' / ')}">${offer.nome}</span>
          <span class="offer-score ${scoreClass}">${offer.score}</span>
        </div>
        <div class="offer-card__meta">
          <span class="offer-count">${offer.count} recl.</span>
          <span class="offer-velocity">${offer.velocidade}/dia</span>
          ${accelHtml}
          ${lastDate ? `<span class="offer-date text-muted">${lastDate}</span>` : ''}
        </div>
        ${padroesHtml || kwHtml ? `
        <div class="offer-card__tags">
          ${padroesHtml}
          ${kwHtml}
        </div>` : ''}
      </div>
    `
  }).join('')
}

function _relativeDate(iso) {
  const diff = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diff / 86_400_000)
  if (days === 0) return 'hoje'
  if (days === 1) return 'ontem'
  if (days < 30)  return `${days}d atrás`
  if (days < 365) return `${Math.floor(days / 30)}m atrás`
  return `${Math.floor(days / 365)}a atrás`
}

function renderSparkline(snapshots) {
  const canvas = $('chart-sparkline')
  if (!canvas) return
  if (sparkChart) { sparkChart.destroy(); sparkChart = null }

  const days    = 30
  const data    = Array.from({ length: days }, (_, i) => {
    const day = new Date()
    day.setDate(day.getDate() - (days - 1 - i))
    const dayStr = day.toISOString().split('T')[0]
    const snap   = snapshots?.find(s => new Date(s.timestamp).toISOString().split('T')[0] === dayStr)
    return snap?.velocity_7d || 0
  })

  const labels = Array.from({ length: days }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (days - 1 - i))
    return i % 5 === 0 ? `${d.getDate()}/${d.getMonth() + 1}` : ''
  })

  sparkChart = new Chart(canvas, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        data,
        fill:        true,
        tension:     0.4,
        borderColor: '#ff7b00',
        backgroundColor: 'rgba(255,123,0,0.12)',
        borderWidth: 2,
        pointRadius: 0,
      }],
    },
    options: {
      responsive: true,
      plugins:    { legend: { display: false }, tooltip: { enabled: false } },
      scales: {
        x: { display: false },
        y: { display: false, beginAtZero: true },
      },
      animation: false,
    },
  })
}

function updateWatchlistBtn() {
  const btn = $('btn-watchlist')
  btn.textContent = isInWatchlist ? '★' : '☆'
  btn.title       = isInWatchlist ? 'Remover da Watchlist' : 'Adicionar à Watchlist'
  btn.style.color = isInWatchlist ? 'var(--c-yellow)' : ''
}

function setState(s) {
  $('state-loading').classList.toggle('hidden', s !== 'loading')
  $('state-nopage').classList.toggle('hidden',  s !== 'nopage')
  $('content').classList.toggle('hidden',        s !== 'content')
}

// Watchlist toggle
$('btn-watchlist').addEventListener('click', async () => {
  if (!currentSlug) return
  const empresa = (await send('GET_EMPRESA', { slug: currentSlug }))?.data
  if (!empresa) return
  if (isInWatchlist) {
    await send('REMOVE_WATCHLIST', { empresaId: empresa.id })
    isInWatchlist = false
  } else {
    await send('ADD_WATCHLIST', { empresaId: empresa.id })
    isInWatchlist = true
  }
  updateWatchlistBtn()
})

$('btn-refresh').addEventListener('click', () => {
  if (currentSlug) loadAnalysis(currentSlug)
})

$('btn-dashboard').addEventListener('click', () => {
  send('OPEN_DASHBOARD')
})

// Recarrega ao navegar de aba
chrome.tabs.onActivated.addListener(() => init())
chrome.tabs.onUpdated.addListener((_, info) => {
  if (info.status === 'complete') init()
})

async function init() {
  initUpdateBanner().catch(() => {})
  const slug = await getCurrentSlug()
  if (!slug) { setState('nopage'); return }
  if (slug === currentSlug) return
  await loadAnalysis(slug)
}

init()

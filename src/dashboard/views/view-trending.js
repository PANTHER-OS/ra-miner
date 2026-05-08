import { Chart } from 'chart.js/auto'
import { getHeatTag } from '../../lib/scoring.js'
import { formatNumber, formatRelative } from '../../lib/utils.js'

export async function renderTrending(container, { refreshEmpresas }) {
  const all = await refreshEmpresas()
  const now = Date.now()
  const DAY = 86_400_000

  // Empresas "novas" (apareceram nos últimos 7 dias)
  const novatas = all.filter(e => e.primeiro_visto && (now - e.primeiro_visto) <= 7 * DAY)
    .sort((a, b) => (b.heat_score || 0) - (a.heat_score || 0))

  // Empresas com maior heat score nas últimas 24h (por ultimo_scrape recente)
  const recentes24h = all.filter(e => e.ultimo_scrape && (now - e.ultimo_scrape) <= DAY)
    .sort((a, b) => (b.heat_score || 0) - (a.heat_score || 0))
    .slice(0, 20)

  // Top 20 geral
  const top20 = all.slice(0, 20)

  container.innerHTML = `
    <div class="trending-grid">
      <div class="trending-section">
        <h3 class="trending-section__title">⚡ Explodiram hoje <span class="count-badge">${recentes24h.length}</span></h3>
        <div class="trending-list" id="list-24h"></div>
      </div>
      <div class="trending-section">
        <h3 class="trending-section__title">🆕 Novas (últimos 7 dias) <span class="count-badge">${novatas.length}</span></h3>
        <div class="trending-list" id="list-novatas"></div>
      </div>
    </div>

    <div style="margin-top:var(--sp-6)">
      <h3 class="trending-section__title">📊 Top 20 Heat Score — gráfico</h3>
      <div style="height:320px;margin-top:var(--sp-4)">
        <canvas id="chart-trending"></canvas>
      </div>
    </div>
  `

  _renderList('list-24h',    recentes24h.slice(0, 10))
  _renderList('list-novatas', novatas.slice(0, 10))
  _renderChart(top20)
}

function _renderList(id, empresas) {
  const el = document.getElementById(id)
  if (!empresas.length) {
    el.innerHTML = '<p class="text-muted" style="font-size:13px;padding:12px 0">Nenhuma empresa encontrada.</p>'
    return
  }
  el.innerHTML = empresas.map(e => {
    const { emoji, tag, css } = getHeatTag(e.heat_score || 0)
    return `
      <div class="trending-item">
        <div class="trending-item__score" style="color:${_scoreColor(e.heat_score||0)}">${e.heat_score||0}</div>
        <div class="trending-item__info">
          <div class="trending-item__nome">${e.nome || e.slug}</div>
          <span class="tag ${css}">${emoji} ${tag}</span>
        </div>
        <a href="https://www.reclameaqui.com.br/${e.slug}/" target="_blank" class="btn btn-ghost btn-icon">↗</a>
      </div>
    `
  }).join('')
}

function _renderChart(empresas) {
  const canvas = document.getElementById('chart-trending')
  if (!canvas) return

  new Chart(canvas, {
    type: 'bar',
    data: {
      labels:   empresas.map(e => e.nome?.split(' ').slice(0, 2).join(' ') || e.slug),
      datasets: [{
        label:           'Heat Score',
        data:            empresas.map(e => e.heat_score || 0),
        backgroundColor: empresas.map(e => _scoreColorAlpha(e.heat_score || 0)),
        borderColor:     empresas.map(e => _scoreColor(e.heat_score || 0)),
        borderWidth: 1,
        borderRadius: 4,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: '#888', font: { size: 11 } }, grid: { color: '#222' } },
        y: { min: 0, max: 100, ticks: { color: '#888' }, grid: { color: '#222' } },
      },
    },
  })
}

function _scoreColor(score) {
  if (score >= 85) return '#ff3d3d'
  if (score >= 65) return '#ff7b00'
  if (score >= 45) return '#ffd700'
  if (score >= 25) return '#74b9ff'
  return '#636e72'
}

function _scoreColorAlpha(score) {
  return _scoreColor(score).replace(')', ', 0.3)').replace('rgb', 'rgba').replace('#', '') // simplificado
}

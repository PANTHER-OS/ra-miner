import { Chart } from 'chart.js/auto'
import { listNichos, getNichoInfo } from '../../lib/niche-classifier.js'
import { formatNumber } from '../../lib/utils.js'

export async function renderNichos(container, { refreshEmpresas }) {
  const all = await refreshEmpresas()

  // Agrupa por nicho
  const byNicho = {}
  for (const e of all) {
    const id = e.nicho_inferido || 'outros'
    if (!byNicho[id]) byNicho[id] = []
    byNicho[id].push(e)
  }

  // Estatísticas por nicho
  const nichoStats = Object.entries(byNicho).map(([id, empresas]) => {
    const avgScore = empresas.reduce((s, e) => s + (e.heat_score || 0), 0) / empresas.length
    const info     = getNichoInfo(id)
    return {
      id,
      ...info,
      count:     empresas.length,
      avgScore:  Math.round(avgScore),
      top:       empresas.slice(0, 3),
      totalRecl: empresas.reduce((s, e) => s + (e.total_reclamacoes || 0), 0),
    }
  }).sort((a, b) => b.avgScore - a.avgScore)

  container.innerHTML = `
    <div class="nichos-layout">
      <div class="nichos-chart-wrap">
        <canvas id="chart-nichos" height="300"></canvas>
      </div>
      <div id="nichos-cards" class="nichos-cards"></div>
    </div>
  `

  // Doughnut chart
  const canvas = document.getElementById('chart-nichos')
  new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels:   nichoStats.map(n => `${n.emoji} ${n.label}`),
      datasets: [{
        data:            nichoStats.map(n => n.count),
        backgroundColor: [
          '#ff7b00','#ff3d3d','#ffd700','#00e676','#74b9ff',
          '#a29bfe','#fd79a8','#636e72',
        ],
        borderColor: 'var(--c-surface)',
        borderWidth: 2,
      }],
    },
    options: {
      cutout: '60%',
      plugins: {
        legend: { position: 'right', labels: { color: '#f0f0f0', font: { size: 12 } } },
      },
    },
  })

  // Cards por nicho
  document.getElementById('nichos-cards').innerHTML = nichoStats.map(n => `
    <div class="nicho-card">
      <div class="nicho-card__header">
        <span style="font-size:24px">${n.emoji}</span>
        <div>
          <div class="nicho-card__nome">${n.label}</div>
          <div class="text-muted" style="font-size:11px">${n.count} empresa${n.count !== 1 ? 's' : ''}</div>
        </div>
        <div class="nicho-card__score">
          <span style="font-size:22px;font-weight:900;color:var(--c-accent)">${n.avgScore}</span>
          <span style="font-size:10px;color:var(--c-text-muted)">avg score</span>
        </div>
      </div>
      <div class="nicho-card__top">
        ${n.top.map(e => `
          <div class="nicho-top-item">
            <span style="font-weight:600;font-size:12px">${e.nome || e.slug}</span>
            <span class="text-accent" style="font-size:11px">▸ ${e.heat_score || 0}</span>
          </div>
        `).join('')}
      </div>
      <div class="text-muted" style="font-size:11px">
        ${formatNumber(n.totalRecl)} reclamações no total
      </div>
    </div>
  `).join('')
}

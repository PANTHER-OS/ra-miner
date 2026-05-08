import { Chart } from 'chart.js/auto'
import { getHeatTag } from '../../lib/scoring.js'
import { formatNumber } from '../../lib/utils.js'

export async function renderComparador(container, { send, refreshEmpresas }) {
  const all = await refreshEmpresas()

  container.innerHTML = `
    <div class="comp-setup">
      <p class="text-muted" style="font-size:13px">Selecione até 5 empresas para comparar:</p>
      <div class="comp-selects" id="comp-selects">
        ${[0,1,2,3,4].map(i => `
          <select class="input comp-select" data-idx="${i}">
            <option value="">— Empresa ${i+1} —</option>
            ${all.slice(0, 200).map(e => `<option value="${e.slug}">${e.nome || e.slug}</option>`).join('')}
          </select>
        `).join('')}
      </div>
      <button id="btn-comparar" class="btn btn-primary">⚖️ Comparar</button>
    </div>

    <div id="comp-result" class="comp-result hidden"></div>
  `

  document.getElementById('btn-comparar').addEventListener('click', async () => {
    const slugs = [...document.querySelectorAll('.comp-select')]
      .map(s => s.value)
      .filter(Boolean)
      .slice(0, 5)

    if (slugs.length < 2) {
      alert('Selecione pelo menos 2 empresas para comparar.')
      return
    }

    const empresas = slugs.map(slug => all.find(e => e.slug === slug)).filter(Boolean)
    renderComparison(empresas)
  })
}

async function renderComparison(empresas) {
  const result = document.getElementById('comp-result')
  result.classList.remove('hidden')

  // Tabela comparativa
  const metrics = [
    { key: 'heat_score',        label: 'Heat Score',       best: 'max' },
    { key: 'total_reclamacoes', label: 'Total Reclamações', best: 'max' },
    { key: 'score_ra',          label: 'Score RA',          best: 'max' },
    { key: 'respondidas_pct',   label: '% Respondidas',     best: 'max' },
    { key: 'resolvidas_pct',    label: '% Resolvidas',      best: 'max' },
  ]

  result.innerHTML = `
    <div style="overflow-x:auto;margin-top:var(--sp-5)">
      <table class="table comp-table">
        <thead>
          <tr>
            <th>Métrica</th>
            ${empresas.map(e => `<th>${e.nome || e.slug}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="text-muted">Status</td>
            ${empresas.map(e => {
              const { emoji, tag, css } = getHeatTag(e.heat_score || 0)
              return `<td><span class="tag ${css}">${emoji} ${tag}</span></td>`
            }).join('')}
          </tr>
          ${metrics.map(m => {
            const vals = empresas.map(e => parseFloat(e[m.key]) || 0)
            const best = m.best === 'max' ? Math.max(...vals) : Math.min(...vals)
            return `
              <tr>
                <td class="text-muted">${m.label}</td>
                ${empresas.map((e, i) => {
                  const v     = parseFloat(e[m.key]) || 0
                  const isBest = v === best && v > 0
                  return `<td style="${isBest ? 'color:var(--c-green);font-weight:700' : ''}">${formatNumber(v)}</td>`
                }).join('')}
              </tr>
            `
          }).join('')}
        </tbody>
      </table>
    </div>

    <div style="height:300px;margin-top:var(--sp-6)">
      <canvas id="chart-comp"></canvas>
    </div>
  `

  // Gráfico radar
  const canvas = document.getElementById('chart-comp')
  const COLORS  = ['#ff7b00','#74b9ff','#00e676','#ffd700','#ff3d3d']

  new Chart(canvas, {
    type: 'radar',
    data: {
      labels: ['Heat Score', 'Reclamações (norm)', 'Score RA', 'Respondidas %', 'Resolvidas %'],
      datasets: empresas.map((e, i) => ({
        label:           e.nome || e.slug,
        data:            [
          e.heat_score || 0,
          Math.min(100, ((e.total_reclamacoes || 0) / 1000) * 100),
          (e.score_ra || 0) * 10,
          e.respondidas_pct || 0,
          e.resolvidas_pct  || 0,
        ],
        borderColor:     COLORS[i],
        backgroundColor: COLORS[i] + '22',
        borderWidth: 2,
        pointRadius: 4,
      })),
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        r: {
          min: 0, max: 100,
          ticks:   { color: '#555', backdropColor: 'transparent', stepSize: 20 },
          grid:    { color: '#2a2a2a' },
          pointLabels: { color: '#888', font: { size: 11 } },
        },
      },
      plugins: {
        legend: { labels: { color: '#f0f0f0' } },
      },
    },
  })
}

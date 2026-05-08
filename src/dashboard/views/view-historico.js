import { Chart } from 'chart.js/auto'
import { formatDate } from '../../lib/utils.js'

export async function renderHistorico(container, { send, refreshEmpresas }) {
  const all = await refreshEmpresas()

  container.innerHTML = `
    <div class="hist-setup">
      <select id="hist-select" class="input" style="max-width:320px">
        <option value="">Selecione uma empresa...</option>
        ${all.slice(0, 200).map(e => `<option value="${e.slug}" data-id="${e.id}">${e.nome || e.slug}</option>`).join('')}
      </select>
    </div>
    <div id="hist-content" class="hist-content"></div>
  `

  document.getElementById('hist-select').addEventListener('change', async (e) => {
    const opt       = e.target.options[e.target.selectedIndex]
    const empresaId = parseInt(opt.dataset.id)
    const slug      = e.target.value
    if (!empresaId) return

    const res = await send('GET_SNAPSHOTS', { empresaId })
    renderHistory(slug, res?.data || [])
  })
}

function renderHistory(slug, snapshots) {
  const content = document.getElementById('hist-content')
  if (!snapshots.length) {
    content.innerHTML = '<p class="text-muted" style="padding:24px 0">Nenhum snapshot histórico para esta empresa.</p>'
    return
  }

  const sorted = [...snapshots].sort((a, b) => a.timestamp - b.timestamp)

  content.innerHTML = `
    <div class="hist-stats" style="margin:var(--sp-5) 0">
      <div class="stat-card">
        <span class="stat-card__value">${snapshots.length}</span>
        <span class="stat-card__label">Snapshots</span>
      </div>
      <div class="stat-card">
        <span class="stat-card__value text-accent">${Math.max(...snapshots.map(s => s.heat_score || 0))}</span>
        <span class="stat-card__label">Pico de Heat Score</span>
      </div>
      <div class="stat-card">
        <span class="stat-card__value">${formatDate(snapshots[0]?.timestamp)}</span>
        <span class="stat-card__label">Primeiro snapshot</span>
      </div>
    </div>

    <div style="height:280px;margin-bottom:var(--sp-6)">
      <canvas id="chart-hist-score"></canvas>
    </div>

    <div style="height:180px">
      <canvas id="chart-hist-velocity"></canvas>
    </div>

    <div style="margin-top:var(--sp-6)">
      <h4 style="margin-bottom:var(--sp-3);font-size:13px;color:var(--c-text-muted)">Todos os snapshots</h4>
      <table class="table">
        <thead>
          <tr><th>Data</th><th>Heat Score</th><th>Velocity 7d</th><th>Total Recl.</th></tr>
        </thead>
        <tbody>
          ${[...sorted].reverse().slice(0, 30).map(s => `
            <tr>
              <td>${formatDate(s.timestamp)}</td>
              <td style="font-weight:700;color:var(--c-accent)">${s.heat_score || '—'}</td>
              <td>${s.velocity_7d ? s.velocity_7d.toFixed(1) : '—'}</td>
              <td>${s.total_reclamacoes?.toLocaleString('pt-BR') || '—'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `

  const labels = sorted.map(s => formatDate(s.timestamp, { day: '2-digit', month: '2-digit' }))

  new Chart(document.getElementById('chart-hist-score'), {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label:           'Heat Score',
        data:            sorted.map(s => s.heat_score || 0),
        borderColor:     '#ff7b00',
        backgroundColor: 'rgba(255,123,0,0.1)',
        fill:            true,
        tension:         0.4,
        borderWidth:     2,
        pointRadius:     3,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: '#888', maxTicksLimit: 10 }, grid: { color: '#222' } },
        y: { min: 0, max: 100, ticks: { color: '#888' }, grid: { color: '#222' } },
      },
    },
  })

  new Chart(document.getElementById('chart-hist-velocity'), {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label:           'Recl./dia (7d)',
        data:            sorted.map(s => s.velocity_7d || 0),
        backgroundColor: 'rgba(116,185,255,0.5)',
        borderColor:     '#74b9ff',
        borderWidth:     1,
        borderRadius:    2,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: '#888', maxTicksLimit: 10 }, grid: { display: false } },
        y: { ticks: { color: '#888' }, grid: { color: '#222' } },
      },
    },
  })
}

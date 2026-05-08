import { getHeatTag } from '../../lib/scoring.js'
import { getNichoInfo } from '../../lib/niche-classifier.js'
import { formatNumber, formatRelative } from '../../lib/utils.js'

export async function renderRadar(container, { send, refreshEmpresas }) {
  const empresas = await refreshEmpresas()

  container.innerHTML = `
    <div class="stats-bar">
      <div class="stat-card">
        <span class="stat-card__value">${empresas.length}</span>
        <span class="stat-card__label">Empresas analisadas</span>
      </div>
      <div class="stat-card">
        <span class="stat-card__value text-accent">${empresas.filter(e => (e.heat_score||0) >= 65).length}</span>
        <span class="stat-card__label">🔥 Escalando agora</span>
      </div>
      <div class="stat-card">
        <span class="stat-card__value text-red">${empresas.filter(e => (e.heat_score||0) >= 85).length}</span>
        <span class="stat-card__label">⚡ Explodindo</span>
      </div>
      <div class="stat-card">
        <span class="stat-card__value">${empresas.filter(e => (e.heat_score||0) >= 40).length}</span>
        <span class="stat-card__label">Oportunidades</span>
      </div>
    </div>

    <div class="radar-toolbar">
      <input id="radar-search" class="input" style="max-width:260px" placeholder="Buscar empresa...">
      <select id="radar-nicho" class="input" style="max-width:180px">
        <option value="">Todos os nichos</option>
        <option value="emagrecimento">💊 Emagrecimento</option>
        <option value="fitness">💪 Fitness</option>
        <option value="infoprodutos">📚 Infoprodutos</option>
        <option value="cosmeticos">💄 Cosméticos</option>
        <option value="apostas">🎰 Apostas</option>
        <option value="apps_saas">📱 Apps/SaaS</option>
        <option value="dropshipping">📦 Dropshipping</option>
        <option value="financeiro">💳 Financeiro</option>
      </select>
      <select id="radar-order" class="input" style="max-width:180px">
        <option value="heat_score">Heat Score</option>
        <option value="total_reclamacoes">Total Reclamações</option>
      </select>
    </div>

    <div id="radar-table-wrap" class="table-wrap">
      <table class="table" id="radar-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Empresa</th>
            <th>Heat Score</th>
            <th>Status</th>
            <th>Nicho</th>
            <th>Reclamações</th>
            <th>Score RA</th>
            <th>Atualizado</th>
            <th></th>
          </tr>
        </thead>
        <tbody id="radar-tbody"></tbody>
      </table>
    </div>
  `

  let filtered = [...empresas]

  function applyFilters() {
    const q     = document.getElementById('radar-search').value.toLowerCase()
    const nicho = document.getElementById('radar-nicho').value
    const order = document.getElementById('radar-order').value

    filtered = empresas
      .filter(e => !q     || e.nome?.toLowerCase().includes(q) || e.slug?.includes(q))
      .filter(e => !nicho || e.nicho_inferido === nicho)
      .sort((a, b) => (b[order] || 0) - (a[order] || 0))
      .slice(0, 100)

    renderTable()
  }

  function renderTable() {
    const tbody = document.getElementById('radar-tbody')
    if (!filtered.length) {
      tbody.innerHTML = `<tr><td colspan="9" class="text-muted" style="text-align:center;padding:32px">Nenhuma empresa encontrada.</td></tr>`
      return
    }

    tbody.innerHTML = filtered.map((e, i) => {
      const { emoji, tag, css } = getHeatTag(e.heat_score || 0)
      const nicho = getNichoInfo(e.nicho_inferido || 'outros')
      return `
        <tr>
          <td class="text-muted">${i + 1}</td>
          <td>
            <div style="font-weight:600">${e.nome || e.slug}</div>
            <div style="font-size:11px;color:var(--c-text-muted)">${e.slug}</div>
          </td>
          <td>
            <div style="font-size:20px;font-weight:900;color:${_scoreColor(e.heat_score||0)}">${e.heat_score || 0}</div>
          </td>
          <td><span class="tag ${css}">${emoji} ${tag}</span></td>
          <td><span title="${nicho.label}">${nicho.emoji} ${nicho.label}</span></td>
          <td>${formatNumber(e.total_reclamacoes)}</td>
          <td>${e.score_ra ? e.score_ra.toFixed(1) : '—'}</td>
          <td class="text-muted">${formatRelative(e.ultimo_scrape)}</td>
          <td>
            <a href="https://www.reclameaqui.com.br/${e.slug}/" target="_blank" class="btn btn-ghost btn-sm">↗</a>
          </td>
        </tr>
      `
    }).join('')
  }

  document.getElementById('radar-search').addEventListener('input', applyFilters)
  document.getElementById('radar-nicho').addEventListener('change', applyFilters)
  document.getElementById('radar-order').addEventListener('change', applyFilters)

  applyFilters()
}

function _scoreColor(score) {
  if (score >= 85) return 'var(--c-explodindo)'
  if (score >= 65) return 'var(--c-escalando)'
  if (score >= 45) return 'var(--c-aquecendo)'
  if (score >= 25) return 'var(--c-morno)'
  return 'var(--c-esfriando)'
}

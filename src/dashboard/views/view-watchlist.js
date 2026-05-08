import { getHeatTag } from '../../lib/scoring.js'
import { getNichoInfo } from '../../lib/niche-classifier.js'
import { formatNumber, formatRelative } from '../../lib/utils.js'

export async function renderWatchlist(container, { send, refreshEmpresas }) {
  const res = await send('GET_WATCHLIST')
  const items = res?.data || []

  if (!items.length) {
    container.innerHTML = `
      <div class="empty-state">
        <span class="icon">★</span>
        <p>Sua Watchlist está vazia.</p>
        <p class="text-muted" style="font-size:12px">
          Adicione empresas pelo painel lateral enquanto navega no Reclame Aqui.
        </p>
      </div>
    `
    return
  }

  container.innerHTML = `
    <div class="watchlist-header">
      <span class="text-muted">${items.length} empresa${items.length !== 1 ? 's' : ''} monitorada${items.length !== 1 ? 's' : ''}</span>
      <button id="btn-sync-watchlist" class="btn btn-primary btn-sm">↺ Atualizar todas</button>
    </div>

    <div id="watchlist-grid" class="watchlist-grid"></div>
  `

  function renderCards(list) {
    document.getElementById('watchlist-grid').innerHTML = list.map(item => {
      const e   = item.empresa
      if (!e) return ''
      const { emoji, tag, css } = getHeatTag(e.heat_score || 0)
      const nicho = getNichoInfo(e.nicho_inferido || 'outros')
      return `
        <div class="watchlist-card card card--hover">
          <div class="watchlist-card__top">
            <div>
              <div class="watchlist-card__nome">${e.nome || e.slug}</div>
              <div class="text-muted" style="font-size:11px">${nicho.emoji} ${nicho.label}</div>
            </div>
            <div style="text-align:center">
              <div style="font-size:32px;font-weight:900;color:var(--c-accent)">${e.heat_score || 0}</div>
              <span class="tag ${css}">${emoji} ${tag}</span>
            </div>
          </div>
          <div class="watchlist-card__metrics">
            <div><span class="text-muted">Reclamações</span><strong>${formatNumber(e.total_reclamacoes)}</strong></div>
            <div><span class="text-muted">Score RA</span><strong>${e.score_ra || '—'}</strong></div>
          </div>
          <div class="watchlist-card__footer">
            <span class="text-muted" style="font-size:11px">Atualizado ${formatRelative(e.ultimo_scrape)}</span>
            <div style="display:flex;gap:8px">
              <a href="https://www.reclameaqui.com.br/${e.slug}/" target="_blank" class="btn btn-ghost btn-sm">↗ RA</a>
              <button class="btn btn-ghost btn-sm btn-remove" data-id="${e.id}">✕</button>
            </div>
          </div>
        </div>
      `
    }).join('')

    // Botões de remover
    document.querySelectorAll('.btn-remove').forEach(btn => {
      btn.addEventListener('click', async () => {
        await send('REMOVE_WATCHLIST', { empresaId: parseInt(btn.dataset.id) })
        btn.closest('.watchlist-card').remove()
      })
    })
  }

  renderCards(items)

  document.getElementById('btn-sync-watchlist')?.addEventListener('click', async () => {
    const btn = document.getElementById('btn-sync-watchlist')
    btn.disabled    = true
    btn.textContent = '⏳ Atualizando...'
    await refreshEmpresas()
    const updated = (await send('GET_WATCHLIST'))?.data || []
    renderCards(updated)
    btn.disabled    = false
    btn.textContent = '↺ Atualizar todas'
  })
}

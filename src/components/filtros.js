import { listNichos } from '../lib/niche-classifier.js'

class FiltrosBar extends HTMLElement {
  constructor() {
    super()
    this._handlers = []
  }

  connectedCallback() {
    const nichos = listNichos()
    this.innerHTML = `
      <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
        <input type="search" class="input filter-search" placeholder="Buscar empresa..." style="max-width:220px">
        <select class="input filter-nicho" style="max-width:180px">
          <option value="">Todos os nichos</option>
          ${nichos.map(n => `<option value="${n.id}">${n.emoji} ${n.label}</option>`).join('')}
        </select>
        <select class="input filter-score" style="max-width:160px">
          <option value="0">Qualquer score</option>
          <option value="25">Score ≥ 25</option>
          <option value="45">Score ≥ 45</option>
          <option value="65">Score ≥ 65</option>
          <option value="85">Score ≥ 85</option>
        </select>
        <button class="btn btn-ghost btn-sm filter-reset">Limpar</button>
      </div>
    `

    const emit = () => {
      this.dispatchEvent(new CustomEvent('filter-change', {
        detail: {
          q:        this.querySelector('.filter-search').value,
          nicho:    this.querySelector('.filter-nicho').value,
          minScore: parseInt(this.querySelector('.filter-score').value || '0'),
        },
        bubbles: true,
      }))
    }

    this.querySelector('.filter-search').addEventListener('input',  emit)
    this.querySelector('.filter-nicho').addEventListener('change',  emit)
    this.querySelector('.filter-score').addEventListener('change',  emit)
    this.querySelector('.filter-reset').addEventListener('click', () => {
      this.querySelector('.filter-search').value = ''
      this.querySelector('.filter-nicho').value  = ''
      this.querySelector('.filter-score').value  = '0'
      emit()
    })
  }
}

customElements.define('filtros-bar', FiltrosBar)

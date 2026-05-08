import { getHeatTag } from '../lib/scoring.js'
import { getNichoInfo } from '../lib/niche-classifier.js'
import { formatNumber, formatRelative } from '../lib/utils.js'

const TEMPLATE = document.createElement('template')
TEMPLATE.innerHTML = `
  <style>
    :host { display: block; }
    .card {
      background: var(--c-surface);
      border: 1px solid var(--c-border);
      border-radius: 10px;
      padding: 16px;
      transition: border-color .15s, box-shadow .15s;
      cursor: pointer;
    }
    .card:hover { border-color: var(--c-accent); box-shadow: 0 0 20px rgba(255,123,0,.2); }
    .top { display: flex; justify-content: space-between; align-items: flex-start; }
    .nome { font-size: 14px; font-weight: 700; }
    .segmento { font-size: 11px; color: #888; margin-top: 2px; }
    .score { font-size: 32px; font-weight: 900; line-height: 1; color: var(--c-accent); }
    .meta { display: flex; align-items: center; gap: 8px; margin-top: 8px; flex-wrap: wrap; }
    .metrics { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 12px; }
    .metric { text-align: center; }
    .metric__val { font-size: 13px; font-weight: 700; }
    .metric__lbl { font-size: 10px; color: #888; }
    .tag { display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
  </style>
  <div class="card">
    <div class="top">
      <div>
        <div class="nome"></div>
        <div class="segmento"></div>
      </div>
      <div class="score"></div>
    </div>
    <div class="meta">
      <slot name="badge"></slot>
    </div>
    <div class="metrics">
      <div class="metric"><div class="metric__val" id="m-recl">—</div><div class="metric__lbl">Reclamações</div></div>
      <div class="metric"><div class="metric__val" id="m-score-ra">—</div><div class="metric__lbl">Score RA</div></div>
    </div>
  </div>
`

class EmpresaCard extends HTMLElement {
  static get observedAttributes() { return ['nome','slug','score','nicho','total','score-ra','atualizado'] }

  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
    this.shadowRoot.appendChild(TEMPLATE.content.cloneNode(true))
  }

  attributeChangedCallback() { this._render() }
  connectedCallback()        { this._render() }

  _render() {
    const score = parseInt(this.getAttribute('score') || '0')
    const { emoji, tag, css } = getHeatTag(score)

    this.shadowRoot.querySelector('.nome').textContent     = this.getAttribute('nome') || this.getAttribute('slug') || '—'
    this.shadowRoot.querySelector('.segmento').textContent = this.getAttribute('nicho') || ''
    this.shadowRoot.querySelector('.score').textContent    = score
    this.shadowRoot.querySelector('.score').style.color    = `var(--c-${css.replace('tag-','')})`
    this.shadowRoot.getElementById('m-recl').textContent   = formatNumber(parseInt(this.getAttribute('total') || '0'))
    this.shadowRoot.getElementById('m-score-ra').textContent = this.getAttribute('score-ra') || '—'
  }
}

customElements.define('empresa-card', EmpresaCard)

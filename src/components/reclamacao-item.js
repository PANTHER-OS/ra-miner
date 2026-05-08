import { formatRelative, truncate, sanitizeText } from '../lib/utils.js'

class ReclamacaoItem extends HTMLElement {
  static get observedAttributes() { return ['titulo', 'data', 'status', 'estado', 'curtidas'] }

  connectedCallback()        { this._render() }
  attributeChangedCallback() { this._render() }

  _render() {
    const titulo   = this.getAttribute('titulo')   || ''
    const data     = this.getAttribute('data')     || ''
    const status   = this.getAttribute('status')   || 'ABERTA'
    const estado   = this.getAttribute('estado')   || ''
    const curtidas = parseInt(this.getAttribute('curtidas') || '0')

    const statusColor = status === 'RESOLVIDA' ? '#00e676' : status === 'RESPONDIDA' ? '#74b9ff' : '#888'

    this.innerHTML = `
      <div style="
        padding: 10px 14px;
        border-bottom: 1px solid var(--c-border);
        display: flex;
        flex-direction: column;
        gap: 4px;
      ">
        <div style="font-size:13px;font-weight:600">${truncate(titulo, 72)}</div>
        <div style="display:flex;align-items:center;gap:10px;font-size:11px;color:#888">
          <span style="color:${statusColor};font-weight:600">${status}</span>
          ${estado ? `<span>${estado}</span>` : ''}
          <span>${formatRelative(data)}</span>
          ${curtidas ? `<span>♥ ${curtidas}</span>` : ''}
        </div>
      </div>
    `
  }
}

customElements.define('reclamacao-item', ReclamacaoItem)

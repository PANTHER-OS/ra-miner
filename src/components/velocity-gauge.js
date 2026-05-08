class VelocityGauge extends HTMLElement {
  static get observedAttributes() { return ['value', 'max', 'label'] }

  connectedCallback()        { this._render() }
  attributeChangedCallback() { this._render() }

  _render() {
    const val   = parseFloat(this.getAttribute('value') || '0')
    const max   = parseFloat(this.getAttribute('max')   || '50')
    const label = this.getAttribute('label') || 'recl./dia'
    const pct   = Math.min(100, (val / max) * 100)
    const color = pct >= 80 ? '#ff3d3d' : pct >= 50 ? '#ff7b00' : pct >= 25 ? '#ffd700' : '#74b9ff'

    this.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;gap:4px">
        <svg width="80" height="44" viewBox="0 0 80 44">
          <path d="M8 40 A32 32 0 0 1 72 40" fill="none" stroke="#2a2a2a" stroke-width="6" stroke-linecap="round"/>
          <path d="M8 40 A32 32 0 0 1 72 40" fill="none" stroke="${color}" stroke-width="6"
            stroke-linecap="round"
            stroke-dasharray="${pct * 1.005} 100.5"
            stroke-dashoffset="0"
            style="transition: stroke-dasharray .5s ease"
          />
          <text x="40" y="38" text-anchor="middle" fill="${color}" font-size="14" font-weight="900"
            font-family="-apple-system,sans-serif">${val.toFixed(1)}</text>
        </svg>
        <span style="font-size:10px;color:#888;text-transform:uppercase;letter-spacing:.06em">${label}</span>
      </div>
    `
  }
}

customElements.define('velocity-gauge', VelocityGauge)

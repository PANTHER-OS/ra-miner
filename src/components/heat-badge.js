import { getHeatTag } from '../lib/scoring.js'

class HeatBadge extends HTMLElement {
  static get observedAttributes() { return ['score'] }

  connectedCallback()              { this._render() }
  attributeChangedCallback()       { this._render() }

  _render() {
    const score = parseInt(this.getAttribute('score') || '0', 10)
    const { emoji, tag, css }     = getHeatTag(score)
    this.className               = `tag ${css}`
    this.textContent             = `${emoji} ${tag} ${score}`
    this.title                   = `Heat Score: ${score}/100`
  }
}

customElements.define('heat-badge', HeatBadge)

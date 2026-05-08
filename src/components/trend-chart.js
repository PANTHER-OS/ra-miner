import { Chart } from 'chart.js/auto'

class TrendChart extends HTMLElement {
  static get observedAttributes() { return ['data', 'color', 'height'] }

  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
    this._chart = null
  }

  connectedCallback() {
    const h = this.getAttribute('height') || '60'
    this.shadowRoot.innerHTML = `<canvas height="${h}" style="width:100%"></canvas>`
    this._draw()
  }

  attributeChangedCallback() {
    if (this._chart) { this._chart.destroy(); this._chart = null }
    this._draw()
  }

  _draw() {
    const canvas = this.shadowRoot.querySelector('canvas')
    if (!canvas) return

    let raw = []
    try { raw = JSON.parse(this.getAttribute('data') || '[]') } catch {}

    const color = this.getAttribute('color') || '#ff7b00'

    this._chart = new Chart(canvas, {
      type: 'line',
      data: {
        labels:   raw.map((_, i) => i),
        datasets: [{
          data:            raw,
          borderColor:     color,
          backgroundColor: color + '20',
          fill:            true,
          tension:         0.4,
          borderWidth:     1.5,
          pointRadius:     0,
        }],
      },
      options: {
        animation:  false,
        responsive: false,
        plugins:    { legend: { display: false }, tooltip: { enabled: false } },
        scales: {
          x: { display: false },
          y: { display: false, beginAtZero: true },
        },
      },
    })
  }

  disconnectedCallback() {
    this._chart?.destroy()
  }
}

customElements.define('trend-chart', TrendChart)

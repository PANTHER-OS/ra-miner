import { exportCSV, exportJSON, exportPDF, copyToClipboard, empresasToRows } from '../lib/exporter.js'

class ExportarModal extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <div class="modal-overlay" id="exp-overlay" style="display:none">
        <div class="modal">
          <div class="modal__header">
            <h3>Exportar dados</h3>
            <button class="btn btn-ghost btn-icon" id="exp-close">✕</button>
          </div>
          <div class="modal__body">
            <p class="text-muted" style="font-size:13px">Escolha o formato:</p>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px">
              <button class="btn btn-ghost" data-fmt="csv">📊 CSV (Excel)</button>
              <button class="btn btn-ghost" data-fmt="json">📋 JSON</button>
              <button class="btn btn-ghost" data-fmt="pdf">📄 PDF</button>
              <button class="btn btn-ghost" data-fmt="copy">📌 Copiar</button>
            </div>
            <div id="exp-status" style="margin-top:12px;font-size:12px;color:#888"></div>
          </div>
        </div>
      </div>
    `

    this.querySelector('#exp-close').addEventListener('click', () => this.close())
    this.querySelector('#exp-overlay').addEventListener('click', (e) => {
      if (e.target.id === 'exp-overlay') this.close()
    })

    this.querySelectorAll('[data-fmt]').forEach(btn => {
      btn.addEventListener('click', () => this._export(btn.dataset.fmt))
    })
  }

  open(data) {
    this._data = data
    this.querySelector('#exp-overlay').style.display = 'flex'
  }

  close() {
    this.querySelector('#exp-overlay').style.display = 'none'
  }

  async _export(fmt) {
    const rows = empresasToRows(this._data || [])
    const name = `ra-miner-${new Date().toISOString().split('T')[0]}`
    const status = this.querySelector('#exp-status')

    try {
      if (fmt === 'csv')  exportCSV(rows, `${name}.csv`)
      if (fmt === 'json') exportJSON(this._data, `${name}.json`)
      if (fmt === 'pdf')  await exportPDF(rows.slice(0, 100), { filename: `${name}.pdf` })
      if (fmt === 'copy') {
        const n = await copyToClipboard(rows)
        status.textContent = `✓ ${n} linhas copiadas`
        return
      }
      status.textContent = '✓ Download iniciado'
    } catch (err) {
      status.textContent = `✗ Erro: ${err.message}`
    }
  }
}

customElements.define('exportar-modal', ExportarModal)

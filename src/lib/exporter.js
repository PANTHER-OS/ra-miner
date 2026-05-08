/**
 * Exportação de dados em CSV, JSON e PDF.
 */

// Exporta para CSV com BOM UTF-8 (compatível com Excel)
export function exportCSV(rows, filename = 'ra-miner-export.csv') {
  if (!rows.length) return

  const headers = Object.keys(rows[0])
  const lines   = [
    headers.join(';'),
    ...rows.map(row =>
      headers.map(h => {
        const val = row[h] ?? ''
        const str = String(val).replace(/"/g, '""')
        return str.includes(';') || str.includes('"') || str.includes('\n')
          ? `"${str}"`
          : str
      }).join(';')
    ),
  ]

  const bom     = '﻿'
  const content = bom + lines.join('\r\n')
  _download(content, filename, 'text/csv;charset=utf-8')
}

// Exporta para JSON formatado
export function exportJSON(data, filename = 'ra-miner-export.json') {
  const content = JSON.stringify(data, null, 2)
  _download(content, filename, 'application/json')
}

// Copia para clipboard como texto formatado
export async function copyToClipboard(rows) {
  const headers = Object.keys(rows[0] || {})
  const lines   = [
    headers.join('\t'),
    ...rows.map(r => headers.map(h => r[h] ?? '').join('\t')),
  ]
  await navigator.clipboard.writeText(lines.join('\n'))
  return lines.length - 1 // retorna nº de linhas copiadas
}

// Exporta PDF com tabela (requer jspdf + jspdf-autotable)
export async function exportPDF(rows, { title = 'RA Miner', filename = 'ra-miner-export.pdf' } = {}) {
  const { jsPDF }     = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')

  const doc     = new jsPDF({ orientation: 'landscape' })
  const headers = Object.keys(rows[0] || {})

  doc.setFontSize(16)
  doc.text(title, 14, 15)
  doc.setFontSize(10)
  doc.text(`Gerado em ${new Date().toLocaleString('pt-BR')}`, 14, 22)

  autoTable(doc, {
    head:       [headers],
    body:       rows.map(r => headers.map(h => r[h] ?? '')),
    startY:     28,
    styles:     { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [255, 100, 0], textColor: 255 },
    alternateRowStyles: { fillColor: [245, 245, 245] },
  })

  doc.save(filename)
}

// Prepara linhas de empresas para exportação
export function empresasToRows(empresas) {
  return empresas.map(e => ({
    'Nome':               e.nome,
    'Slug':               e.slug,
    'Nicho':              e.nicho_inferido || '',
    'Heat Score':         e.heat_score || 0,
    'Total Reclamações':  e.total_reclamacoes || 0,
    'Score RA':           e.score_ra || '',
    'Segmento':           e.segmento || '',
    'Primeiro Visto':     e.primeiro_visto ? new Date(e.primeiro_visto).toLocaleDateString('pt-BR') : '',
    'Último Scrape':      e.ultimo_scrape  ? new Date(e.ultimo_scrape).toLocaleString('pt-BR')     : '',
    'URL':                `https://www.reclameaqui.com.br/${e.slug}/`,
  }))
}

function _download(content, filename, type) {
  const blob = new Blob([content], { type })
  const url  = URL.createObjectURL(blob)
  const a    = Object.assign(document.createElement('a'), { href: url, download: filename })
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Integração opcional com Panther OS.
 * Envia findings de ofertas escaladas para um webhook configurado.
 */
import { getConfig } from './storage.js'

export async function syncWithPanther(empresas) {
  const endpoint = await getConfig('panther_endpoint')
  const token    = await getConfig('panther_token')
  if (!endpoint) return { ok: false, reason: 'Endpoint Panther não configurado' }

  const payload = {
    source:    'ra-miner',
    version:   '1.0.0',
    timestamp: new Date().toISOString(),
    data:      empresas.map(e => ({
      nome:       e.nome,
      slug:       e.slug,
      url:        `https://www.reclameaqui.com.br/${e.slug}/`,
      nicho:      e.nicho_inferido,
      heat_score: e.heat_score,
      total_reclamacoes: e.total_reclamacoes,
      score_ra:   e.score_ra,
    })),
  }

  try {
    const res = await fetch(endpoint, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
      },
      body: JSON.stringify(payload),
    })
    return { ok: res.ok, status: res.status }
  } catch (err) {
    return { ok: false, reason: err.message }
  }
}

export async function testPantherConnection() {
  const endpoint = await getConfig('panther_endpoint')
  if (!endpoint) return { ok: false, reason: 'Endpoint não configurado' }
  try {
    const res = await fetch(endpoint, { method: 'HEAD' })
    return { ok: res.ok, status: res.status }
  } catch (err) {
    return { ok: false, reason: err.message }
  }
}

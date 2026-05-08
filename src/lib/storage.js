import Dexie from 'dexie'

const db = new Dexie('RAMiner')

db.version(1).stores({
  empresas:    '++id, slug, nome, nicho_inferido, heat_score, ultimo_scrape, primeiro_visto',
  reclamacoes: '++id, empresa_id, data, status, [empresa_id+data]',
  snapshots:   '++id, empresa_id, timestamp, [empresa_id+timestamp]',
  watchlist:   'empresa_id, adicionado_em',
  nichos:      '++id, nome',
  config:      'chave',
})

// --- Empresas ---

export async function upsertEmpresa(dados) {
  const existing = await db.empresas.where('slug').equals(dados.slug).first()
  if (existing) {
    await db.empresas.update(existing.id, {
      ...dados,
      ultimo_scrape: Date.now(),
    })
    return existing.id
  }
  return db.empresas.add({
    ...dados,
    primeiro_visto: Date.now(),
    ultimo_scrape: Date.now(),
  })
}

export async function getEmpresa(slug) {
  return db.empresas.where('slug').equals(slug).first()
}

export async function getEmpresaById(id) {
  return db.empresas.get(id)
}

export async function listEmpresas({ nicho, minScore = 0, limit = 50, orderBy = 'heat_score' } = {}) {
  let query = db.empresas.toCollection()
  if (nicho) query = db.empresas.where('nicho_inferido').equals(nicho)
  const all = await query.toArray()
  return all
    .filter(e => (e.heat_score || 0) >= minScore)
    .sort((a, b) => (b[orderBy] || 0) - (a[orderBy] || 0))
    .slice(0, limit)
}

export async function deleteEmpresa(id) {
  await db.transaction('rw', db.empresas, db.reclamacoes, db.snapshots, db.watchlist, async () => {
    await db.reclamacoes.where('empresa_id').equals(id).delete()
    await db.snapshots.where('empresa_id').equals(id).delete()
    await db.watchlist.where('empresa_id').equals(id).delete()
    await db.empresas.delete(id)
  })
}

// --- Reclamações ---

export async function bulkUpsertReclamacoes(lista) {
  if (!lista.length) return
  const ids = lista.map(r => r.id).filter(Boolean)
  const existentes = await db.reclamacoes.where('id').anyOf(ids).toArray()
  const existentesSet = new Set(existentes.map(r => r.id))
  const novas = lista.filter(r => !existentesSet.has(r.id))
  if (novas.length) await db.reclamacoes.bulkAdd(novas)
}

export async function getReclamacoes(empresaId, { days = 30, limit = 200 } = {}) {
  const cutoff = Date.now() - days * 86_400_000
  return db.reclamacoes
    .where('[empresa_id+data]')
    .between([empresaId, new Date(cutoff).toISOString()], [empresaId, new Date().toISOString()])
    .reverse()
    .limit(limit)
    .toArray()
}

// --- Snapshots ---

export async function addSnapshot(snap) {
  return db.snapshots.add({ ...snap, timestamp: snap.timestamp || Date.now() })
}

export async function getSnapshots(empresaId, limit = 90) {
  return db.snapshots
    .where('empresa_id').equals(empresaId)
    .reverse()
    .limit(limit)
    .toArray()
}

// --- Watchlist ---

export async function addToWatchlist(empresaId, opts = {}) {
  const exists = await db.watchlist.get(empresaId)
  if (exists) return
  await db.watchlist.add({
    empresa_id: empresaId,
    adicionado_em: Date.now(),
    alertas_ativos: opts.alertas ?? true,
    threshold_alerta: opts.threshold ?? 20,
  })
}

export async function removeFromWatchlist(empresaId) {
  await db.watchlist.delete(empresaId)
}

export async function isInWatchlist(empresaId) {
  const r = await db.watchlist.get(empresaId)
  return !!r
}

export async function getWatchlist() {
  const items = await db.watchlist.toArray()
  const empresas = await Promise.all(items.map(w => getEmpresaById(w.empresa_id)))
  return items.map((w, i) => ({ ...w, empresa: empresas[i] })).filter(x => x.empresa)
}

// --- Config ---

export async function getConfig(chave, fallback = null) {
  const r = await db.config.get(chave)
  return r ? r.valor : fallback
}

export async function setConfig(chave, valor) {
  await db.config.put({ chave, valor })
}

// --- Manutenção ---

export async function clearOldData(diasRetencao = 90) {
  const cutoff = Date.now() - diasRetencao * 86_400_000
  await db.reclamacoes.where('data').below(new Date(cutoff).toISOString()).delete()
  await db.snapshots.where('timestamp').below(cutoff).delete()
}

export async function exportAll() {
  const [empresas, reclamacoes, snapshots, watchlist] = await Promise.all([
    db.empresas.toArray(),
    db.reclamacoes.toArray(),
    db.snapshots.toArray(),
    db.watchlist.toArray(),
  ])
  return { empresas, reclamacoes, snapshots, watchlist, exportedAt: new Date().toISOString() }
}

export default db

/**
 * Algoritmo Heat Score — detecta ofertas escaladas pelo ritmo de reclamações.
 *
 * Pesos:
 *   Velocity     35% — reclamações/dia (últimos 7d)
 *   Acceleration 30% — ratio velocity_7d / velocity_7d_anterior
 *   Recency      20% — % das reclamações nos últimos 30d sobre o total
 *   Freshness    10% — empresas novas pesam mais (decaimento exponencial)
 *   Engagement    5% — interações médias por reclamação
 */

const W = { velocity: 0.35, acceleration: 0.30, recency: 0.20, freshness: 0.10, engagement: 0.05 }
const MAX_VELOCITY   = 150  // reclamações/dia — teto de normalização
const MAX_ACCEL      = 6    // 6x crescimento — teto
const FRESHNESS_HALF = 180  // dias até metade do peso de freshness

export function calcHeatScore(empresa, reclamacoes = []) {
  if (!empresa) return 0

  const now    = Date.now()
  const DAY    = 86_400_000
  const CUTOFF = (d) => now - d * DAY

  const inWindow = (r, from, to = 0) => {
    const t = new Date(r.data).getTime()
    return t >= CUTOFF(from) && t > CUTOFF(to)
  }

  const last7  = reclamacoes.filter(r => inWindow(r, 7))
  const prev7  = reclamacoes.filter(r => inWindow(r, 14, 7))
  const last30 = reclamacoes.filter(r => inWindow(r, 30))

  // Velocity
  const velocity     = last7.length / 7
  const prevVelocity = prev7.length / 7

  // Acceleration
  let acceleration
  if (prevVelocity > 0) {
    acceleration = velocity / prevVelocity
  } else {
    acceleration = velocity > 0 ? MAX_ACCEL : 1
  }

  // Recency
  const total   = Math.max(1, empresa.total_reclamacoes || 1)
  const recency = Math.min(1, last30.length / total)

  // Freshness
  const ageMs   = empresa.primeiro_visto ? now - empresa.primeiro_visto : 365 * DAY
  const ageDays = ageMs / DAY
  const freshness = Math.exp((-ageDays * Math.LN2) / FRESHNESS_HALF)

  // Engagement
  const engagement = _engagementScore(last7.slice(0, 30))

  const raw = (
    _norm(velocity,     MAX_VELOCITY) * W.velocity    +
    _norm(acceleration, MAX_ACCEL)    * W.acceleration +
    recency                           * W.recency      +
    freshness                         * W.freshness    +
    engagement                        * W.engagement
  )

  return Math.round(Math.min(100, Math.max(0, raw * 100)))
}

export function getHeatTag(score) {
  if (score >= 85) return { tag: 'EXPLODINDO',  emoji: '⚡', color: '#ff3d3d', css: 'tag-explodindo' }
  if (score >= 65) return { tag: 'ESCALANDO',   emoji: '🔥', color: '#ff7b00', css: 'tag-escalando'  }
  if (score >= 45) return { tag: 'AQUECENDO',   emoji: '📈', color: '#ffd700', css: 'tag-aquecendo'  }
  if (score >= 25) return { tag: 'MORNO',        emoji: '➡️', color: '#74b9ff', css: 'tag-morno'      }
  return               { tag: 'ESFRIANDO',   emoji: '📉', color: '#636e72', css: 'tag-esfriando' }
}

export function calcVelocity(reclamacoes, days = 7) {
  const cutoff = Date.now() - days * 86_400_000
  const count  = reclamacoes.filter(r => new Date(r.data).getTime() >= cutoff).length
  return count / days
}

export function calcAcceleration(reclamacoes) {
  const now = Date.now()
  const DAY = 86_400_000
  const v7  = calcVelocity(reclamacoes, 7)
  const prev = reclamacoes.filter(r => {
    const age = now - new Date(r.data).getTime()
    return age > 7 * DAY && age <= 14 * DAY
  })
  const vp = prev.length / 7
  if (vp === 0) return v7 > 0 ? MAX_ACCEL : 1
  return v7 / vp
}

export function scoreLabel(score) {
  if (score >= 85) return 'Explodindo'
  if (score >= 65) return 'Escalando'
  if (score >= 45) return 'Aquecendo'
  if (score >= 25) return 'Morno'
  return 'Esfriando'
}

function _norm(val, max) {
  return Math.min(1, Math.max(0, val / max))
}

function _engagementScore(reclamacoes) {
  if (!reclamacoes.length) return 0
  const avg = reclamacoes.reduce((s, r) => s + ((r.curtidas || 0) + (r.comentarios || 0)), 0) / reclamacoes.length
  return _norm(avg, 50)
}

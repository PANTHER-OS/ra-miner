export const sleep = (ms) => new Promise(r => setTimeout(r, ms))

export function slugFromUrl(url) {
  try {
    const u     = new URL(url)
    const path  = u.pathname.replace(/\/$/, '')
    const parts = path.split('/').filter(Boolean)
    // /empresa/slug  →  parts = ['empresa', 'slug']
    if (parts[0] === 'empresa' && parts[1]) return parts[1]
    return parts[0] || ''
  } catch {
    return ''
  }
}

export function parseDate(str) {
  if (!str) return null
  const d = new Date(str)
  return isNaN(d.getTime()) ? null : d
}

export function formatDate(date, opts = {}) {
  if (!date) return '—'
  const d = date instanceof Date ? date : new Date(date)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', ...opts })
}

export function formatRelative(date) {
  if (!date) return '—'
  const d    = date instanceof Date ? date : new Date(date)
  const diff = Date.now() - d.getTime()
  const min  = 60_000
  const hr   = 3_600_000
  const day  = 86_400_000
  if (diff < min)       return 'agora'
  if (diff < hr)        return `${Math.floor(diff / min)}min atrás`
  if (diff < day)       return `${Math.floor(diff / hr)}h atrás`
  if (diff < 7 * day)   return `${Math.floor(diff / day)}d atrás`
  return formatDate(d)
}

export function formatNumber(n) {
  if (n == null) return '—'
  return Number(n).toLocaleString('pt-BR')
}

export function truncate(str, max = 80) {
  if (!str) return ''
  return str.length > max ? str.slice(0, max - 1) + '…' : str
}

export function sanitizeText(html) {
  return html
    ? html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
    : ''
}

export function extractNextData(doc = document) {
  const el = doc.querySelector('#__NEXT_DATA__')
  if (!el) return null
  try {
    return JSON.parse(el.textContent)
  } catch {
    return null
  }
}

export function debounce(fn, delay = 300) {
  let timer
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}

export function throttle(fn, interval = 500) {
  let last = 0
  return (...args) => {
    const now = Date.now()
    if (now - last >= interval) {
      last = now
      return fn(...args)
    }
  }
}

export function groupBy(arr, key) {
  return arr.reduce((acc, item) => {
    const k = typeof key === 'function' ? key(item) : item[key]
    if (!acc[k]) acc[k] = []
    acc[k].push(item)
    return acc
  }, {})
}

export function countBy(arr, key) {
  const g = groupBy(arr, key)
  return Object.fromEntries(Object.entries(g).map(([k, v]) => [k, v.length]))
}

export function unique(arr, key) {
  const seen = new Set()
  return arr.filter(item => {
    const k = key ? item[key] : item
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
}

export function safeJson(str) {
  try { return JSON.parse(str) } catch { return null }
}

export function pick(obj, keys) {
  return Object.fromEntries(keys.map(k => [k, obj[k]]).filter(([, v]) => v !== undefined))
}

export function clamp(val, min, max) {
  return Math.min(max, Math.max(min, val))
}

// Normaliza score 0-100 para cor CSS hsl
export function scoreToColor(score) {
  const hue = clamp(score * 1.2, 0, 120) // 0=vermelho, 120=verde
  return `hsl(${hue}, 90%, 50%)`
}

export function generateId() {
  return Math.random().toString(36).slice(2, 11)
}

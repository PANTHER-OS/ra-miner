/**
 * Cache em memória com LRU eviction e TTL por entrada.
 */
export class Cache {
  constructor(maxSize = 200, defaultTtl = 5 * 60_000) {
    this._map        = new Map()
    this._maxSize    = maxSize
    this._defaultTtl = defaultTtl
  }

  get(key) {
    const entry = this._map.get(key)
    if (!entry) return undefined
    if (Date.now() > entry.expiry) {
      this._map.delete(key)
      return undefined
    }
    // Promove para o fim (LRU)
    this._map.delete(key)
    this._map.set(key, entry)
    return entry.value
  }

  set(key, value, ttl = this._defaultTtl) {
    if (this._map.has(key)) this._map.delete(key)
    if (this._map.size >= this._maxSize) {
      this._map.delete(this._map.keys().next().value)
    }
    this._map.set(key, { value, expiry: Date.now() + ttl })
    return value
  }

  has(key) {
    return this.get(key) !== undefined
  }

  delete(key) {
    this._map.delete(key)
  }

  clear() {
    this._map.clear()
  }

  get size() {
    return this._map.size
  }

  // Retorna valor do cache ou calcula e armazena
  async getOrSet(key, factory, ttl = this._defaultTtl) {
    const cached = this.get(key)
    if (cached !== undefined) return cached
    const value = await factory()
    return this.set(key, value, ttl)
  }
}

export const pageCache    = new Cache(100, 10 * 60_000)  // 10 min
export const scoreCache   = new Cache(500,  5 * 60_000)  // 5 min
export const nicheCache   = new Cache(200, 60 * 60_000)  // 1 hora

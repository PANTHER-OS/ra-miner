/**
 * Token bucket para rate limiting das requisições ao RA.
 * Evita banimento por excesso de requests.
 */

export class RateLimiter {
  constructor({
    capacity       = 8,
    refillRate      = 1,
    refillInterval  = 2000,
    minDelay        = 800,
    jitter          = 400,
  } = {}) {
    this.capacity      = capacity
    this.tokens        = capacity
    this.refillRate    = refillRate
    this.refillInterval = refillInterval
    this.minDelay      = minDelay
    this.jitter        = jitter
    this.lastRefill    = Date.now()
    this.queue         = []
    this.processing    = false
  }

  async acquire() {
    return new Promise((resolve) => {
      this.queue.push(resolve)
      this._process()
    })
  }

  async _process() {
    if (this.processing) return
    this.processing = true

    while (this.queue.length > 0) {
      this._refill()

      if (this.tokens >= 1) {
        this.tokens--
        const delay = this.minDelay + Math.random() * this.jitter
        await _sleep(delay)
        const resolve = this.queue.shift()
        resolve()
      } else {
        const wait = this.refillInterval * (1 / this.refillRate)
        await _sleep(wait)
      }
    }

    this.processing = false
  }

  _refill() {
    const now     = Date.now()
    const elapsed = now - this.lastRefill
    const toAdd   = (elapsed / this.refillInterval) * this.refillRate
    this.tokens   = Math.min(this.capacity, this.tokens + toAdd)
    this.lastRefill = now
  }

  get queueLength() {
    return this.queue.length
  }
}

function _sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

export const defaultLimiter = new RateLimiter()

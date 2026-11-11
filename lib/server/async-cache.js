// Bounded LRU cache. Failed loads are never cached; concurrent reads share work.
export class AsyncCache {
  constructor ({ maxEntries = 32, ttl = 60_000, now = Date.now } = {}) {
    this.entries = new Map()
    this.pending = new Map()
    this.maxEntries = maxEntries
    this.ttl = ttl
    this.now = now
  }

  get (key, load) {
    const cached = this.entries.get(key)
    if (cached && cached.expiresAt > this.now()) {
      this.entries.delete(key)
      this.entries.set(key, cached)
      return Promise.resolve(cached.value)
    }
    this.entries.delete(key)
    if (this.pending.has(key)) return this.pending.get(key)
    const request = Promise.resolve().then(load).then(value => {
      this.entries.set(key, { value, expiresAt: this.now() + this.ttl })
      while (this.entries.size > this.maxEntries) this.entries.delete(this.entries.keys().next().value)
      return value
    }).finally(() => { this.pending.delete(key) })
    this.pending.set(key, request)
    return request
  }
}

export class ResourceCache {
  constructor ({ maxEntries, maxWeight, dispose }) {
    this.entries = new Map()
    this.maxEntries = maxEntries
    this.maxWeight = maxWeight
    this.dispose = dispose
  }

  get (key) {
    const entry = this.entries.get(key)
    if (!entry) return
    this.entries.delete(key)
    this.entries.set(key, entry)
    return entry.value
  }

  set (key, value, weight = 0) { this.entries.set(key, { value, weight }) }
  weigh (key, weight) { const entry = this.entries.get(key); if (entry) entry.weight = weight }

  trim (protectedKeys = new Set()) {
    let weight = [...this.entries.values()].reduce((sum, entry) => sum + entry.weight, 0)
    for (const [key, entry] of this.entries) {
      if (this.entries.size <= this.maxEntries && weight <= this.maxWeight) break
      if (protectedKeys.has(key)) continue
      this.entries.delete(key)
      weight -= entry.weight
      this.dispose(entry.value, key)
    }
  }

  clear () {
    for (const [key, entry] of this.entries) this.dispose(entry.value, key)
    this.entries.clear()
  }
}

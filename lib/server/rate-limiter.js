// Pace starts (including failures) without blocking every request behind one
// slow response. notion-client owns retries and Retry-After handling.
export class RateLimiter {
  constructor (maxRequestsPerMinute = 200, minInterval = 300, concurrency = 2) {
    this.maxRequestsPerMinute = maxRequestsPerMinute
    this.minInterval = minInterval
    this.concurrency = concurrency
    this.queue = []
    this.starts = []
    this.active = 0
    this.lastStart = 0
    this.timer = null
  }

  enqueue (requestFunc) {
    return new Promise((resolve, reject) => {
      this.queue.push({ requestFunc, resolve, reject })
      this.drain()
    })
  }

  drain () {
    if (this.timer || !this.queue.length || this.active >= this.concurrency) return
    const now = Date.now()
    this.starts = this.starts.filter(time => now - time < 60_000)
    const delay = Math.max(0, this.lastStart + this.minInterval - now,
      this.starts.length >= this.maxRequestsPerMinute ? this.starts[0] + 60_000 - now : 0)
    if (delay) {
      this.timer = setTimeout(() => { this.timer = null; this.drain() }, delay)
      return
    }
    const { requestFunc, resolve, reject } = this.queue.shift()
    this.lastStart = now
    this.starts.push(now)
    this.active++
    Promise.resolve().then(requestFunc).then(resolve, reject).finally(() => {
      this.active--
      this.drain()
    })
    this.drain()
  }
}

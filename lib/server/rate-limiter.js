/**
 * Rate limiter for Notion API requests.
 * Prevents 429 (Too Many Requests) errors during build phase
 * by queuing requests and enforcing per-minute rate limits.
 */
export class RateLimiter {
  constructor(maxRequestsPerMinute = 200) {
    this.maxRequestsPerMinute = maxRequestsPerMinute
    this.queue = []
    this.isProcessing = false
    this.lastRequestTime = 0
    this.requestCount = 0
    this.windowStart = Date.now()
  }

  /**
   * Enqueue a request function to be executed with rate limiting.
   * Deduplicates concurrent requests with the same key.
   */
  enqueue(key, requestFunc) {
    return new Promise((resolve, reject) => {
      this.queue.push({ key, requestFunc, resolve, reject })
      if (!this.isProcessing) this._processQueue()
    })
  }

  async _processQueue() {
    if (this.queue.length === 0) {
      this.isProcessing = false
      return
    }
    this.isProcessing = true

    const now = Date.now()
    const elapsed = now - this.windowStart

    // Reset window if more than 60s have passed
    if (elapsed > 60_000) {
      this.requestCount = 0
      this.windowStart = now
    }

    // If rate limit reached, wait until window resets
    if (this.requestCount >= this.maxRequestsPerMinute) {
      const waitTime = 60_000 - elapsed + 100
      console.log(`[RateLimiter] Rate limit reached, waiting ${waitTime}ms`)
      await new Promise(res => setTimeout(res, waitTime))
      this.requestCount = 0
      this.windowStart = Date.now()
    }

    // Enforce minimum interval between requests (300ms)
    const minInterval = 300
    const gap = Date.now() - this.lastRequestTime
    if (gap < minInterval) {
      await new Promise(res => setTimeout(res, minInterval - gap))
    }

    const { requestFunc, resolve, reject } = this.queue.shift()

    try {
      const result = await requestFunc()
      this.lastRequestTime = Date.now()
      this.requestCount++
      resolve(result)
    } catch (err) {
      reject(err)
    } finally {
      // Process next item asynchronously
      setTimeout(() => this._processQueue(), 0)
    }
  }
}

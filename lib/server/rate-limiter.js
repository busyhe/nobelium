/**
 * Rate limiter for Notion API requests.
 * Prevents 429 (Too Many Requests) errors during build phase
 * by queuing requests and enforcing per-minute rate limits.
 */
export class RateLimiter {
  constructor(maxRequestsPerMinute = 200, minInterval = 300) {
    this.maxRequestsPerMinute = maxRequestsPerMinute
    this.minInterval = minInterval
    this.queue = []
    this.isProcessing = false
    this.lastRequestTime = 0
    this.requestCount = 0
    this.windowStart = Date.now()
  }

  /**
   * Enqueue a request function to be executed with rate limiting.
   */
  enqueue(requestFunc) {
    return new Promise((resolve, reject) => {
      this.queue.push({ requestFunc, resolve, reject })
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

    // Enforce minimum interval between requests
    const gap = Date.now() - this.lastRequestTime
    if (gap < this.minInterval) {
      await new Promise(res => setTimeout(res, this.minInterval - gap))
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

/**
 * Retry a function with exponential backoff on 429 errors.
 */
export async function retryOn429(fn, maxRetries = 5) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (err) {
      const status = err?.response?.status || err?.status || err?.statusCode
      if (status === 429 && attempt < maxRetries) {
        // Use Retry-After header if available, otherwise exponential backoff
        const retryAfter = err?.response?.headers?.get?.('retry-after')
        const baseDelay = retryAfter ? parseInt(retryAfter, 10) * 1000 : 1000
        const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 500
        console.warn(`[RateLimiter] 429 hit, retry ${attempt + 1}/${maxRetries} after ${Math.round(delay)}ms`)
        await new Promise(res => setTimeout(res, delay))
        continue
      }
      throw err
    }
  }
}

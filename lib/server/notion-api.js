import { NotionAPI } from 'notion-client'
import { RateLimiter, retryOn429 } from './rate-limiter'

const { NOTION_ACCESS_TOKEN } = process.env

const rateLimiter = new RateLimiter(200, 300)
const rawClient = new NotionAPI({ authToken: NOTION_ACCESS_TOKEN })

// Monkey-patch the internal fetch method to add rate limiting + 429 retry.
// This is the most effective layer because all Notion API calls
// (loadPageChunk, syncRecordValues, queryCollection, getSignedFileUrls, etc.)
// go through this single method.
const originalFetch = rawClient.fetch.bind(rawClient)
rawClient.fetch = function (args) {
  return rateLimiter.enqueue(() =>
    retryOn429(() => originalFetch(args))
  )
}

export default rawClient

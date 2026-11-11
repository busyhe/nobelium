import { NotionAPI } from 'notion-client'
import { RateLimiter } from './rate-limiter'

const { NOTION_ACCESS_TOKEN } = process.env

const rateLimiter = new RateLimiter(200, 300)
const rawClient = new NotionAPI({
  authToken: NOTION_ACCESS_TOKEN,
  // The legacy www.notion.so API is retired and responds with Cloudflare 403s.
  apiBaseUrl: 'https://app.notion.com/api/v3'
})

// Keep requests paced locally; notion-client 8 handles retries and Retry-After.
// This is the most effective layer because all Notion API calls
// (loadPageChunk, syncRecordValues, queryCollection, getSignedFileUrls, etc.)
// go through this single method.
const originalFetch = rawClient.fetch.bind(rawClient)
rawClient.fetch = function (args) {
  return rateLimiter.enqueue(() => originalFetch(args))
}

export default rawClient

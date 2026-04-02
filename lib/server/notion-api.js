import { NotionAPI } from 'notion-client'
import { RateLimiter } from './rate-limiter'

const { NOTION_ACCESS_TOKEN } = process.env

const rateLimiter = new RateLimiter(200)
const rawClient = new NotionAPI({ authToken: NOTION_ACCESS_TOKEN })

// In-flight request deduplication map
const inflight = new Map()

/**
 * Call Notion API method with rate limiting and request deduplication.
 * Prevents 429 (Too Many Requests) errors especially during build phase.
 */
async function callNotion(methodName, ...args) {
  const fn = rawClient[methodName]
  if (typeof fn !== 'function') {
    throw new Error(`NotionAPI.${methodName} is not a function`)
  }

  const key = `${methodName}:${JSON.stringify(args)}`

  // Deduplicate concurrent identical requests
  if (inflight.has(key)) return inflight.get(key)

  const execute = () => fn.apply(rawClient, args)
  const promise = rateLimiter.enqueue(key, execute)

  inflight.set(key, promise)
  promise.finally(() => inflight.delete(key))

  return promise
}

// Proxy that wraps all API methods with rate limiting + dedup
const client = {
  getPage: (...args) => callNotion('getPage', ...args),
  getBlocks: (...args) => callNotion('getBlocks', ...args),
  getUsers: (...args) => callNotion('getUsers', ...args),
}

export default client

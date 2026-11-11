import api from '@/lib/server/notion-api'
import { AsyncCache } from '@/lib/server/async-cache'

const blocks = new AsyncCache({ maxEntries: 32, ttl: Number(process.env.NOTION_CACHE_TTL_MS || 60_000) })

export function getPostBlocks (id) {
  return blocks.get(id, () => api.getPage(id))
}

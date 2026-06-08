import api from '@/lib/server/notion-api'

const CACHE_TTL_MS = Number(process.env.NOTION_CACHE_TTL_MS || 60_000)
const blockCache = new Map()

export async function getPostBlocks (id) {
  const cached = blockCache.get(id)
  if (cached && cached.expiresAt > Date.now()) return cached.data

  const pageBlock = await api.getPage(id)
  blockCache.set(id, {
    data: pageBlock,
    expiresAt: Date.now() + CACHE_TTL_MS
  })

  return pageBlock
}

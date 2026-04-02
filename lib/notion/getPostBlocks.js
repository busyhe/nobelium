import api from '@/lib/server/notion-api'
import { normalizeRecordMap } from './getAllPosts'

export async function getPostBlocks (id) {
  const pageBlock = await api.getPage(id)
  normalizeRecordMap(pageBlock)
  return pageBlock
}

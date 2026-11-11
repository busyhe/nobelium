import { defaultMapImageUrl, getBlockValue, getTextContent } from 'notion-utils'

// Follow this page's content tree, rather than collecting every image in a
// recordMap (which can also contain ancestors, linked pages and databases).
export function getPostPhotos (post, recordMap) {
  const page = getBlockValue(recordMap.block?.[post.id])
  if (!page) throw new Error('The post content is unavailable')

  const photos = []
  const sources = new Set()
  const visited = new Set()
  const add = (block, source, caption = '') => {
    if (!source || sources.has(source)) return
    const src = defaultMapImageUrl(source, block)
    if (!src) return
    sources.add(source)
    photos.push({ id: block.id, src, title: caption || post.title })
  }
  add(page, page.format?.page_cover)

  const visit = id => {
    if (visited.has(id)) return
    visited.add(id)
    const block = getBlockValue(recordMap.block[id])
    if (!block || block.alive === false || ['page', 'collection_view', 'collection_view_page'].includes(block.type)) return
    if (block.type === 'image') add(block, getTextContent(block.properties?.source), getTextContent(block.properties?.caption))
    block.content?.forEach(visit)
  }
  page.content?.forEach(visit)
  return photos
}

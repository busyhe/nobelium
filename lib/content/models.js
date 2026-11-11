/** @typedef {{id: string, title: string, slug: string, type: string[], tags?: string[], summary?: string, date: number, page_cover?: string, fullWidth?: boolean}} PostSummary */
/** @typedef {{id: string, src: string, title: string}} GalleryPhoto */
/** @typedef {{post: PostSummary, photos: GalleryPhoto[]}} GalleryDetail */
/** @typedef {{post: PostSummary, blockMap: object}} DocumentDetail */

const SUMMARY_FIELDS = ['id', 'title', 'slug', 'type', 'tags', 'summary', 'date', 'page_cover', 'fullWidth']

/** Pick only published metadata consumed by the public site. */
export function toPostSummary (post) {
  return Object.fromEntries(SUMMARY_FIELDS.filter(key => post[key] !== undefined).map(key => [key, post[key]]))
}

export function getDetailProps (post, blockMap, photos) {
  return post.type?.includes('Page')
    ? { post: toPostSummary(post), blockMap }
    : { post: toPostSummary(post), photos }
}

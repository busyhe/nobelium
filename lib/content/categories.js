export const DEFAULT_CATEGORY = { slug: '~journal', name: 'Journal' }

// Keep real tag URLs, reserving a separate identity for untagged stories.
export function getPostCategories (post) {
  const tags = [...new Set((post.tags || []).filter(tag => typeof tag === 'string').map(tag => tag.trim()).filter(Boolean))]
  return tags.length
    ? tags.map(name => ({ name, slug: name.startsWith('~') ? `~tag:${name}` : name }))
    : [DEFAULT_CATEGORY]
}

export function groupPosts (posts) {
  const groups = new Map()
  for (const post of posts) {
    for (const category of getPostCategories(post)) {
      if (!groups.has(category.slug)) groups.set(category.slug, { ...category, posts: [] })
      groups.get(category.slug).posts.push(post)
    }
  }
  return [...groups.values()]
}

export function getCategories (posts) {
  return groupPosts(posts).map(({ slug, name, posts }) => ({ slug, name, count: posts.length }))
}

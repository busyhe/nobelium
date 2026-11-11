const { readFile } = require('node:fs/promises')
const { config } = require('./lib/server/config')

module.exports = {
  siteUrl: config.link,
  generateRobotsTxt: true,
  sitemapSize: 7000,
  generateIndexSitemap: false,
  exclude: ['/404', '/500', '/feed'],
  transform: async (options, path) => {
    const { encodedPath } = await import('./lib/urls.js')
    return { loc: encodedPath(path), changefreq: options.changefreq, priority: options.priority, lastmod: new Date().toISOString() }
  },
  additionalPaths: async () => {
    const posts = JSON.parse(await readFile('.next/content-index.json', 'utf8'))
    const { getCategories } = await import('./lib/content/categories.js')
    const { sitePath } = await import('./lib/urls.js')
    const stories = posts.filter(post => post.type.includes('Post'))
    return [
      ...posts.map(post => ({ loc: sitePath(config.path, encodeURIComponent(post.slug)), lastmod: new Date(post.date).toISOString() })),
      ...getCategories(stories).map(tag => ({ loc: sitePath(config.path, `tag/${encodeURIComponent(tag.slug)}`) }))
    ]
  }
}

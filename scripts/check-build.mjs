import assert from 'node:assert/strict'
import { readFile, readdir, stat } from 'node:fs/promises'
import { gzipSync } from 'node:zlib'
import { join } from 'node:path'
import { sitePath } from '../lib/urls.js'

const pages = '.next/server/pages'
const html = await readFile(join(pages, 'index.html'), 'utf8')
const data = JSON.parse(html.match(/<script id="__NEXT_DATA__"[^>]*>(.*?)<\/script>/s)[1])
const posts = data.props.pageProps.posts
const frames = (html.match(/class="gallery-frame"/g) || []).length
const styles = [...html.matchAll(/<link\b[^>]*rel="stylesheet"[^>]*>/g)].map(match => match[0].match(/href="([^"]+)"/)[1])
const cssBytes = (await Promise.all(styles.map(path => stat(join('.next', path.split('/_next/')[1]))))).reduce((sum, file) => sum + file.size, 0)
const detailSizes = []
for (const file of await readdir(pages)) {
  if (!file.endsWith('.json')) continue
  const json = await readFile(join(pages, file), 'utf8')
  const props = JSON.parse(json).pageProps
  if (!props?.photos) continue
  assert.equal(props.blockMap, undefined, `${file}: gallery must not serialize Notion blocks`)
  assert.ok(Buffer.byteLength(json) < 128 * 1024, `${file}: gallery data exceeds 128 KiB`)
  detailSizes.push(Buffer.byteLength(json))
}
const xml = await readFile('public/sitemap.xml', 'utf8')
const urls = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(match => match[1].replace(/&amp;/g, '&').replace(/&apos;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>'))
const paths = urls.map(url => decodeURIComponent(new URL(url).pathname))
assert.equal(new Set(paths).size, paths.length, 'sitemap contains duplicate encoded/decoded paths')
for (const post of posts) assert.ok(paths.includes(sitePath(data.props.config?.path, post.slug)), `sitemap missing ${post.slug}`)
assert.equal(frames, posts.length ? 120 : 0, 'gallery DOM must remain bounded')
assert.ok(Buffer.byteLength(html) < 200 * 1024, 'home HTML exceeds 200 KiB')
assert.ok(cssBytes < 64 * 1024, 'home CSS exceeds 64 KiB')
assert.ok(!/<link\b[^>]*as="font"/.test(html), 'gallery must not preload unused content fonts')
console.log(JSON.stringify({ homeHtmlBytes: Buffer.byteLength(html), homeGzipBytes: gzipSync(html).byteLength, homeCssBytes: cssBytes, galleryFrames: frames, largestGalleryJsonBytes: Math.max(0, ...detailSizes), sitemapUrls: paths.length, coveredPosts: posts.length }, null, 2))

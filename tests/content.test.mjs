import test from 'node:test'
import assert from 'node:assert/strict'
import { getCategories, getPostCategories, groupPosts } from '../lib/content/categories.js'
import { getDetailProps, toPostSummary } from '../lib/content/models.js'
import { prepareRecordMap } from '../lib/content/record-map.js'
import { canonicalUrl, encodedPath, isIndexPath, sitePath } from '../lib/urls.js'

test('default Journal, real Journal and reserved tags never merge', () => {
  const posts = [{ id: 'empty', tags: [] }, { id: 'named', tags: ['Journal'] }, { id: 'reserved', tags: ['~journal'] }, { id: 'whitespace', tags: [' ', ''] }]
  const categories = getCategories(posts)
  assert.equal(categories.length, 3)
  assert.equal(categories.find(c => c.slug === '~journal').count, 2)
  assert.equal(new Set(categories.map(c => c.slug)).size, 3)
  for (const category of categories) {
    assert.equal(posts.filter(post => getPostCategories(post).some(c => c.slug === category.slug)).length, category.count)
  }
})

test('duplicate tags are normalized once without changing source metadata', () => {
  const tags = ['旅行', ' 旅行 ', '', '山', '山']
  const result = groupPosts([{ id: 'one', tags }])
  assert.deepEqual(result.map(group => [group.name, group.posts.length]), [['旅行', 1], ['山', 1]])
  assert.equal(tags.length, 5)
})

test('gallery DTO omits full blocks and non-public Notion metadata; documents retain blocks', () => {
  const post = { id: 'one', title: '旅行', slug: 'trip', type: ['Post'], date: 1, status: ['Published'], internal: 'private', author: { email: 'private' } }
  const blocks = { block: { one: { value: { type: 'page' } } } }
  const photos = [{ id: 'p', src: 'https://example.com/p.jpg', title: '山' }]
  const gallery = getDetailProps(post, blocks, photos)
  assert.deepEqual(Object.keys(gallery).sort(), ['photos', 'post'])
  assert.equal(gallery.post.internal, undefined)
  assert.equal(gallery.post.author, undefined)
  assert.equal(gallery.post.status, undefined)
  assert.equal(gallery.photos, photos)
  assert.equal(getDetailProps({ ...post, type: ['Page'] }, blocks, photos).blockMap, blocks)
  assert.deepEqual(toPostSummary({ ...post, summary: undefined }), gallery.post)
})

test('renderer root normalization preserves cache entries and native toggle types', () => {
  const original = { block: { a: { role: 'reader', value: { value: { type: 'collection_view', id: 'a' } } }, b: { value: { type: 'toggle', id: 'b' } } } }
  const result = prepareRecordMap(original)
  assert.equal(original.block.a.value.value.type, 'collection_view')
  assert.equal(result.block.a.value.value.type, 'collection_view_page')
  assert.equal(result.block.b, original.block.b)
  assert.equal(result.block.b.value.type, 'toggle')
  assert.equal(prepareRecordMap(result), result)
})

test('canonical URLs exclude UI state and preserve encoded paths and configured prefixes', () => {
  assert.equal(sitePath('/photos/', '/tag/旅行'), '/photos/tag/旅行')
  assert.equal(sitePath(''), '/')
  assert.equal(canonicalUrl('https://example.com/', '/trip?photo=4#image'), 'https://example.com/trip')
  assert.equal(canonicalUrl('https://example.com', '/tag/%E6%97%85%E8%A1%8C'), 'https://example.com/tag/%E6%97%85%E8%A1%8C')
  assert.ok(isIndexPath('/photos/tag/travel', '/photos'))
  assert.ok(isIndexPath('/photos', '/photos'))
  assert.equal(isIndexPath('/photos/trip', '/photos'), false)
})

test('sitemap paths normalize raw and already encoded routes to one location', () => {
  assert.equal(encodedPath('/tag/旅行'), encodedPath('/tag/%E6%97%85%E8%A1%8C'))
  assert.equal(encodedPath('/trip with spaces'), '/trip%20with%20spaces')
  assert.equal(encodedPath('/100%'), '/100%25')
})

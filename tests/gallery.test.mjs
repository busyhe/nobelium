import test from 'node:test'
import assert from 'node:assert/strict'
import { galleryWindow, GALLERY_SLOTS, nearbyPhotos, photoIndex } from '../lib/gallery/window.js'
import { ResourceCache } from '../lib/gallery/resource-cache.js'
import { createFrameLoop } from '../lib/gallery/frame-loop.js'

const groups = Array.from({ length: 48 }, (_, index) => ({ slug: String(index), posts: [{ id: `${index}-a` }, { id: `${index}-b` }] }))

test('fixed gallery slots cover every category, including negative and repeated laps', () => {
  const seen = new Set()
  for (let anchor = -60; anchor < 120; anchor++) {
    const sections = galleryWindow(groups, anchor)
    assert.equal(sections.length, GALLERY_SLOTS)
    assert.equal(sections.flatMap(section => section.columns.flat()).length, 120)
    assert.equal(new Set(sections.map(section => section.logical)).size, GALLERY_SLOTS)
    for (const section of sections) {
      assert.ok(section.logical >= anchor - 4 && section.logical <= anchor + 7)
      assert.equal(((section.logical % 2) + 2) % 2, section.slot % 2)
      assert.ok(section.columns.flat().every(Boolean))
      seen.add(section.slug)
    }
  }
  assert.equal(seen.size, 48)
  assert.deepEqual(galleryWindow([], 0), [])
})

test('moving a window recycles only its distant slot, preserving visible DOM identities', () => {
  const first = galleryWindow(groups, 0)
  const second = galleryWindow(groups, 1)
  assert.equal(first.filter((section, slot) => section.logical === second[slot].logical).length, 11)
  for (const section of first.filter(section => section.logical >= 0 && section.logical <= 4)) {
    assert.equal(second[section.slot].logical, section.logical)
    assert.equal(second[section.slot].slug, section.slug)
  }
})

test('photo URL indices and prefetch windows clamp malformed and out-of-range inputs', () => {
  assert.equal(photoIndex(undefined, 68), 0)
  assert.equal(photoIndex('4', 68), 3)
  assert.equal(photoIndex('1.5', 68), 0)
  assert.equal(photoIndex('-4', 68), 0)
  assert.equal(photoIndex('999', 68), 67)
  assert.equal(photoIndex('2', 0), 0)
  assert.deepEqual(nearbyPhotos(0, 0), [])
  assert.deepEqual(nearbyPhotos(68, 0, 1), [0, 1])
  assert.deepEqual(nearbyPhotos(68, 67, 1), [66, 67])
})

test('texture budget evicts old resources and releases them exactly once without breaking a visible texture', () => {
  const released = []
  const cache = new ResourceCache({ maxEntries: 2, maxWeight: 20, dispose: (_value, key) => released.push(key) })
  cache.set('a', {}, 10)
  cache.set('b', {}, 10)
  cache.get('a')
  cache.set('c', {}, 10)
  cache.trim(new Set(['c']))
  assert.deepEqual(released, ['b'])
  cache.weigh('c', 30)
  cache.trim(new Set(['c']))
  assert.deepEqual(released, ['b', 'a'])
  assert.ok(cache.get('c'))
  cache.clear()
  assert.deepEqual(released, ['b', 'a', 'c'])
})

test('frame loop sleeps when settled, wakes on demand and stops while hidden or disposed', () => {
  let time = 0, hidden = false, moving = false, draws = 0
  const callbacks = new Set()
  const loop = createFrameLoop({ ticker: { add: fn => callbacks.add(fn), remove: fn => callbacks.delete(fn) }, draw: () => draws++, moving: () => moving, hidden: () => hidden, now: () => time })
  loop.wake(10)
  callbacks.forEach(fn => fn(0, 16))
  assert.equal(draws, 1)
  time = 20
  moving = true
  callbacks.forEach(fn => fn(0, 16))
  assert.equal(callbacks.size, 1)
  moving = false
  callbacks.forEach(fn => fn(0, 16))
  assert.equal(callbacks.size, 0)
  loop.wake()
  hidden = true
  callbacks.forEach(fn => fn(0, 16))
  assert.equal(callbacks.size, 0)
  hidden = false
  loop.wake()
  loop.destroy()
  loop.wake()
  assert.equal(callbacks.size, 0)
})

import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { AsyncCache } from '../lib/server/async-cache.js'
import { withBuildSnapshot } from '../lib/server/build-snapshot.js'
import { RateLimiter } from '../lib/server/rate-limiter.js'

const pause = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds))

test('concurrent cache reads share a loader and rejected loads can be retried', async () => {
  const cache = new AsyncCache()
  let calls = 0
  const load = async () => { calls++; await pause(5); return 'result' }
  assert.deepEqual(await Promise.all([cache.get('a', load), cache.get('a', load)]), ['result', 'result'])
  assert.equal(calls, 1)
  await assert.rejects(cache.get('b', () => { throw new Error('temporary') }))
  assert.equal(await cache.get('b', () => 'recovered'), 'recovered')
  assert.equal(cache.pending.size, 0)
})

test('TTL expiry and LRU bounds prevent stale or unbounded block caches', async () => {
  let now = 0
  const cache = new AsyncCache({ maxEntries: 2, ttl: 10, now: () => now })
  await cache.get('a', () => 'old')
  await cache.get('b', () => 'b')
  await cache.get('a', () => assert.fail('must hit cache'))
  await cache.get('c', () => 'c')
  assert.equal(cache.entries.has('b'), false)
  now = 11
  assert.equal(await cache.get('a', () => 'fresh'), 'fresh')
  assert.equal(cache.entries.size, 2)
})

test('build workers share one atomic content snapshot; runtime has no disk cache', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'nobelium-test-'))
  let calls = 0
  const load = async () => { calls++; await pause(10); return [{ slug: 'trip' }] }
  try {
    const results = await Promise.all(Array.from({ length: 4 }, () => withBuildSnapshot('posts', load, directory)))
    assert.equal(calls, 1)
    assert.ok(results.every(result => result[0].slug === 'trip'))
    await withBuildSnapshot('runtime', load, '')
    await withBuildSnapshot('runtime', load, '')
    assert.equal(calls, 3)
  } finally { await rm(directory, { recursive: true, force: true }) }
})

test('failed snapshots release the lock for the next build request', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'nobelium-test-'))
  try {
    await assert.rejects(withBuildSnapshot('posts', () => { throw new Error('offline') }, directory))
    assert.deepEqual(await withBuildSnapshot('posts', () => ['ok'], directory), ['ok'])
  } finally { await rm(directory, { recursive: true, force: true }) }
})

test('rate limiter paces request starts, counts failures and permits bounded overlap', async () => {
  const limiter = new RateLimiter(200, 15, 2)
  const starts = []
  let active = 0, peak = 0
  const task = fail => limiter.enqueue(async () => {
    starts.push(Date.now())
    peak = Math.max(peak, ++active)
    await pause(45)
    active--
    if (fail) throw new Error('temporary')
    return 'ok'
  })
  const results = await Promise.allSettled([task(true), task(false), task(false), task(false)])
  assert.equal(results[0].status, 'rejected')
  assert.ok(results.slice(1).every(result => result.status === 'fulfilled'))
  assert.equal(peak, 2)
  assert.equal(limiter.starts.length, 4)
  assert.ok(starts.slice(1).every((start, index) => start - starts[index] >= 14))
})

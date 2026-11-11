import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const directory = await mkdtemp(join(tmpdir(), 'nobelium-build-'))
try {
  const child = spawn(process.execPath, [require.resolve('next/dist/bin/next'), 'build', '--webpack'], {
    stdio: 'inherit', env: { ...process.env, NOTION_BUILD_CACHE_DIR: directory }
  })
  const interrupt = () => child.kill('SIGTERM')
  process.on('SIGINT', interrupt)
  process.on('SIGTERM', interrupt)
  const code = await new Promise((resolve, reject) => { child.once('error', reject); child.once('exit', resolve) })
  process.off('SIGINT', interrupt)
  process.off('SIGTERM', interrupt)
  if (code !== 0) process.exitCode = code || 1
  else {
    const posts = JSON.parse(await readFile(join(directory, 'posts.json'), 'utf8'))
    // Sitemap generation uses the same successful build snapshot, including
    // fallback detail routes that don't appear in the prerender manifest.
    const published = posts.filter(post => post.title && post.slug && post.status?.includes('Published') && post.date <= Date.now() && post.type?.some(type => type === 'Page' || type === 'Post'))
    await writeFile('.next/content-index.json', JSON.stringify(published.map(({ slug, date, tags, type }) => ({ slug, date, tags, type }))))
  }
} finally { await rm(directory, { recursive: true, force: true }) }

import test from 'node:test'
import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

const run = promisify(execFile)
const script = fileURLToPath(new URL('../scripts/check-build.mjs', import.meta.url))
const stylesheet = 'body { color: red; }\n'

async function withBuild (href, check, { missingCss = false } = {}) {
  const directory = await mkdtemp(join(tmpdir(), 'nobelium-check-build-'))
  try {
    await Promise.all(['.next/server/pages', '.next/static/css', 'public'].map(path => mkdir(join(directory, path), { recursive: true })))
    const data = { props: { config: { path: '' }, pageProps: { posts: [] } } }
    await writeFile(join(directory, '.next/server/pages/index.html'), `<link rel="stylesheet" href="${href}"><script id="__NEXT_DATA__" type="application/json">${JSON.stringify(data)}</script>`)
    await writeFile(join(directory, 'public/sitemap.xml'), '<urlset><url><loc>https://example.com/</loc></url></urlset>')
    if (!missingCss) await writeFile(join(directory, '.next/static/css/site.css'), stylesheet)
    await check(() => run(process.execPath, [script], { cwd: directory }))
  } finally { await rm(directory, { recursive: true, force: true }) }
}

for (const [name, href] of [
  ['local stylesheet', '/_next/static/css/site.css'],
  ['Vercel deployment query', '/_next/static/css/site.css?dpl=dpl_test'],
  ['query and fragment', '/_next/static/css/site.css?dpl=dpl_test&amp;v=2#theme'],
  ['CDN asset prefix', 'https://cdn.example.com/assets/_next/static/css/site.css?dpl=dpl_test']
]) {
  test(`build checker measures CSS bytes with ${name}`, async () => {
    await withBuild(href, async execute => {
      const { stdout } = await execute()
      assert.equal(JSON.parse(stdout).homeCssBytes, Buffer.byteLength(stylesheet))
    })
  })
}

test('build checker still rejects genuinely missing CSS files', async () => {
  await withBuild('/_next/static/css/site.css?dpl=dpl_test', async execute => {
    await assert.rejects(execute(), error => error.code === 1 && error.stderr.includes('ENOENT') && error.stderr.includes("stat '.next/static/css/site.css'"))
  }, { missingCss: true })
})

const IMAGE_ORIGIN = 'https://app.notion.com'
const REDIRECT_ORIGINS = new Set([IMAGE_ORIGIN, 'https://img.notionusercontent.com'])
const MAX_BYTES = 20 * 1024 * 1024

export const config = { api: { responseLimit: '20mb' } }

// Only public Notion images are accepted. No cookies or access tokens are sent.
export default async function notionImage (req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).end()
  }

  const { src, width } = req.query
  let url
  try { url = typeof src === 'string' ? new URL(src) : null } catch {}
  const size = typeof width === 'string' ? Number(width) : NaN
  if (!url || url.origin !== IMAGE_ORIGIN || url.username || url.password ||
      !/^\/(image|images|icons)\//.test(url.pathname) ||
      !Number.isInteger(size) || size < 16 || size > 3840) {
    return res.status(400).json({ error: 'Invalid Notion image request' })
  }
  url.searchParams.set('width', String(size))

  try {
    const signal = AbortSignal.timeout(45_000)
    let upstream
    for (let redirects = 0; redirects <= 3; redirects++) {
      upstream = await fetch(url, { redirect: 'manual', signal })
      if (![301, 302, 303, 307, 308].includes(upstream.status)) break
      const location = upstream.headers.get('location')
      await upstream.body?.cancel()
      if (!location || redirects === 3) throw new Error('Invalid image redirect')
      url = new URL(location, url)
      if (!REDIRECT_ORIGINS.has(url.origin) || url.username || url.password) {
        throw new Error('Unexpected image host')
      }
    }
    if (!upstream.ok) {
      await upstream.body?.cancel()
      return res.status(upstream.status === 404 ? 404 : 502).end()
    }
    const type = upstream.headers.get('content-type')?.split(';')[0]
    if (!/^image\/(jpeg|png|webp|avif|gif|bmp|x-icon)$/.test(type || '')) {
      await upstream.body?.cancel()
      throw new Error('Unexpected image response')
    }

    const chunks = []
    let bytes = 0
    for await (const chunk of upstream.body) {
      bytes += chunk.length
      if (bytes > MAX_BYTES) throw new Error('Image exceeds size limit')
      chunks.push(chunk)
    }
    res.setHeader('Content-Type', type)
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800')
    return res.status(200).send(Buffer.concat(chunks))
  } catch (error) {
    res.setHeader('Cache-Control', 'no-store')
    return res.status(error.name === 'TimeoutError' ? 504 : 502).end()
  }
}

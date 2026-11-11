export function sitePath (base = '', path = '') {
  return `/${[base, path].map(part => String(part).replace(/^\/+|\/+$/g, '')).filter(Boolean).join('/')}`
}

export function canonicalUrl (origin, path) {
  const pathname = String(path || '/').split(/[?#]/)[0]
  return new URL(pathname, `${origin.replace(/\/+$/, '')}/`).href
}

export function isIndexPath (path, base = '') {
  const pathname = String(path || '').split(/[?#]/)[0]
  return pathname === sitePath(base) || pathname === sitePath(base, 'search') ||
    pathname.startsWith(`${sitePath(base, 'tag')}/`) || pathname.startsWith(`${sitePath(base, 'page')}/`)
}

export function encodedPath (path) {
  return path.split('/').map(segment => {
    try { return encodeURIComponent(decodeURIComponent(segment)) } catch { return encodeURIComponent(segment) }
  }).join('/')
}

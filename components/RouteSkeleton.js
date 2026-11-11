import Container from '@/components/Container'
import { useConfig } from '@/lib/config'

const SkeletonBlock = ({ className = '' }) => <div className={`skeleton-block ${className}`} />

export default function RouteSkeleton ({ route = '/' }) {
  const BLOG = useConfig()
  const routePath = route.split(/[?#]/)[0]
  const basePath = BLOG.path ? `/${BLOG.path.replace(/^\/+|\/+$/g, '')}` : ''
  const path = basePath && routePath.startsWith(`${basePath}/`) ? routePath.slice(basePath.length) : routePath === basePath ? '/' : routePath
  const isGallery = path === '/'
  const isIndex = path === '/search' || path.startsWith('/tag/') || path.startsWith('/page/')

  return (
    <Container layout={isGallery ? 'gallery' : isIndex ? undefined : 'blog'}>
      <div className={isGallery ? 'portfolio' : ''} role="status" aria-label="正在加载" aria-busy="true">
        {isGallery ? (
          <><div className="gallery-skeleton">{Array.from({ length: 18 }, (_, i) => <SkeletonBlock key={i} />)}</div><SkeletonBlock className="skeleton-title" /></>
        ) : (
          <div className="mx-auto w-full max-w-5xl space-y-8">
            <SkeletonBlock className="h-4 w-32" />
            <SkeletonBlock className="h-16 w-2/3" />
            <SkeletonBlock className="h-px w-full" />
            <SkeletonBlock className="h-80 w-full" />
            <SkeletonBlock className="h-4 w-5/6" />
            <SkeletonBlock className="h-4 w-2/3" />
          </div>
        )}
        <span className="sr-only">正在加载…</span>
      </div>
    </Container>
  )
}

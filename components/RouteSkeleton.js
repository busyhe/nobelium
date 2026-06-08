import Container from '@/components/Container'
import GalleryGrid from '@/components/GalleryGrid'
import { useConfig } from '@/lib/config'

const getSkeletonVariant = (route, basePath = '') => {
  const routePath = String(route || '/').split(/[?#]/)[0] || '/'
  const normalizedBasePath = basePath
    ? `/${String(basePath).replace(/^\/|\/$/g, '')}`
    : ''
  const path = normalizedBasePath && routePath.startsWith(normalizedBasePath)
    ? routePath.slice(normalizedBasePath.length) || '/'
    : routePath

  if (
    path === '/' ||
    path === '/search' ||
    path.startsWith('/page/') ||
    path.startsWith('/tag/')
  ) {
    return 'gallery'
  }

  return 'post'
}

const SkeletonBlock = ({ className = '' }) => (
  <div
    className={`animate-pulse rounded-sm bg-gray-200/80 dark:bg-gray-700/70 ${className}`}
  />
)

const GalleryCardSkeleton = ({ index }) => (
  <article
    className={`relative rounded-sm bg-[#fafaf8] p-[10px] pb-12 shadow-[0_2px_8px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.06)] dark:bg-gray-800 ${
      index % 2 === 0 ? '-rotate-[1.5deg]' : 'rotate-[1.5deg]'
    }`}
  >
    <SkeletonBlock className="aspect-[4/3] w-full bg-gray-100 dark:bg-gray-700" />
    <div className="mt-4 space-y-2 px-1">
      <SkeletonBlock className="mx-auto h-4 w-4/5" />
      <SkeletonBlock className="mx-auto h-3 w-1/2" />
    </div>
  </article>
)

const GallerySkeleton = () => {
  const BLOG = useConfig()
  const cardCount = Math.min(Math.max(BLOG.postsPerPage || 8, 8), 12)

  return (
    <Container title={BLOG.title} description={BLOG.description}>
      <div aria-busy="true" aria-live="polite">
        <GalleryGrid>
          {Array.from({ length: cardCount }, (_, index) => (
            <GalleryCardSkeleton key={index} index={index} />
          ))}
        </GalleryGrid>
        <div className="mt-10 grid w-full grid-cols-[minmax(0,1fr)_minmax(0,auto)_minmax(0,1fr)] items-center gap-3">
          <SkeletonBlock className="h-10 w-20 justify-self-start rounded-md" />
          <div className="flex gap-2 justify-self-center">
            <SkeletonBlock className="h-10 w-10 rounded-md" />
            <SkeletonBlock className="h-10 w-10 rounded-md" />
            <SkeletonBlock className="h-10 w-10 rounded-md" />
          </div>
          <SkeletonBlock className="h-10 w-20 justify-self-end rounded-md" />
        </div>
      </div>
    </Container>
  )
}

const PostSkeleton = () => {
  const BLOG = useConfig()

  return (
    <Container
      layout="blog"
      title={BLOG.title}
      description={BLOG.description}
    >
      <article className="flex flex-col items-center" aria-busy="true" aria-live="polite">
        <div className="w-full max-w-2xl px-4">
          <SkeletonBlock className="mb-7 h-10 w-3/4" />
          <div className="mb-8 flex flex-wrap items-center gap-2">
            <SkeletonBlock className="h-6 w-6 rounded-full" />
            <SkeletonBlock className="h-4 w-24" />
            <SkeletonBlock className="h-4 w-20" />
            <SkeletonBlock className="h-6 w-16 rounded-md" />
            <SkeletonBlock className="h-6 w-20 rounded-md" />
          </div>
        </div>
        <div className="self-stretch -mt-4 flex flex-col items-center lg:flex-row lg:items-stretch">
          <div className="hidden flex-1 lg:block" />
          <div className="w-full max-w-2xl flex-none space-y-4 px-4">
            <SkeletonBlock className="h-72 w-full" />
            <SkeletonBlock className="h-4 w-full" />
            <SkeletonBlock className="h-4 w-11/12" />
            <SkeletonBlock className="h-4 w-10/12" />
            <SkeletonBlock className="my-8 h-8 w-2/3" />
            <SkeletonBlock className="h-4 w-full" />
            <SkeletonBlock className="h-4 w-5/6" />
            <SkeletonBlock className="h-4 w-9/12" />
          </div>
          <div className="order-first w-full max-w-2xl flex-1 px-4 lg:order-[unset] lg:w-auto lg:max-w-[unset] lg:min-w-[160px]">
            <div className="hidden space-y-2 pt-3 lg:block">
              <SkeletonBlock className="h-4 w-28" />
              <SkeletonBlock className="h-4 w-20" />
              <SkeletonBlock className="h-4 w-24" />
            </div>
          </div>
        </div>
      </article>
    </Container>
  )
}

export default function RouteSkeleton ({ route }) {
  const BLOG = useConfig()
  const variant = getSkeletonVariant(route, BLOG.path)

  if (variant === 'gallery') return <GallerySkeleton />

  return <PostSkeleton />
}

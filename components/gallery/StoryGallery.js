import { useCallback, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import Container from '@/components/Container'
import GalleryViewer from '@/components/gallery/GalleryViewer'
import { useConfig } from '@/lib/config'
import { isIndexPath, sitePath } from '@/lib/urls'

export default function StoryGallery ({ post, photos, previousPath }) {
  const BLOG = useConfig()
  const router = useRouter()
  const [open, setOpen] = useState(true)
  const headerRef = useRef(null)
  const returnTo = useRef(previousPath && isIndexPath(previousPath.split(/[?#]/)[0], BLOG.path) ? previousPath : null)
  const onExited = useCallback(() => {
    if (returnTo.current) router.back()
    else router.replace(sitePath(BLOG.path)).catch(() => setOpen(true))
  }, [router, BLOG.path])

  return (
    <Container headerRef={headerRef} layout="gallery" title={post.title} description={post.summary} slug={post.slug} type="article" image={post.page_cover} date={new Date(post.date).toISOString()}>
      <div className="photo-gallery" data-viewer="true">
        <GalleryViewer key={post.id} headerRef={headerRef} post={post} photos={photos} open={open} onClose={() => setOpen(false)} onExited={onExited} />
      </div>
    </Container>
  )
}

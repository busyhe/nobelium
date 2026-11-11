import { useCallback, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import Container from '@/components/Container'
import GalleryViewer from '@/components/gallery/GalleryViewer'
import { useConfig } from '@/lib/config'

export default function StoryGallery ({ post, photos, previousPath }) {
  const BLOG = useConfig()
  const router = useRouter()
  const [open, setOpen] = useState(true)
  const returnTo = useRef(previousPath && /^\/(search|tag\/|page\/)/.test(previousPath) ? previousPath : BLOG.path || '/')
  const onExited = useCallback(() => { router.push(returnTo.current) }, [router])

  return (
    <Container layout="gallery" title={post.title} description={post.summary} slug={post.slug} type="article">
      <div className="photo-gallery" data-viewer="true">
        <GalleryViewer post={post} photos={photos} open={open} onClose={() => setOpen(false)} onExited={onExited} />
      </div>
    </Container>
  )
}

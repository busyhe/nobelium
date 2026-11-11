import { useState } from 'react'
import Image from 'next/image'
import notionImageLoader from '@/lib/notion/image-loader'

// A Notion cover can be missing or expired. Keep its place in the collection.
export default function Photo ({ src, title, priority = false, sizes, index = 0, onLoad, loading }) {
  const [failedSource, setFailedSource] = useState(null)

  if (!src || failedSource === src) {
    return (
      <span className="photo-placeholder" role="img" aria-label={title}>
        <span className="photo-placeholder-number">{String(index + 1).padStart(2, '0')}</span>
        <span>{title}</span>
      </span>
    )
  }

  return (
    <Image src={src} loader={/^https:\/\/app\.notion\.com\/(image|images|icons)\//.test(src) ? notionImageLoader : undefined} alt={title} fill sizes={sizes || '(max-width: 680px) 44vw, 24vw'} priority={priority} loading={priority ? undefined : loading} draggable={false} onLoad={onLoad} onError={() => setFailedSource(src)} />
  )
}

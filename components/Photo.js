import { useState } from 'react'
import Image from 'next/image'
import notionImageLoader from '@/lib/notion/image-loader'

// A Notion cover can be missing or expired. Keep its place in the collection.
export default function Photo ({ src, title, priority = false, sizes, index = 0, onLoad, onError, loading, retryKey = 0 }) {
  const [result, setResult] = useState(null)
  const current = result?.src === src && result?.retryKey === retryKey ? result : null

  if (!src || current?.failed) {
    return (
      <span className="photo-placeholder" role="img" aria-label={title}>
        <span className="photo-placeholder-number">{String(index + 1).padStart(2, '0')}</span>
        <span>{current?.failed ? '图片暂时无法加载' : title}</span>
      </span>
    )
  }

  return (
    <>
      {!current && <span className="photo-loading" aria-hidden="true" />}
      <Image key={`${src}:${retryKey}`} src={src} loader={/^https:\/\/app\.notion\.com\/(image|images|icons)\//.test(src) ? notionImageLoader : undefined} alt={title} fill sizes={sizes || '(max-width: 680px) 44vw, (max-width: 1000px) 30vw, 24vw'} preload={priority} loading={priority ? undefined : loading} draggable={false}
        onLoad={event => { setResult({ src, retryKey, failed: false }); onLoad?.(event) }}
        onError={event => { setResult({ src, retryKey, failed: true }); onError?.(event) }} />
    </>
  )
}

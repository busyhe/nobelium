import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import { getImageProps } from 'next/image'
import Photo from '@/components/Photo'
import { useConfig } from '@/lib/config'
import notionImageLoader from '@/lib/notion/image-loader'
import { createViewerMotion } from '@/lib/gallery/viewer-motion'
import { nearbyPhotos, photoIndex } from '@/lib/gallery/window'

const imageSizes = '(max-width: 679px) 100vw, 70vw'

export default function GalleryViewer ({ post, photos = [], open, onClose, onExited, headerRef }) {
  const BLOG = useConfig()
  const router = useRouter()
  const rootRef = useRef(null)
  const controllerRef = useRef(null)
  const callbacks = useRef({ onClose, onExited })
  const writtenQuery = useRef(null)
  const [index, setIndex] = useState(0)
  const [zoomed, setZoomed] = useState(false)
  const [failed, setFailed] = useState(null)
  const [retryKey, setRetryKey] = useState(0)
  const items = photos.length ? photos : [{ id: post.id, title: post.title }]
  const photo = items[index] || items[0]

  useEffect(() => { callbacks.current = { onClose, onExited } }, [onClose, onExited])
  useEffect(() => {
    const controller = createViewerMotion(rootRef.current, {
      count: photos.length,
      onIndex: setIndex,
      onZoom: setZoomed,
      onClose: () => callbacks.current.onClose(),
      onExited: () => callbacks.current.onExited(),
      mainHeader: headerRef.current
    })
    controllerRef.current = controller
    return () => { controller.destroy(); controllerRef.current = null }
  }, [photos.length, headerRef])

  // A shared URL restores the selected photo. Own shallow replacements must not
  // interrupt an in-progress wheel or drag gesture.
  useEffect(() => {
    if (!router.isReady || writtenQuery.current === router.query.photo) return
    controllerRef.current?.go(photoIndex(router.query.photo, photos.length))
  }, [router.isReady, router.query.photo, photos.length])
  useEffect(() => {
    if (!router.isReady) return
    const timer = setTimeout(() => {
      const value = index ? String(index + 1) : undefined
      if (value === router.query.photo) return
      writtenQuery.current = value
      const query = { ...router.query }
      if (value) query.photo = value
      else delete query.photo
      router.replace({ pathname: router.pathname, query }, undefined, { shallow: true, scroll: false }).catch(() => {})
    }, 250)
    return () => clearTimeout(timer)
  }, [index, router])

  useEffect(() => {
    // Match Next Image's responsive URL so the next slide can reuse the browser
    // cache. Only the two immediate neighbours are prefetched at low priority.
    const timer = setTimeout(() => {
      nearbyPhotos(photos.length, index, 1).filter(i => i !== index).forEach(i => {
        const src = photos[i].src
        if (!src) return
        const { props } = getImageProps({ src, alt: '', fill: true, sizes: imageSizes, loader: /^https:\/\/app\.notion\.com\/(image|images|icons)\//.test(src) ? notionImageLoader : undefined })
        const image = new window.Image()
        image.decoding = 'async'
        image.fetchPriority = 'low'
        image.sizes = props.sizes
        image.srcset = props.srcSet || ''
        image.src = props.src
      })
    }, 300)
    return () => clearTimeout(timer)
  }, [index, photos])
  useEffect(() => { if (!open) controllerRef.current?.exit() }, [open])
  const onImageLoad = useCallback(event => controllerRef.current?.imageLoaded(event.target), [])

  return (
    <section ref={rootRef} className="gallery-viewer" role="dialog" aria-modal="true" aria-label={`${post.title} 篇章照片`} data-post-id={post.id} data-zoom="false">
      <div className="viewer-backdrop" />
      <header className="viewer-header"><span className="viewer-wordmark">{BLOG.author}</span><button type="button" className="viewer-close text-link" onClick={onClose}>Close <span aria-hidden="true">×</span></button></header>
      <div className="viewer-stage">
        <button className="viewer-image" type="button" data-gallery-image data-active="true" onClick={() => controllerRef.current?.toggleZoom()} aria-label={zoomed ? '缩小照片' : '放大照片'} aria-pressed={zoomed}>
          <Photo key={photo.id} src={photo.src} title={photo.title} priority sizes={zoomed ? '100vw' : imageSizes} retryKey={retryKey} onLoad={onImageLoad} onError={() => setFailed(photo.id)} />
        </button>
      </div>
      {failed === photo.id && <button type="button" className="viewer-retry" onClick={() => { setFailed(null); setRetryKey(key => key + 1) }}>图片加载失败，点击重试</button>}
      <div className="viewer-rail-window"><div className="viewer-rail">
        {items.map((item, itemIndex) => <button type="button" className="viewer-thumb" key={item.id} data-photo-id={item.id} aria-label={`查看第 ${itemIndex + 1} 张：${item.title}`} aria-current={itemIndex === index ? 'true' : undefined} tabIndex={itemIndex === index && !zoomed ? 0 : -1} onClick={() => controllerRef.current?.go(itemIndex)}>
          {Math.abs(itemIndex - index) <= 10 && <Photo src={item.src} title={item.title} sizes="(max-width: 679px) 10vw, 4.2vw" loading="lazy" index={itemIndex} />}
        </button>)}
      </div></div>
      <div className="viewer-selection-border" aria-hidden="true" />
      <span className="viewfinder viewer-scope" aria-hidden="true" />
      <div className="viewer-caption"><p>CATEGORY</p><span>{post.tags?.join(' / ') || 'Journal'}</span></div>
      <div className="viewer-story"><h1>{post.title}</h1></div>
      <nav className="viewer-navigation" aria-label="照片翻页">
        <button type="button" aria-label="上一张照片" disabled={index === 0 || zoomed} onClick={() => controllerRef.current?.go(index - 1)}>←</button>
        <button type="button" aria-label="下一张照片" disabled={index >= photos.length - 1 || zoomed} onClick={() => controllerRef.current?.go(index + 1)}>→</button>
      </nav>
      <div className="viewer-status" role="status" aria-live="polite">
        {photos.length ? `${index + 1} / ${photos.length}` : '本篇暂时没有照片。'}
      </div>
    </section>
  )
}

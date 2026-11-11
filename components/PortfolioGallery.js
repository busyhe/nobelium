import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { useConfig } from '@/lib/config'
import Photo from '@/components/Photo'
import { createGalleryMotion } from '@/lib/gallery/motion'
import { groupPosts } from '@/lib/content/categories'
import { galleryWindow } from '@/lib/gallery/window'
import { readSession, writeSession } from '@/lib/session'
import { sitePath } from '@/lib/urls'

function ViewIcon ({ full = false }) {
  return full ? (
    <svg width="24" height="20" viewBox="0 0 24 20" fill="currentColor" aria-hidden="true"><path d="M0 1h2v18H0zm4 0h16v18H4zm18 0h2v18h-2z" /></svg>
  ) : (
    <svg width="19" height="19" viewBox="0 0 19 19" fill="currentColor" aria-hidden="true">{[0, 7, 14].flatMap(x => [0, 7, 14].map(y => <rect key={`${x}-${y}`} x={x} y={y} width="5" height="5" />))}</svg>
  )
}

export default function PortfolioGallery ({ posts = [] }) {
  const BLOG = useConfig()
  const router = useRouter()
  const rootRef = useRef(null)
  const motionRef = useRef(null)
  const [mode, setMode] = useState('grid')
  const [activeCategory, setActiveCategory] = useState(null)
  const [ready, setReady] = useState(false)
  const [progress, setProgress] = useState(0)
  const [anchor, setAnchor] = useState(0)
  const [imagesMounted, setImagesMounted] = useState(false)
  const groups = useMemo(() => groupPosts(posts), [posts])
  const sections = useMemo(() => galleryWindow(groups, anchor), [groups, anchor])
  const active = groups.find(group => group.slug === activeCategory) || groups[0]

  useEffect(() => {
    if (!groups.length) return
    const saved = readSession('gallery')
    const motion = createGalleryMotion(rootRef.current, {
      initial: saved,
      onWindow: value => { setAnchor(value); setImagesMounted(true) },
      onCategory: setActiveCategory,
      onReady: () => setReady(true),
      onProgress: setProgress,
      onMode: setMode
    })
    motionRef.current = motion
    return () => {
      writeSession('gallery', motion.snapshot())
      motion.destroy()
      motionRef.current = null
    }
  }, [groups])

  useEffect(() => { motionRef.current?.refresh() }, [sections])

  function openPost (post) {
    if (!ready) return
    // Use the same detail route and shared route-loading UI as the Index cards.
    writeSession('gallery', motionRef.current?.snapshot())
    router.push(sitePath(BLOG.path, encodeURIComponent(post.slug))).catch(() => {})
  }

  if (!posts.length) return <section className="gallery-empty"><span className="viewfinder" /><h1>故事即将开始。</h1><p>新的作品会出现在这里。</p></section>

  return (
    <section ref={rootRef} className="photo-gallery" data-mode="grid" data-dark="false" aria-label="作品集">
      <div className="gallery-board">
        <div className="gallery-stage" role="region" aria-label="照片墙，可拖动或滚动浏览，方向键移动，空格翻页" tabIndex={0}>
          <div className="gallery-track">
            {sections.map(section => (
              <div className="gallery-section" key={section.slot} data-category={section.slug} data-logical={section.logical} style={{ '--section-index': section.logical }}>
                {section.columns.map((column, columnIndex) => (
                  <div className="gallery-column" key={columnIndex}>
                    {column.map((post, row) => (
                      <div className="gallery-cell" key={row}>
                        <button type="button" className="gallery-frame" data-gallery-image data-post-id={post.id} data-category={section.slug} data-selected={section.slug === active?.slug} data-aspect="1.5" onClick={() => openPost(post)} onFocus={event => motionRef.current?.focusCategory(section.slug, event.currentTarget)} aria-label={`打开篇章：${post.title}`} tabIndex={-1}>
                          {(imagesMounted ? section.logical >= anchor - 2 && section.logical <= anchor + 5 : section.logical >= 0 && section.logical < 4 && row === 2) && <Photo src={post.page_cover} title={post.title} index={row} loading="lazy" sizes={mode === 'full' && row === 2 && section.slot % 2 === 0 && columnIndex === 0 ? '(max-width: 679px) 100vw, 60vw' : '(max-width: 679px) 20vw, (max-aspect-ratio: 1.35) 10vw, 7vw'} />}
                        </button>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
        <div className="gallery-controls">
          <span className="viewfinder gallery-scope gallery-scope--grid" aria-hidden="true" />
          <span className="viewfinder gallery-scope gallery-scope--full" aria-hidden="true" />
          <div className="gallery-category">
            <h1 className="gallery-category-title"><Link href={sitePath(BLOG.path, `tag/${encodeURIComponent(active.slug)}`)} prefetch={false} aria-label={`查看 ${active.name} 分类的 ${active.posts.length} 篇作品`}><span>{active.name}</span><sup>({active.posts.length})</sup></Link></h1>
            <p>/{posts.length}Stories</p>
          </div>
          <div className="gallery-mode" role="group" aria-label="浏览模式">
            <button type="button" aria-label="网格浏览" aria-pressed={mode === 'grid'} disabled={!ready} onClick={() => { motionRef.current?.setMode('grid') }}><ViewIcon /></button>
            <button type="button" aria-label="大图浏览" aria-pressed={mode === 'full'} disabled={!ready} onClick={() => { motionRef.current?.setMode('full') }}><ViewIcon full /></button>
          </div>
        </div>
        <div className="gallery-page-cover" />
      </div>
      <div className="gallery-splash" aria-hidden="true">
        <h2 className="gallery-splash-title">
          <span className="in">{BLOG.author.toUpperCase().split('').map((letter, index) => <span key={index}>{letter}</span>)}</span>
          <span className="out">{BLOG.author.toUpperCase().split('').map((letter, index) => <span key={index}>{letter}</span>)}</span>
        </h2>
        <div className="gallery-splash-front"><div className="gallery-splash-image"><Photo src={posts.find(post => post.page_cover)?.page_cover} title="" priority sizes="100vw" /></div></div>
        <div className="gallery-splash-bottom"><p>A personal collection<br />of moments & stories.</p><p className="gallery-splash-signature">{BLOG.author}<sup>®</sup></p><span>{progress}</span></div>
      </div>
    </section>
  )
}

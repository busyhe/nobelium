import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { useConfig } from '@/lib/config'
import Photo from '@/components/Photo'
import { createGalleryMotion } from '@/lib/gallery/motion'

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
  // Include the first desktop viewport in the HTML; mount other photos nearby.
  const [visibleSections, setVisibleSections] = useState(() => new Set([0, 1, 2, 3]))
  const groups = useMemo(() => {
    const result = new Map()
    posts.forEach(post => {
      const tags = post.tags?.length ? new Set(post.tags) : ['Journal']
      for (const tag of tags) {
        if (!result.has(tag)) result.set(tag, [])
        result.get(tag).push(post)
      }
    })
    return [...result].map(([name, items]) => ({ name, posts: items }))
  }, [posts])
  const sections = useMemo(() => groups.length ? Array.from({ length: Math.max(2, Math.ceil(12 / groups.length)) }, (_, cycle) => groups.map(group => ({
    ...group, key: `${cycle}-${group.name}`,
    columns: [0, 1].map(column => Array.from({ length: 5 }, (_, row) => group.posts[(cycle * 10 + column * 5 + row) % group.posts.length]))
  }))).flat() : [], [groups])
  const active = groups.find(group => group.name === activeCategory) || groups[0]

  useEffect(() => {
    if (!sections.length) return
    const motion = createGalleryMotion(rootRef.current, { onCategory: setActiveCategory, onReady: () => setReady(true), onProgress: setProgress })
    motionRef.current = motion
    return () => { motion.destroy(); motionRef.current = null }
  }, [sections])

  useEffect(() => {
    if (!sections.length) return
    if (!('IntersectionObserver' in window)) {
      const frame = window.requestAnimationFrame(() => setVisibleSections(new Set(sections.map((_, index) => index))))
      return () => window.cancelAnimationFrame(frame)
    }

    const root = rootRef.current
    const elements = [...root.querySelectorAll('.gallery-section')]
    const indexes = new Map(elements.map((element, index) => [element, index]))
    const observer = new IntersectionObserver(entries => {
      setVisibleSections(previous => {
        const next = new Set(previous)
        entries.forEach(entry => {
          const index = indexes.get(entry.target)
          if (entry.isIntersecting) next.add(index)
          else next.delete(index)
        })
        return next.size === previous.size && [...next].every(index => previous.has(index)) ? previous : next
      })
    }, { root: root.querySelector('.gallery-stage'), rootMargin: '0px 100%' })
    elements.forEach(element => observer.observe(element))
    return () => observer.disconnect()
  }, [sections])

  function openPost (post) {
    if (!ready) return
    // Use the same detail route and shared route-loading UI as the Index cards.
    router.push(`${BLOG.path}/${post.slug}`)
  }

  if (!posts.length) return <section className="gallery-empty"><span className="viewfinder" /><h1>故事即将开始。</h1><p>新的作品会出现在这里。</p></section>

  return (
    <section ref={rootRef} className="photo-gallery" data-mode="grid" data-dark="false" aria-label="作品集">
      <div className="gallery-board">
        <div className="gallery-stage" role="region" aria-label="照片墙，可拖动或滚动浏览，方向键移动，空格翻页" tabIndex={0}>
          <div className="gallery-track">
            {sections.map((section, sectionIndex) => (
              <div className="gallery-section" key={section.key} data-category={section.name} style={{ '--section-index': sectionIndex }}>
                {section.columns.map((column, columnIndex) => (
                  <div className="gallery-column" key={columnIndex}>
                    {column.map((post, row) => (
                      <div className="gallery-cell" key={`${post.id}-${row}`}>
                        <button type="button" className="gallery-frame" data-gallery-image data-post-id={post.id} data-category={section.name} data-selected={section.name === (active?.name)} data-aspect="1.5" onClick={() => openPost(post)} onFocus={event => motionRef.current?.focusCategory(section.name, event.currentTarget)} aria-label={`打开篇章：${post.title}`} tabIndex={sectionIndex < groups.length ? 0 : -1}>
                          {visibleSections.has(sectionIndex) && <Photo src={post.page_cover} title={post.title} index={row} loading="lazy" sizes={mode === 'full' && row === 2 && sectionIndex % 2 === 0 && columnIndex === 0 ? '(max-width: 679px) 100vw, 60vw' : '(max-width: 679px) 20vw, (max-aspect-ratio: 1.35) 10vw, 7vw'} />}
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
            <h1 className="gallery-category-title"><Link href={`${BLOG.path}/tag/${encodeURIComponent(active.name)}`} prefetch={false} aria-label={`查看 ${active.name} 分类的 ${active.posts.length} 篇作品`}><span>{active.name}</span><sup>({active.posts.length})</sup></Link></h1>
            <p>/{posts.length}Stories</p>
          </div>
          <div className="gallery-mode" role="group" aria-label="浏览模式">
            <button type="button" aria-label="网格浏览" aria-pressed={mode === 'grid'} disabled={!ready} onClick={() => { motionRef.current?.setMode('grid'); setMode('grid') }}><ViewIcon /></button>
            <button type="button" aria-label="大图浏览" aria-pressed={mode === 'full'} disabled={!ready} onClick={() => { motionRef.current?.setMode('full'); setMode('full') }}><ViewIcon full /></button>
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

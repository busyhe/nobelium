import Link from 'next/link'
import { useRouter } from 'next/router'
import { useConfig } from '@/lib/config'

export default function Header ({ immersive = false, headerRef }) {
  const BLOG = useConfig()
  const { pathname } = useRouter()
  const isPost = pathname === '/[slug]'

  return (
    <header ref={headerRef} className={`site-header${immersive ? ' site-header--immersive' : ''}`}>
      <Link href={BLOG.path || '/'} className="site-wordmark" aria-label={`${BLOG.author} — 首页`}>
        {BLOG.author}<span aria-hidden="true">®</span>
      </Link>
      <p className="site-header-note">A personal collection<br />of moments & stories.</p>
      <nav className="site-nav" aria-label="主导航">
        {isPost ? (
          <Link href={BLOG.path || '/'} className="text-link">Close <span aria-hidden="true">×</span></Link>
        ) : (
          <>
            <Link href={BLOG.path || '/'} className="text-link" aria-current={pathname === '/' ? 'page' : undefined}>Work</Link>
            <span className="nav-comma" aria-hidden="true">,</span>
            <Link href="/search" className="text-link" aria-current={pathname === '/search' || pathname === '/tag/[tag]' ? 'page' : undefined}>Index</Link>
            <span className="nav-comma" aria-hidden="true">,</span>
            {BLOG.showAbout ? (
              <Link href="/about" className="text-link">About</Link>
            ) : (
              <a href={BLOG.profileLink || BLOG.socialLink} target="_blank" rel="noreferrer" className="text-link">About <span aria-hidden="true">↗</span></a>
            )}
          </>
        )}
      </nav>
    </header>
  )
}

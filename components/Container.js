import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { useConfig } from '@/lib/config'
import Head from 'next/head'
import PropTypes from 'prop-types'
import cn from 'classnames'
import { useRouter } from 'next/router'
import { canonicalUrl, sitePath } from '@/lib/urls'

const Container = ({ children, layout, fullWidth, headerRef, ...customMeta }) => {
  const BLOG = useConfig()
  const immersive = layout === 'gallery'
  const router = useRouter()

  const meta = {
    title: BLOG.title,
    description: BLOG.description,
    type: 'website',
    ...customMeta
  }
  const url = canonicalUrl(BLOG.link, meta.slug ? sitePath(BLOG.path, encodeURIComponent(meta.slug)) : router.asPath)
  const image = meta.image || `${BLOG.ogImageGenerateURL}/${encodeURIComponent(meta.title)}.png?theme=dark&md=1&fontSize=125px`
  return (
    <div>
      <Head>
        <title>{meta.title}</title>
        <link rel="canonical" href={url} />
        {!immersive && <link rel="preload" href={BLOG.font === 'serif' ? '/fonts/SourceSerif.var.woff2' : '/fonts/IBMPlexSansVar-Roman.woff2'} as="font" type="font/woff2" crossOrigin="anonymous" />}
        {/* <meta content={BLOG.darkBackground} name="theme-color" /> */}
        <meta name="robots" content="follow, index" />
        <meta charSet="UTF-8" />
        {BLOG.seo.googleSiteVerification && (
          <meta
            name="google-site-verification"
            content={BLOG.seo.googleSiteVerification}
          />
        )}
        {BLOG.seo.keywords && (
          <meta name="keywords" content={BLOG.seo.keywords.join(', ')} />
        )}
        <meta name="description" content={meta.description} />
        <meta property="og:locale" content={BLOG.lang} />
        <meta property="og:title" content={meta.title} />
        <meta property="og:description" content={meta.description} />
        <meta
          property="og:url"
          content={url}
        />
        <meta
          property="og:image"
          content={image}
        />
        <meta property="og:type" content={meta.type} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:description" content={meta.description} />
        <meta name="twitter:title" content={meta.title} />
        <meta
          name="twitter:image"
          content={image}
        />
        {meta.type === 'article' && (
          <>
            <meta
              property="article:published_time"
              content={meta.date}
            />
            <meta property="article:author" content={BLOG.author} />
          </>
        )}
      </Head>
      <div
        className={cn('wrapper', { 'wrapper--gallery': immersive }, BLOG.font === 'serif' ? 'font-serif' : 'font-sans')}
      >
        <a href="#main-content" className="skip-link">跳至内容</a>
        <Header immersive={immersive} headerRef={headerRef} />
        <main className={cn(
          'site-main',
          immersive ? 'site-main--gallery' : layout === 'blog' ? 'site-main--post' : 'site-main--index',
          { 'site-main--wide': fullWidth }
        )} id="main-content">
          {children}
        </main>
        {!immersive && <Footer />}
      </div>
    </div>
  )
}

Container.propTypes = {
  children: PropTypes.node
}

export default Container

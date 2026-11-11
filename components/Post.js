import { useConfig } from '@/lib/config'
import useTheme from '@/lib/theme'
import FormattedDate from '@/components/FormattedDate'
import TagItem from '@/components/TagItem'
import Photo from '@/components/Photo'
import NotionRenderer from '@/components/NotionRenderer'
import TableOfContents from '@/components/TableOfContents'

export default function Post ({ post, blockMap, fullWidth = false }) {
  const BLOG = useConfig()
  const { dark } = useTheme()
  const isPage = post.type?.includes('Page')

  return (
    <article className={`post${fullWidth ? ' post--wide' : ''}`}>
      <header className="post-header">
        <p className="eyebrow">{isPage ? 'About / 关于' : 'A story from the collection'}</p>
        <h1>{post.title}</h1>
        {!isPage && (
          <div className="post-meta">
            <span>{BLOG.author}</span>
            {post.date && <time dateTime={new Date(post.date).toISOString()}><FormattedDate date={post.date} /></time>}
            {!!post.tags?.length && <nav className="article-tags" aria-label="文章标签">{post.tags.map(tag => <TagItem key={tag} tag={tag} />)}</nav>}
          </div>
        )}
      </header>
      {post.page_cover && <div className="post-cover"><Photo src={post.page_cover} title={post.title} priority sizes="(max-width: 680px) 90vw, 85vw" /></div>}
      <div className="post-content">
        <div className="post-body"><NotionRenderer recordMap={blockMap} fullPage={false} darkMode={dark} /></div>
        <div className="post-toc"><TableOfContents blockMap={blockMap} /></div>
      </div>
    </article>
  )
}

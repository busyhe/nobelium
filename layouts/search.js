import { useRouter } from 'next/router'
import BlogPost from '@/components/BlogPost'
import Container from '@/components/Container'
import GalleryGrid from '@/components/GalleryGrid'
import Tags from '@/components/Tags'
import { useConfig } from '@/lib/config'

export default function SearchLayout ({ tags, posts, currentTag }) {
  const BLOG = useConfig()
  const router = useRouter()
  const searchValue = typeof router.query.q === 'string' ? router.query.q : ''
  const setSearchValue = value => {
    const query = { ...router.query }
    if (value) query.q = value
    else delete query.q
    router.replace({ pathname: router.pathname, query }, undefined, { shallow: true, scroll: false }).catch(() => {})
  }
  const query = searchValue.trim().toLowerCase()
  const filteredPosts = posts.filter(post => [post.title, post.summary, ...(post.tags || [])].filter(Boolean).join(' ').toLowerCase().includes(query))

  return (
    <Container title={`${currentTag?.name || 'Index'} — ${BLOG.title}`}>
      <div className="index-heading">
        <div>
          <p className="eyebrow">The archive / 作品索引</p>
          <h1>{currentTag?.name || 'Index'}<sup>({String(posts.length).padStart(2, '0')})</sup></h1>
        </div>
        <p className="index-description">一些值得留下的瞬间。<br />关于日常、远方，以及生活里的发现。</p>
      </div>
      <div className="index-toolbar">
        <Tags tags={tags} currentTag={currentTag} />
        <label className="search-field">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true"><circle cx="10" cy="10" r="6.5" /><path d="m15 15 6 6" /></svg>
          <span className="sr-only">搜索作品</span>
          <input type="search" placeholder={currentTag ? `在 ${currentTag.name} 中搜索…` : '搜索标题、描述或标签…'} value={searchValue} onChange={e => setSearchValue(e.target.value)} />
        </label>
      </div>
      <p className="result-count" role="status">{String(filteredPosts.length).padStart(2, '0')} STORIES{query && ` / “${searchValue.trim()}”`}</p>
      {filteredPosts.length ? (
        <GalleryGrid>
          {filteredPosts.map((post, index) => <BlogPost key={post.id} post={post} index={index} priority={index < 4} />)}
        </GalleryGrid>
      ) : (
        <div className="search-empty">
          <h2>没有找到相关作品。</h2>
          <p>试试其他关键词，或从分类中重新发现。</p>
          {searchValue && <button type="button" onClick={() => setSearchValue('')}>清除搜索 ↗</button>}
        </div>
      )}
    </Container>
  )
}

import Link from 'next/link'
import { useConfig } from '@/lib/config'
import { sitePath } from '@/lib/urls'

export default function Tags ({ tags = [], currentTag }) {
  const { path } = useConfig()
  return (
    <nav aria-label="作品分类">
      <ul className="tag-list">
        <li><Link href={sitePath(path, 'search')} className="text-link" aria-current={!currentTag ? 'page' : undefined}>All works</Link></li>
        {tags.map(tag => (
          <li key={tag.slug}><Link href={sitePath(path, `tag/${encodeURIComponent(tag.slug)}`)} prefetch={false} className="text-link" aria-current={tag.slug === currentTag?.slug ? 'page' : undefined}>{tag.name}<sup>{tag.count}</sup></Link></li>
        ))}
      </ul>
    </nav>
  )
}

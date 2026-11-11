import Link from 'next/link'

export default function Tags ({ tags = {}, currentTag }) {
  return (
    <nav aria-label="作品分类">
      <ul className="tag-list">
        <li><Link href="/search" className="text-link" aria-current={!currentTag ? 'page' : undefined}>All works</Link></li>
        {Object.entries(tags).map(([tag, count]) => (
          <li key={tag}><Link href={`/tag/${encodeURIComponent(tag)}`} className="text-link" aria-current={tag === currentTag ? 'page' : undefined}>{tag}<sup>{count}</sup></Link></li>
        ))}
      </ul>
    </nav>
  )
}

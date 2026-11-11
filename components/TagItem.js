import Link from 'next/link'

export default function TagItem ({ tag }) {
  return <Link href={`/tag/${encodeURIComponent(tag)}`} className="article-tag text-link">{tag}</Link>
}

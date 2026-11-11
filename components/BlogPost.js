import Link from 'next/link'
import { useConfig } from '@/lib/config'
import FormattedDate from '@/components/FormattedDate'
import Photo from '@/components/Photo'

export default function BlogPost ({ post, priority = false, index = 0 }) {
  const BLOG = useConfig()

  return (
    <Link href={`${BLOG.path}/${encodeURIComponent(post.slug)}`} data-post-id={post.id} className="archive-card" prefetch={false}>
      <article>
        <div className="archive-card-photo">
          <Photo src={post.page_cover} title={post.title} priority={priority} index={index} />
          <span className="archive-card-arrow" aria-hidden="true">↗</span>
        </div>
        <div className="archive-card-caption">
          <h2>{post.title}</h2>
          {post.date && <time dateTime={new Date(post.date).toISOString()}><FormattedDate date={post.date} /></time>}
        </div>
      </article>
    </Link>
  )
}

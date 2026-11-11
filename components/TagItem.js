import Link from 'next/link'
import { useConfig } from '@/lib/config'
import { getPostCategories } from '@/lib/content/categories'
import { sitePath } from '@/lib/urls'

export default function TagItem ({ tag }) {
  const { path } = useConfig()
  const category = getPostCategories({ tags: [tag] })[0]
  return <Link href={sitePath(path, `tag/${encodeURIComponent(category.slug)}`)} className="article-tag text-link">{category.name}</Link>
}

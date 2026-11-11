import { getAllPosts, getAllTagsFromPosts } from '@/lib/notion'
import { config } from '@/lib/server/config'
import SearchLayout from '@/layouts/search'
import { useRouter } from 'next/router'
import RouteSkeleton from '@/components/RouteSkeleton'
import { DEFAULT_CATEGORY, getPostCategories } from '@/lib/content/categories'
import { sitePath } from '@/lib/urls'

export default function Tag ({ tags, posts, currentTag }) {
  const router = useRouter()

  if (router.isFallback) return <RouteSkeleton route={router.asPath} />

  return <SearchLayout tags={tags} posts={posts} currentTag={currentTag} />
}

export async function getStaticProps ({ params }) {
  const posts = await getAllPosts({ includePages: false })
  const tags = getAllTagsFromPosts(posts)
  const currentTag = tags.find(tag => tag.slug === params.tag)
  if (!currentTag) {
    if (params.tag === 'Journal' && tags.some(tag => tag.slug === DEFAULT_CATEGORY.slug)) {
      return { redirect: { destination: sitePath(config.path, `tag/${DEFAULT_CATEGORY.slug}`), permanent: false }, revalidate: config.revalidateTime }
    }
    return { notFound: true, revalidate: config.revalidateTime }
  }
  const filteredPosts = posts.filter(post => getPostCategories(post).some(tag => tag.slug === currentTag.slug))
  return {
    props: {
      tags,
      posts: filteredPosts,
      currentTag
    },
    revalidate: config.revalidateTime
  }
}

export async function getStaticPaths () {
  const posts = await getAllPosts({ includePages: false })
  const tags = getAllTagsFromPosts(posts)
  return {
    paths: tags.map(tag => ({ params: { tag: tag.slug } })),
    fallback: true
  }
}

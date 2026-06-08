import { getAllPosts, getAllTagsFromPosts } from '@/lib/notion'
import { config } from '@/lib/server/config'
import SearchLayout from '@/layouts/search'
import { useRouter } from 'next/router'
import RouteSkeleton from '@/components/RouteSkeleton'

export default function Tag ({ tags, posts, currentTag }) {
  const router = useRouter()

  if (router.isFallback) return <RouteSkeleton route={router.asPath} />

  return <SearchLayout tags={tags} posts={posts} currentTag={currentTag} />
}

export async function getStaticProps ({ params }) {
  const currentTag = params.tag
  const posts = await getAllPosts({ includePages: false })
  const tags = getAllTagsFromPosts(posts)
  const filteredPosts = posts.filter(
    post => post && post.tags && post.tags.includes(currentTag)
  )
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
    paths: Object.keys(tags).map(tag => ({ params: { tag } })),
    fallback: true
  }
}

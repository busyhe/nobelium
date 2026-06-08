import { getAllPosts, getAllTagsFromPosts } from '@/lib/notion'
import { clientConfig } from '@/lib/server/config'
import SearchLayout from '@/layouts/search'

export default function search ({ tags, posts }) {
  return <SearchLayout tags={tags} posts={posts} />
}
export async function getStaticProps () {
  const posts = await getAllPosts({ includePages: false })
  const tags = getAllTagsFromPosts(posts)
  return {
    props: {
      tags,
      posts
    },
    revalidate: clientConfig.revalidateTime
  }
}

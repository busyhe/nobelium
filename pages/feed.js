import { getAllPosts } from '@/lib/notion'
import { config } from '@/lib/server/config'
import { generateRss } from '@/lib/rss'

export async function getServerSideProps ({ res }) {
  res.setHeader('Content-Type', 'text/xml')
  res.setHeader(
    'Cache-Control',
    `s-maxage=${config.revalidateTime}, stale-while-revalidate=${config.revalidateTime * 6}`
  )
  const posts = await getAllPosts({ includePages: false })
  const latestPosts = posts.slice(0, 10)
  const xmlFeed = await generateRss(latestPosts)
  res.write(xmlFeed)
  res.end()
  return {
    props: {}
  }
}
const feed = () => null
export default feed

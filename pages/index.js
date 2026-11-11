import { clientConfig } from '@/lib/server/config'

import Container from '@/components/Container'
import PortfolioGallery from '@/components/PortfolioGallery'
import { getAllPosts } from '@/lib/notion'
import { useConfig } from '@/lib/config'

export async function getStaticProps () {
  const posts = await getAllPosts({ includePages: false })
  return {
    props: {
      posts: posts || []
    },
    revalidate: clientConfig.revalidateTime
  }
}

export default function Blog ({ posts }) {
  const { title, description } = useConfig()

  return (
    <Container title={title} description={description} layout="gallery">
      <PortfolioGallery posts={posts} />
    </Container>
  )
}

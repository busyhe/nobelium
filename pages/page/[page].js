import { config } from '@/lib/server/config'

import Container from '@/components/Container'
import BlogPost from '@/components/BlogPost'
import GalleryGrid from '@/components/GalleryGrid'
import Pagination from '@/components/Pagination'
import { getAllPosts } from '@/lib/notion'

const Page = ({ postsToShow, page, showNext, totalPages }) => {
  return (
    <Container>
      <GalleryGrid>
        {postsToShow &&
          postsToShow.map((post, index) => <BlogPost key={post.id} post={post} priority={index < 4} />)}
      </GalleryGrid>
      <Pagination page={page} showNext={showNext} totalPages={totalPages} />
    </Container>
  )
}

export async function getStaticProps (context) {
  const page = Number(context.params.page) // Get Current Page No.
  if (!Number.isInteger(page) || page < 2) return { notFound: true }

  const posts = await getAllPosts({ includePages: false })
  const postsToShow = posts.slice(
    config.postsPerPage * (page - 1),
    config.postsPerPage * page
  )
  if (!postsToShow.length) return { notFound: true }

  const totalPosts = posts.length
  const totalPages = Math.ceil(totalPosts / config.postsPerPage)
  const showNext = page * config.postsPerPage < totalPosts
  return {
    props: {
      page, // Current Page
      postsToShow,
      showNext,
      totalPages
    },
    revalidate: config.revalidateTime
  }
}

export async function getStaticPaths () {
  const posts = await getAllPosts({ includePages: false })
  const totalPosts = posts.length
  const totalPages = Math.ceil(totalPosts / config.postsPerPage)
  return {
    // remove first page, we 're not gonna handle that.
    paths: Array.from({ length: totalPages - 1 }, (_, i) => ({
      params: { page: '' + (i + 2) }
    })),
    fallback: 'blocking'
  }
}

export default Page

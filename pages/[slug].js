import { clientConfig } from '@/lib/server/config'

import { useRouter } from 'next/router'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { getAllPosts, getPostBlocks } from '@/lib/notion'
import { getPostPhotos } from '@/lib/notion/getPostPhotos'
import { useLocale } from '@/lib/locale'
import { useConfig } from '@/lib/config'
import Container from '@/components/Container'
import RouteSkeleton from '@/components/RouteSkeleton'
import StoryGallery from '@/components/gallery/StoryGallery'
import { getDetailProps } from '@/lib/content/models'

const Post = dynamic(() => import('@/components/Post'))
const Comments = dynamic(() => import('@/components/Comments'))

export default function BlogPost ({ post, blockMap, photos, previousPath }) {
  const router = useRouter()
  const BLOG = useConfig()
  const locale = useLocale()

  if (router.isFallback) return <RouteSkeleton route={router.asPath} />

  if (!post.type?.includes('Page')) {
    return <StoryGallery key={post.id} post={post} photos={photos} previousPath={previousPath} />
  }

  const fullWidth = post.fullWidth ?? false

  return (
    <Container
      layout="blog"
      title={post.title}
      description={post.summary}
      slug={post.slug}
      date={new Date(post.date).toISOString()}
      image={post.page_cover}
      type="article"
      fullWidth={fullWidth}
    >
      <Post
        post={post}
        blockMap={blockMap}
        fullWidth={fullWidth}
      />

      {/* Back and Top */}
      <div className="post-navigation">
        <Link href={BLOG.path || '/'} className="text-link">← {locale.POST.BACK}</Link>
        <button
          type="button"
          onClick={() => window.scrollTo({
            top: 0,
            behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'
          })}
          className="text-link"
        >
          ↑ {locale.POST.TOP}
        </button>
      </div>

      <Comments frontMatter={post} />
    </Container>
  )
}

export async function getStaticPaths () {
  const posts = await getAllPosts({ includePages: true })
  const preRenderPosts = clientConfig.preRenderPosts ?? clientConfig.postsPerPage
  return {
    paths: posts.slice(0, preRenderPosts).map(row => `${clientConfig.path}/${row.slug}`),
    fallback: 'blocking'
  }
}

export async function getStaticProps ({ params: { slug } }) {
  const posts = await getAllPosts({ includePages: true })
  const post = posts.find(t => t.slug === slug)

  if (!post) return { notFound: true, revalidate: clientConfig.revalidateTime }

  const blockMap = await getPostBlocks(post.id)

  return {
    props: getDetailProps(post, blockMap, post.type?.includes('Page') ? [] : getPostPhotos(post, blockMap)),
    revalidate: clientConfig.revalidateTime
  }
}

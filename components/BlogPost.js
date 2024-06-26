import Link from 'next/link'
import Image from 'next/image'
import { useConfig } from '@/lib/config'
import FormattedDate from '@/components/FormattedDate'

const BlogPost = ({ post }) => {
  const BLOG = useConfig()

  return (
    <Link href={`${BLOG.path}/${post.slug}`}>
      <article key={post.id} className="mb-6 md:mb-8">
        <header className="flex flex-col justify-between md:items-baseline">
          {/* <img className="flex-shrink-0 w-16 h-16 rounded-full" src={post.page_cover} /> */}
          <Image
            className='object-cover w-full h-40 rounded-lg mb-6'
            width={500}
            height={500}
            src={post.page_cover}
            alt={BLOG.title}
            priority={true}
          />
          <h2 className="text-lg md:text-xl font-medium mb-2 cursor-pointer text-black dark:text-gray-100">
            {post.title}
          </h2>
          <time className="flex-shrink-0 text-gray-600 dark:text-gray-400">
            <FormattedDate date={post.date} />
          </time>
        </header>
        {/* <main>
          <p className="hidden md:block leading-8 text-gray-700 dark:text-gray-300">
            {post.summary}
          </p>
        </main> */}
      </article>
    </Link>
  )
}

export default BlogPost

import Link from 'next/link'
import Image from 'next/image'
import { useConfig } from '@/lib/config'
import FormattedDate from '@/components/FormattedDate'

const BlogPost = ({ post }) => {
  const BLOG = useConfig()

  return (
    <Link href={`${BLOG.path}/${post.slug}`}>
      <article
        key={post.id}
        className="group bg-white dark:bg-gray-800 p-3 pb-8 shadow-md hover:shadow-xl
          transition-all duration-300 cursor-pointer
          hover:-translate-y-1 hover:rotate-0
          odd:-rotate-1 even:rotate-1"
      >
        <div className="relative overflow-hidden aspect-[4/3]">
          <Image
            className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
            width={500}
            height={500}
            src={post.page_cover}
            alt={BLOG.title}
            priority={true}
          />
        </div>
        <div className="mt-4 px-1 text-center">
          <h2 className="text-sm md:text-base font-medium text-gray-800 dark:text-gray-100 line-clamp-2 leading-snug">
            {post.title}
          </h2>
          <time className="block mt-2 text-xs text-gray-400 dark:text-gray-500 font-light tracking-wide">
            <FormattedDate date={post.date} />
          </time>
        </div>
      </article>
    </Link>
  )
}

export default BlogPost

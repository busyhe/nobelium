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
        className="group relative bg-[#fafaf8] dark:bg-gray-800
          p-[10px] pb-12 rounded-sm
          shadow-[0_2px_8px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.06)]
          hover:shadow-[0_8px_24px_rgba(0,0,0,0.12),0_2px_6px_rgba(0,0,0,0.08)]
          transition-all duration-500 ease-out cursor-pointer
          hover:-translate-y-2 hover:rotate-0
          odd:-rotate-[1.5deg] even:rotate-[1.5deg]
          before:absolute before:inset-0 before:rounded-sm
          before:shadow-[inset_0_0_0_1px_rgba(0,0,0,0.04)]
          before:pointer-events-none"
      >
        {/* 照片区域 */}
        <div className="relative overflow-hidden aspect-[4/3] bg-gray-100 dark:bg-gray-700">
          <Image
            className="object-cover w-full h-full transition-transform duration-500 ease-out group-hover:scale-105"
            width={500}
            height={500}
            src={post.page_cover}
            alt={BLOG.title}
            priority={true}
          />
          {/* 照片内边框 */}
          <div className="absolute inset-0 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.06)] pointer-events-none" />
          {/* 照片光泽感 */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/5 pointer-events-none" />
        </div>
        {/* 底部文字区域 - 模拟手写区 */}
        <div className="mt-4 px-1 text-center space-y-1.5">
          <h2 className="text-sm md:text-base font-medium text-gray-700 dark:text-gray-100 line-clamp-2 leading-snug tracking-tight">
            {post.title}
          </h2>
          <time className="block text-[11px] text-gray-300 dark:text-gray-600 font-light tracking-widest uppercase">
            <FormattedDate date={post.date} />
          </time>
        </div>
      </article>
    </Link>
  )
}

export default BlogPost

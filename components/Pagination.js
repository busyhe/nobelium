import Link from 'next/link'
import { useConfig } from '@/lib/config'
import { useLocale } from '@/lib/locale'

const Pagination = ({ page, showNext }) => {
  const BLOG = useConfig()
  const locale = useLocale()
  const currentPage = +page
  const pageHref = targetPage =>
    targetPage === 1
      ? BLOG.path || '/'
      : `${BLOG.path}/page/${targetPage}`
  const linkClassName = [
    'inline-flex h-10 items-center gap-2 rounded-md border border-gray-200 bg-white px-4 text-sm',
    'text-gray-700 shadow-sm transition hover:-translate-y-0.5 hover:border-gray-300 hover:text-black',
    'dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:border-gray-500 dark:hover:text-white'
  ].join(' ')

  return (
    <nav
      aria-label="Pagination"
      className="mt-10 grid w-full grid-cols-[1fr_auto_1fr] items-center gap-3"
    >
      <div className="justify-self-start">
        {currentPage !== 1 && (
          <Link
            href={pageHref(currentPage - 1)}
            rel="prev"
            className={linkClassName}
          >
            <span aria-hidden="true">←</span>
            <span>{locale.PAGINATION.PREV}</span>
          </Link>
        )}
      </div>

      <span
        className="inline-flex h-10 min-w-10 items-center justify-center rounded-md border border-gray-100 bg-[#fafaf8] px-3 text-sm font-medium text-gray-500 shadow-sm dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400"
        aria-label={`Page ${currentPage}`}
      >
        {currentPage}
      </span>

      <div className="justify-self-end">
        {showNext && (
          <Link
            href={pageHref(currentPage + 1)}
            rel="next"
            className={linkClassName}
          >
            <span>{locale.PAGINATION.NEXT}</span>
            <span aria-hidden="true">→</span>
          </Link>
        )}
      </div>
    </nav>
  )
}

export default Pagination

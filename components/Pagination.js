import Link from 'next/link'
import { useConfig } from '@/lib/config'
import { useLocale } from '@/lib/locale'

const Pagination = ({ page, showNext, totalPages }) => {
  const BLOG = useConfig()
  const locale = useLocale()
  const currentPage = +page
  const pageCount = Math.max(1, Number(totalPages) || 1)
  const pages = Array.from({ length: pageCount }, (_, index) => index + 1)
  const pageHref = targetPage =>
    targetPage === 1
      ? BLOG.path || '/'
      : `${BLOG.path}/page/${targetPage}`
  const linkClassName = [
    'inline-flex h-10 w-10 items-center justify-center gap-2 rounded-md border border-gray-200 bg-white px-0 text-sm sm:w-auto sm:px-4',
    'text-gray-700 shadow-sm transition hover:-translate-y-0.5 hover:border-gray-300 hover:text-black',
    'dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:border-gray-500 dark:hover:text-white'
  ].join(' ')
  const pageLinkClassName = [
    'inline-flex h-10 min-w-10 items-center justify-center rounded-md border border-gray-200 bg-white px-3 text-sm',
    'text-gray-700 shadow-sm transition hover:-translate-y-0.5 hover:border-gray-300 hover:text-black',
    'dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:border-gray-500 dark:hover:text-white'
  ].join(' ')
  const currentPageClassName = [
    'inline-flex h-10 min-w-10 items-center justify-center rounded-md border border-gray-100 bg-[#fafaf8] px-3 text-sm font-medium',
    'text-gray-500 shadow-sm dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400'
  ].join(' ')

  return (
    <nav
      aria-label="Pagination"
      className="mt-10 grid w-full grid-cols-[minmax(0,1fr)_minmax(0,auto)_minmax(0,1fr)] items-center gap-3"
    >
      <div className="justify-self-start">
        {currentPage !== 1 && (
          <Link
            href={pageHref(currentPage - 1)}
            rel="prev"
            className={linkClassName}
            aria-label={locale.PAGINATION.PREV}
          >
            <span aria-hidden="true">←</span>
            <span className="hidden sm:inline">{locale.PAGINATION.PREV}</span>
          </Link>
        )}
      </div>

      <div className="flex max-w-full flex-wrap items-center justify-center gap-2 justify-self-center">
        {pages.map(targetPage =>
          targetPage === currentPage ? (
            <span
              key={targetPage}
              className={currentPageClassName}
              aria-current="page"
              aria-label={`Page ${currentPage}`}
            >
              {targetPage}
            </span>
          ) : (
            <Link
              key={targetPage}
              href={pageHref(targetPage)}
              className={pageLinkClassName}
              aria-label={`Go to page ${targetPage}`}
            >
              {targetPage}
            </Link>
          )
        )}
      </div>

      <div className="justify-self-end">
        {showNext && (
          <Link
            href={pageHref(currentPage + 1)}
            rel="next"
            className={linkClassName}
            aria-label={locale.PAGINATION.NEXT}
          >
            <span className="hidden sm:inline">{locale.PAGINATION.NEXT}</span>
            <span aria-hidden="true">→</span>
          </Link>
        )}
      </div>
    </nav>
  )
}

export default Pagination

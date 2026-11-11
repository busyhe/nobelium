import Link from 'next/link'
import { useConfig } from '@/lib/config'
import { useLocale } from '@/lib/locale'

export default function Pagination ({ page, showNext, totalPages }) {
  const BLOG = useConfig()
  const locale = useLocale()
  const currentPage = Number(page)
  const pageCount = Math.max(1, Number(totalPages) || 1)
  const pageHref = target => target === 1 ? BLOG.path || '/' : `${BLOG.path}/page/${target}`
  const pages = Array.from({ length: pageCount }, (_, i) => i + 1)

  return (
    <nav className="pagination" aria-label="分页">
      <div>{currentPage > 1 && <Link href={pageHref(currentPage - 1)} rel="prev" className="text-link" aria-label={locale.PAGINATION.PREV}>← <span className="pagination-label">{locale.PAGINATION.PREV}</span></Link>}</div>
      <div className="pagination-pages">
        {pages.map(target => target === currentPage ? (
          <span key={target} aria-current="page" aria-label={`第 ${target} 页`}>{String(target).padStart(2, '0')}</span>
        ) : (
          <Link key={target} href={pageHref(target)} aria-label={`第 ${target} 页`}>{String(target).padStart(2, '0')}</Link>
        ))}
      </div>
      <div>{showNext && <Link href={pageHref(currentPage + 1)} rel="next" className="text-link" aria-label={locale.PAGINATION.NEXT}><span className="pagination-label">{locale.PAGINATION.NEXT}</span> →</Link>}</div>
    </nav>
  )
}

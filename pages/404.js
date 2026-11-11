import Link from 'next/link'
import { useLocale } from '@/lib/locale'
import { useConfig } from '@/lib/config'
import Container from '@/components/Container'

export default function Page404 () {
  const locale = useLocale()
  const BLOG = useConfig()

  return (
    <Container title={`404 — ${BLOG.title}`}>
      <div className="error-page">
        <span className="eyebrow">Out of frame</span>
        <h1>404</h1>
        <p>{locale.PAGE.ERROR_404.MESSAGE}</p>
        <Link href={BLOG.path || '/'} className="text-link">返回作品集 ↗</Link>
      </div>
    </Container>
  )
}

import { useConfig } from '@/lib/config'
import Link from 'next/link'

export default function Footer () {
  const BLOG = useConfig()
  const year = new Date().getFullYear()
  const from = Number(BLOG.since)

  return (
    <footer className="site-footer">
      <p>© {BLOG.author} {from && from !== year ? `${from}–${year}` : year}</p>
      <p className="site-footer-note">Moments, collected.</p>
      <Link href="/feed" prefetch={false} target="_blank" rel="noreferrer" className="text-link">RSS <span aria-hidden="true">↗</span></Link>
    </footer>
  )
}

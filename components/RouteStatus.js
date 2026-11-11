import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import { readSession, writeSession } from '@/lib/session'

export default function RouteStatus ({ onNavigate }) {
  const router = useRouter()
  const [status, setStatus] = useState(null)
  const pending = useRef(null)
  const routerRef = useRef(router)
  useEffect(() => { routerRef.current = router }, [router])

  useEffect(() => {
    let frame
    const start = (url, { shallow } = {}) => {
      const currentPath = routerRef.current.asPath
      if (shallow || url.split(/[?#]/)[0] === currentPath.split(/[?#]/)[0]) return
      window.cancelAnimationFrame(frame)
      writeSession(`browse:${currentPath}`, {
        y: window.scrollY,
        postId: document.activeElement?.closest('[data-post-id]')?.dataset.postId
      })
      onNavigate(currentPath)
      pending.current = url
      setStatus({ url, error: false })
    }
    const complete = (url, { shallow } = {}) => {
      if (shallow) return
      pending.current = null
      setStatus(null)
      const saved = readSession(`browse:${url}`)
      if (!saved) return
      frame = window.requestAnimationFrame(() => {
        frame = window.requestAnimationFrame(() => {
          window.scrollTo({ top: Number(saved.y) || 0, behavior: 'instant' })
          if (saved.postId) document.querySelector(`a[data-post-id="${CSS.escape(saved.postId)}"], .gallery-frame[data-post-id="${CSS.escape(saved.postId)}"][tabindex="0"]`)?.focus({ preventScroll: true })
        })
      })
    }
    const error = (error, url) => {
      if (pending.current !== url) return
      pending.current = null
      setStatus(error.cancelled ? null : { url, error: true })
    }
    router.events.on('routeChangeStart', start)
    router.events.on('routeChangeComplete', complete)
    router.events.on('routeChangeError', error)
    return () => {
      window.cancelAnimationFrame(frame)
      router.events.off('routeChangeStart', start)
      router.events.off('routeChangeComplete', complete)
      router.events.off('routeChangeError', error)
    }
  }, [router.events, onNavigate])

  if (!status) return null
  return <div className={`route-status${status.error ? ' route-status--error' : ''}`} role={status.error ? 'alert' : 'status'}>
    <span>{status.error ? '暂时无法打开页面。' : '正在加载页面…'}</span>
    {status.error && <><button type="button" onClick={() => { setStatus({ ...status, error: false }); router.push(status.url).catch(() => {}) }}>重试</button><button type="button" aria-label="关闭提示" onClick={() => setStatus(null)}>关闭</button></>}
  </div>
}

import 'prismjs/themes/prism.css'
import 'react-notion-x/src/styles.css'
import 'katex/dist/katex.min.css'
import App from 'next/app'
import '@/styles/globals.css'
import '@/styles/notion.css'
import dynamic from 'next/dynamic'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import loadLocale from '@/assets/i18n'
import { ConfigProvider } from '@/lib/config'
import { LocaleProvider } from '@/lib/locale'
import { prepareDayjs } from '@/lib/dayjs'
import { ThemeProvider } from '@/lib/theme'
import Scripts from '@/components/Scripts'
import RouteSkeleton from '@/components/RouteSkeleton'

const Ackee = dynamic(() => import('@/components/Ackee'), { ssr: false })
const Gtag = dynamic(() => import('@/components/Gtag'), { ssr: false })

export default function MyApp ({ Component, pageProps, config, locale }) {
  const router = useRouter()
  const loadingTimer = useRef()
  const [loadingRoute, setLoadingRoute] = useState(null)

  useEffect(() => {
    const clearLoadingRoute = () => {
      window.clearTimeout(loadingTimer.current)
      setLoadingRoute(null)
    }

    const handleRouteChangeStart = (url, { shallow } = {}) => {
      const nextPath = String(url || '').split(/[?#]/)[0]
      const currentPath = String(router.asPath || '').split(/[?#]/)[0]

      if (shallow || nextPath === currentPath) return

      window.clearTimeout(loadingTimer.current)
      loadingTimer.current = window.setTimeout(() => {
        setLoadingRoute(url)
      }, 120)
    }

    router.events.on('routeChangeStart', handleRouteChangeStart)
    router.events.on('routeChangeComplete', clearLoadingRoute)
    router.events.on('routeChangeError', clearLoadingRoute)

    return () => {
      window.clearTimeout(loadingTimer.current)
      router.events.off('routeChangeStart', handleRouteChangeStart)
      router.events.off('routeChangeComplete', clearLoadingRoute)
      router.events.off('routeChangeError', clearLoadingRoute)
    }
  }, [router.asPath, router.events])

  return (
    <ConfigProvider value={config}>
      <Scripts />
      <LocaleProvider value={locale}>
        <ThemeProvider>
          <>
            {process.env.VERCEL_ENV === 'production' && config?.analytics?.provider === 'ackee' && (
              <Ackee
                ackeeServerUrl={config.analytics.ackeeConfig.dataAckeeServer}
                ackeeDomainId={config.analytics.ackeeConfig.domainId}
              />
            )}
            {process.env.VERCEL_ENV === 'production' && config?.analytics?.provider === 'ga' && <Gtag />}
            {loadingRoute ? <RouteSkeleton route={loadingRoute} /> : <Component {...pageProps} />}
          </>
        </ThemeProvider>
      </LocaleProvider>
    </ConfigProvider>
  )
}

MyApp.getInitialProps = async ctx => {
  const config = typeof window === 'object'
    ? await fetch('/api/config').then(res => res.json())
    : await import('@/lib/server/config').then(module => module.clientConfig)

  prepareDayjs(config.timezone)

  return {
    ...App.getInitialProps(ctx),
    config,
    locale: await loadLocale('basic', config.lang)
  }
}

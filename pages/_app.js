import 'prismjs/themes/prism.css'
import 'react-notion-x/styles.css'
import 'katex/dist/katex.min.css'
import App from 'next/app'
import '@/styles/globals.css'
import '@/styles/gallery.css'
import '@/styles/notion.css'
import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import loadLocale from '@/assets/i18n'
import { ConfigProvider } from '@/lib/config'
import { LocaleProvider } from '@/lib/locale'
import { prepareDayjs } from '@/lib/dayjs'
import { ThemeProvider } from '@/lib/theme'
import Scripts from '@/components/Scripts'

const Ackee = dynamic(() => import('@/components/Ackee'), { ssr: false })
const Gtag = dynamic(() => import('@/components/Gtag'), { ssr: false })

export default function MyApp ({ Component, pageProps, config, locale }) {
  const router = useRouter()
  const [previousPath, setPreviousPath] = useState(null)

  useEffect(() => {
    const handleRouteChangeStart = (url, { shallow } = {}) => {
      const nextPath = String(url || '').split(/[?#]/)[0]
      const currentPath = String(router.asPath || '').split(/[?#]/)[0]

      if (shallow || nextPath === currentPath) return

      setPreviousPath(router.asPath)
    }

    router.events.on('routeChangeStart', handleRouteChangeStart)

    return () => {
      router.events.off('routeChangeStart', handleRouteChangeStart)
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
            <Component {...pageProps} previousPath={previousPath} />
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

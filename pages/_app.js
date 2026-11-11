import App from 'next/app'
import '@/styles/globals.css'
import '@/styles/gallery.css'
import dynamic from 'next/dynamic'
import { useState } from 'react'
import loadLocale from '@/assets/i18n'
import { ConfigProvider } from '@/lib/config'
import { LocaleProvider } from '@/lib/locale'
import { prepareDayjs } from '@/lib/dayjs'
import { ThemeProvider } from '@/lib/theme'
import Scripts from '@/components/Scripts'
import RouteStatus from '@/components/RouteStatus'

const Ackee = dynamic(() => import('@/components/Ackee'), { ssr: false })
const Gtag = dynamic(() => import('@/components/Gtag'), { ssr: false })

export default function MyApp ({ Component, pageProps, config, locale }) {
  const [previousPath, setPreviousPath] = useState(null)

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
            <RouteStatus onNavigate={setPreviousPath} />
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
    ...await App.getInitialProps(ctx),
    config,
    locale: await loadLocale('basic', config.lang)
  }
}

export function reportWebVitals ({ name, value, id }) {
  // Reuse the configured analytics script; no additional endpoint or identifier.
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', name, { event_category: 'Web Vitals', event_label: id, value: Math.round(name === 'CLS' ? value * 1000 : value), non_interaction: true })
  }
}

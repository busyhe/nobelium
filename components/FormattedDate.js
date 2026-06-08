import { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import localizedFormat from 'dayjs/plugin/localizedFormat'
import { useConfig } from '@/lib/config'

dayjs.extend(localizedFormat)

const defaultLocale = 'en'
const localeMap = {
  'en-US': 'en',
  'zh-CN': 'zh-cn',
  'zh-HK': 'zh-hk',
  'zh-TW': 'zh-tw',
  'ja-JP': 'ja',
  'es-ES': 'es'
}
const localeLoaders = {
  en: () => Promise.resolve(),
  'zh-cn': () => import('dayjs/locale/zh-cn'),
  'zh-hk': () => import('dayjs/locale/zh-hk'),
  'zh-tw': () => import('dayjs/locale/zh-tw'),
  ja: () => import('dayjs/locale/ja'),
  es: () => import('dayjs/locale/es')
}
const loaded = {
  en: true
}

export default function FormattedDate ({ date }) {
  const locale = localeMap[useConfig().lang] || defaultLocale
  const [activeLocale, setActiveLocale] = useState(loaded[locale] === true ? locale : defaultLocale)

  useEffect(() => {
    const loadLocale = localeLoaders[locale]
    if (!loadLocale) {
      console.warn(`dayjs locale \`${locale}\` not found`)
      return
    }

    let cancelled = false
    const localeReady = loaded[locale] === true
      ? Promise.resolve()
      : (loaded[locale] ??= loadLocale().then(() => {
          loaded[locale] = true
        }))

    localeReady.then(() => {
      if (!cancelled) setActiveLocale(locale)
    })

    return () => {
      cancelled = true
    }
  }, [locale])

  return <span>{dayjs(date).locale(activeLocale).format('ll')}</span>
}

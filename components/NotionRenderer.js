import { createElement as h, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { NotionRenderer as Renderer } from 'react-notion-x'
import { getTextContent, defaultMapImageUrl } from 'notion-utils'
import { FONTS_SANS, FONTS_SERIF } from '@/consts'
import { useConfig } from '@/lib/config'
import { prepareRecordMap } from '@/lib/content/record-map'
import 'react-notion-x/src/styles.css'
import styles from '@/styles/notion.module.css'

const NotionCollection = dynamic(() => {
  return import('react-notion-x/third-party/collection').then(module => module.Collection)
})

const Mermaid = dynamic(() => import('@/components/notion-blocks/Mermaid'), { ssr: false })
const Code = dynamic(() => import('react-notion-x/third-party/code').then(async module => {
  await import('prismjs/themes/prism.css')
  // Additional prismjs syntax
  await Promise.all([
    import('prismjs/components/prism-markup-templating'),
    import('prismjs/components/prism-markup'),
    import('prismjs/components/prism-bash'),
    import('prismjs/components/prism-c'),
    import('prismjs/components/prism-cpp'),
    import('prismjs/components/prism-csharp'),
    import('prismjs/components/prism-docker'),
    import('prismjs/components/prism-java'),
    import('prismjs/components/prism-js-templates'),
    import('prismjs/components/prism-coffeescript'),
    import('prismjs/components/prism-diff'),
    import('prismjs/components/prism-git'),
    import('prismjs/components/prism-go'),
    import('prismjs/components/prism-graphql'),
    import('prismjs/components/prism-handlebars'),
    import('prismjs/components/prism-less'),
    import('prismjs/components/prism-makefile'),
    import('prismjs/components/prism-markdown'),
    import('prismjs/components/prism-objectivec'),
    import('prismjs/components/prism-ocaml'),
    import('prismjs/components/prism-python'),
    import('prismjs/components/prism-reason'),
    import('prismjs/components/prism-rust'),
    import('prismjs/components/prism-sass'),
    import('prismjs/components/prism-scss'),
    import('prismjs/components/prism-solidity'),
    import('prismjs/components/prism-sql'),
    import('prismjs/components/prism-stylus'),
    import('prismjs/components/prism-swift'),
    import('prismjs/components/prism-wasm'),
    import('prismjs/components/prism-yaml')
  ])
  return module.Code
}))

// Component identities stay stable across parent renders.
const components = {
  Code: props => getTextContent(props.block.properties.language) === 'Mermaid' ? h(Mermaid, props) : h(Code, props),
  // Database block
  Collection: function Collection (props) {
    // Post renders the page metadata. Skipping Notion's hidden, async property
    // header also keeps the first static render and client hydration identical.
    if (props.block?.type === 'page') return null
    return h(NotionCollection, props)
  },
  // Equation block & inline variant
  Equation: dynamic(() => {
    return Promise.all([import('react-notion-x/third-party/equation'), import('katex/dist/katex.min.css')]).then(([module]) => module.Equation)
  }),
  // PDF (Embed block)
  Pdf: dynamic(() => {
    return import('react-notion-x/third-party/pdf').then(module => module.Pdf)
  }, { ssr: false }),
  // Tweet block
  Tweet: dynamic(() => {
    return import('react-tweet-embed').then(module => {
      const { default: TweetEmbed } = module
      return function Tweet ({ id }) {
        return <TweetEmbed tweetId={id} options={{ theme: 'dark' }} />
      }
    })
  })
}

const mapPageUrl = id => `https://www.notion.so/${id.replace(/-/g, '')}`

/**
 * Notion page renderer
 *
 * A wrapper of react-notion-x/NotionRenderer with predefined `components` and `mapPageUrl`
 *
 * @param props - Anything that react-notion-x/NotionRenderer supports
 */
export default function NotionRenderer (props) {
  const config = useConfig()

  const font = {
    'sans-serif': FONTS_SANS,
    'serif': FONTS_SERIF
  }[config.font]

  const recordMap = useMemo(() => prepareRecordMap(props.recordMap), [props.recordMap])

  return (
    <div className={styles.content}>
      <style jsx global>
        {`
        .notion {
          --notion-font: ${font};
        }
        `}
      </style>
      <Renderer
        components={components}
        mapImageUrl={defaultMapImageUrl}
        mapPageUrl={mapPageUrl}
        {...props}
        recordMap={recordMap}
      />
    </div>
  )
}

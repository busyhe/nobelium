import test from 'node:test'
import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { NotionRenderer } from 'react-notion-x'
import { prepareRecordMap } from '../lib/content/record-map.js'

test('installed Notion renderer keeps toggles and their nested content visible in HTML', () => {
  const recordMap = {
    block: {
      page: { value: { id: 'page', type: 'page', content: ['toggle'], properties: { title: [['Page']] } } },
      toggle: { value: { id: 'toggle', type: 'toggle', content: ['child'], properties: { title: [['展开内容']] } } },
      child: { value: { id: 'child', type: 'text', properties: { title: [['嵌套正文']] } } }
    }, collection: {}, collection_view: {}, collection_query: {}, signed_urls: {}
  }
  const before = JSON.stringify(recordMap)
  const html = renderToStaticMarkup(createElement(NotionRenderer, { recordMap: prepareRecordMap(recordMap), fullPage: false }))
  assert.match(html, /<details[^>]*notion-toggle/)
  assert.match(html, /展开内容/)
  assert.match(html, /嵌套正文/)
  assert.equal(JSON.stringify(recordMap), before)
})

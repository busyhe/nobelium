import { config as BLOG } from '@/lib/server/config'

import { idToUuid } from 'notion-utils'
import dayjs from 'dayjs'
import api from '@/lib/server/notion-api'
import getAllPageIds from './getAllPageIds'
import getPageProperties from './getPageProperties'
import filterPublishedPosts from './filterPublishedPosts'

function normalizeRecordMapEntry(map) {
  if (!map) return
  for (const key of Object.keys(map)) {
    const entry = map[key]
    if (
      entry?.value &&
      typeof entry.value === 'object' &&
      entry.value.value &&
      typeof entry.value.value === 'object' &&
      entry.value.value.id
    ) {
      map[key] = {
        value: entry.value.value,
        role: entry.value.role ?? entry.role ?? 'reader',
      }
    }
  }
}

export function normalizeRecordMap(recordMap) {
  normalizeRecordMapEntry(recordMap.block)
  normalizeRecordMapEntry(recordMap.collection)
  normalizeRecordMapEntry(recordMap.collection_view)
}

/**
 * @param {{ includePages: boolean }} - false: posts only / true: include pages
 */
export async function getAllPosts ({ includePages = false }) {
  const id = idToUuid(process.env.NOTION_PAGE_ID)

  // Fetch page without collection data — the library's collection fetching
  // fails when the API returns double-nested record map entries.
  // We normalize first, then fetch collection data manually.
  const response = await api.getPage(id, { fetchCollections: false })

  normalizeRecordMap(response)

  const collection = Object.values(response.collection)[0]?.value
  const block = response.block
  const schema = collection?.schema

  const rawMetadata = block[id].value

  // Check Type
  if (
    rawMetadata?.type !== 'collection_view_page' &&
    rawMetadata?.type !== 'collection_view'
  ) {
    console.log(`pageId "${id}" is not a database`)
    return null
  }

  // Fetch collection data manually with normalized collection_view values
  const collectionId = Object.keys(response.collection)[0]
  const viewId = rawMetadata?.view_ids?.[0]

  if (viewId && collectionId) {
    const collectionView = response.collection_view[viewId]?.value
    try {
      const collectionData = await api.getCollectionData(
        collectionId,
        viewId,
        collectionView
      )

      // Merge results into response
      const resultBlocks = collectionData?.recordMap?.block || {}
      normalizeRecordMapEntry(resultBlocks)
      Object.assign(response.block, resultBlocks)

      if (collectionData?.result?.reducerResults) {
        response.collection_query[collectionId] = {
          ...response.collection_query[collectionId],
          [viewId]: collectionData.result.reducerResults,
        }
      }
    } catch (e) {
      console.warn('Failed to fetch collection data:', e.message)
    }
  }

  // Construct Data
  const pageIds = getAllPageIds({
    collectionQuery: response.collection_query,
    collectionId,
    block: response.block,
  })
  const data = []
  for (let i = 0; i < pageIds.length; i++) {
    const id = pageIds[i]
    const properties = (await getPageProperties(id, response.block, schema)) || null

    // Add fullwidth to properties
    properties.fullWidth = response.block[id].value?.format?.page_full_width ?? false
    // Convert date (with timezone) to unix milliseconds timestamp
    properties.date = (
      properties.date?.start_date
        ? dayjs.tz(properties.date?.start_date)
        : dayjs(response.block[id].value?.created_time)
    ).valueOf()

    data.push(properties)
  }

  // remove all the the items doesn't meet requirements
  const posts = filterPublishedPosts({ posts: data, includePages })

  // Sort by date
  if (BLOG.sortByDate) {
    posts.sort((a, b) => b.date - a.date)
  }
  return posts
}

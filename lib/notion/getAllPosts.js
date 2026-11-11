import { config as BLOG } from '@/lib/server/config'

import { idToUuid, getBlockValue } from 'notion-utils'
import dayjs from 'dayjs'
import api from '@/lib/server/notion-api'
import getAllPageIds from './getAllPageIds'
import getPageProperties from './getPageProperties'
import filterPublishedPosts from './filterPublishedPosts'

const CACHE_TTL_MS = Number(process.env.NOTION_CACHE_TTL_MS || 60_000)
let allPostsCache = {
  expiresAt: 0,
  data: null
}
let allPostsRequest = null

/**
 * @param {{ includePages: boolean }} - false: posts only / true: include pages
 */
export async function getAllPosts ({ includePages = false }) {
  const now = Date.now()
  if (allPostsCache.data && now < allPostsCache.expiresAt) {
    return getPublishedPosts(allPostsCache.data, includePages)
  }

  // Static generation can request many routes before the first query finishes.
  // Share that query so the rate-limited client doesn't queue duplicate scans.
  if (!allPostsRequest) {
    allPostsRequest = loadAllPosts()
      .then(data => {
        allPostsCache = {
          data,
          expiresAt: Date.now() + CACHE_TTL_MS
        }
        return data
      })
      .finally(() => { allPostsRequest = null })
  }

  return getPublishedPosts(await allPostsRequest, includePages)
}

async function loadAllPosts () {
  const id = idToUuid(process.env.NOTION_PAGE_ID)

  // Surface a failed collection query instead of publishing an empty gallery.
  const response = await api.getPage(id, { throwOnCollectionErrors: true })

  const collection = getBlockValue(Object.values(response.collection)[0])
  const block = response.block
  const schema = collection?.schema

  const rawMetadata = getBlockValue(block[id])

  // Check Type
  if (
    rawMetadata?.type !== 'collection_view_page' &&
    rawMetadata?.type !== 'collection_view'
  ) {
    console.log(`pageId "${id}" is not a database`)
    return null
  }

  // Construct Data
  const collectionId = Object.keys(response.collection)[0]
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
    const blockValue = getBlockValue(response.block[id])
    properties.fullWidth = blockValue?.format?.page_full_width ?? false
    // Convert date (with timezone) to unix milliseconds timestamp
    properties.date = (
      properties.date?.start_date
        ? dayjs.tz(properties.date?.start_date)
        : dayjs(blockValue?.created_time)
    ).valueOf()

    data.push(properties)
  }

  return data
}

function getPublishedPosts (data, includePages) {
  // remove all the the items doesn't meet requirements
  const posts = filterPublishedPosts({ posts: data, includePages })

  // Sort by date
  if (BLOG.sortByDate) {
    posts.sort((a, b) => b.date - a.date)
  }
  return posts
}

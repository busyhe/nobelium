export default function getAllPageIds ({ collectionQuery, collectionId, block }) {
  // Primary: extract page IDs from block map
  const pageIds = Object.keys(block).filter(id => {
    const value = block[id]?.value
    return (
      value &&
      value.type === 'page' &&
      value.parent_id === collectionId &&
      value.alive !== false
    )
  })

  if (pageIds.length > 0) {
    return pageIds
  }

  // Fallback: legacy collection_query path
  if (collectionQuery) {
    const views = Object.values(collectionQuery)[0]
    if (views) {
      for (const view of Object.values(views)) {
        if (view?.blockIds?.length) {
          return view.blockIds
        }
      }
      const pageSet = new Set()
      Object.values(views).forEach(view => {
        view?.collection_group_results?.blockIds?.forEach(id => pageSet.add(id))
      })
      if (pageSet.size > 0) {
        return [...pageSet]
      }
    }
  }

  return []
}

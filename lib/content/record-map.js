// react-notion-x 8 normalizes a root collection_view by assigning block.type.
// Adapt only that wrapper chain so rendering never mutates the cached response.
// Keep native toggle types: v8 no longer renders arbitrary component type names.
function prepareRoot (entry) {
  if (!entry) return entry
  if (entry.value) {
    const value = prepareRoot(entry.value)
    return value === entry.value ? entry : { ...entry, value }
  }
  return entry.type === 'collection_view' ? { ...entry, type: 'collection_view_page' } : entry
}

export function prepareRecordMap (recordMap) {
  if (!recordMap?.block) return recordMap
  const id = Object.keys(recordMap.block)[0]
  const root = prepareRoot(recordMap.block[id])
  return root === recordMap.block[id] ? recordMap : { ...recordMap, block: { ...recordMap.block, [id]: root } }
}

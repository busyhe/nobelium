import { createContext, useContext } from 'react'
import { getBlockValue } from 'notion-utils'

const BlockMapContext = createContext({})
export function BlockMapProvider ({ blockMap, children }) {
  const collectionId = Object.keys(blockMap.collection)[0]
  const pageBlock = Object.values(blockMap.block)
    .map(b => getBlockValue(b))
    .find(v => v && v.type === 'page' && v.parent_id === collectionId)
  const pageId = pageBlock?.id

  const blockMapAltered = {
    ...blockMap,
    pageId,
  }

  return (
    <BlockMapContext.Provider value={blockMapAltered}>
      {children}
    </BlockMapContext.Provider>
  )
}

export default function useBlockMap () {
  return useContext(BlockMapContext)
}

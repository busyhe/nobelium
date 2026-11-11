import PropTypes from 'prop-types'
import { getPageTableOfContents, getBlockValue } from 'notion-utils'
import cn from 'classnames'

export default function TableOfContents ({ blockMap, className, style }) {
  const collectionId = Object.keys(blockMap.collection || {})[0]
  const blocks = Object.values(blockMap.block || {}).map(b => getBlockValue(b)).filter(Boolean)
  const page = blocks.find(block => block.type === 'page' && block.parent_id === collectionId) || blocks.find(block => block.type === 'page')
  const nodes = getPageTableOfContents(page, blockMap)

  if (!nodes.length) return null

  /**
   * @param {string} id - The ID of target heading block (could be in UUID format)
   */
  function scrollTo (id) {
    id = id.replaceAll('-', '')
    const target = document.querySelector(`.notion-block-${id}`)
    if (!target) return
    const top = document.documentElement.scrollTop + target.getBoundingClientRect().top - 32
    document.documentElement.scrollTo({
      top,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'
    })
  }

  return (
    <aside
      aria-label="文章目录"
      className={cn(className, 'pl-4 text-sm text-zinc-700/70 dark:text-neutral-400')}
      style={style}
    >
      {nodes.map(node => (
        <div key={node.id}>
          <a
            href={`#${node.id.replaceAll('-', '')}`}
            data-target-id={node.id}
            className="block py-1 hover:text-black dark:hover:text-white cursor-pointer transition duration-100"
            style={{ paddingLeft: (node.indentLevel * 24) + 'px' }}
            onClick={event => {
              event.preventDefault()
              scrollTo(node.id)
            }}
          >
            {node.text}
          </a>
        </div>
      ))}
    </aside>
  )
}

TableOfContents.propTypes = {
  blockMap: PropTypes.object.isRequired
}

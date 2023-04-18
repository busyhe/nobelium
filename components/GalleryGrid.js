/**
 * Created by busyhe on 2023/04/19.
 * Email: busyhe@qq.com
 * Description:
 */
import PropTypes from 'prop-types'
import { useConfig } from '@/lib/config'

const GalleryGrid = ({ children }) => {
  const BLOG = useConfig()

  return (
    <div className="gallery-grid grid gap-8 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {children}
    </div>
  )
}

GalleryGrid.propTypes = {
  children: PropTypes.node
}

export default GalleryGrid

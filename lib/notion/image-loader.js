// Notion resizes the image; our route keeps it same-origin for WebGL and allows
// slow upstream transfers without Next's fixed seven-second optimizer timeout.
export default function notionImageLoader ({ src, width }) {
  return `/api/notion-image?src=${encodeURIComponent(src)}&width=${width}`
}

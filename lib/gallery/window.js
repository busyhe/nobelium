export const GALLERY_SLOTS = 12
export const modulo = (value, length) => ((value % length) + length) % length

// Stable physical slots, unlimited logical positions. Four sections of overscan
// keep React commits and responsive image loading away from the viewport edge.
export function galleryWindow (groups, anchor = 0) {
  if (!groups.length) return []
  return Array.from({ length: GALLERY_SLOTS }, (_, slot) => {
    const logical = anchor - 4 + modulo(slot - (anchor - 4), GALLERY_SLOTS)
    const group = groups[modulo(logical, groups.length)]
    const cycle = Math.floor(logical / groups.length)
    return {
      ...group, slot, logical,
      columns: [0, 1].map(column => Array.from({ length: 5 }, (_, row) => group.posts[modulo(cycle * 10 + column * 5 + row, group.posts.length)]))
    }
  })
}

export function photoIndex (value, length) {
  const number = Number(value)
  return Number.isInteger(number) ? Math.max(0, Math.min(Math.max(0, length - 1), number - 1)) : 0
}

export function nearbyPhotos (length, index, radius = 2) {
  return Array.from({ length: Math.max(0, Math.min(length - 1, index + radius) - Math.max(0, index - radius) + 1) }, (_, offset) => Math.max(0, index - radius) + offset)
}

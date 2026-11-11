// The controller owns when frames are needed; GSAP still owns animation timing.
export function createFrameLoop ({ ticker, draw, moving, hidden = () => document.hidden, now = () => performance.now() }) {
  let active = false
  let disposed = false
  let until = 0
  function stop () {
    if (active) ticker.remove(tick)
    active = false
  }
  function tick (time, elapsed) {
    if (hidden()) { stop(); return }
    draw(time, elapsed)
    if (now() >= until && !moving()) stop()
  }
  return {
    wake (duration = 1800) {
      if (disposed || hidden()) return
      until = Math.max(until, now() + duration)
      if (!active) { active = true; ticker.add(tick) }
    },
    stop,
    destroy () { disposed = true; stop() }
  }
}

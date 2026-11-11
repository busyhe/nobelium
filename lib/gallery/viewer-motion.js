import { gsap } from 'gsap'
import { MOTION } from './constants'
import { createFrameLoop } from './frame-loop'

export function createViewerMotion (root, { count, onIndex, onZoom, onClose, onExited, mainHeader }) {
  const stage = root.querySelector('.viewer-stage')
  const frame = root.querySelector('.viewer-image')
  const rail = root.querySelector('.viewer-rail')
  const thumbs = [...root.querySelectorAll('.viewer-thumb')]
  const header = root.querySelector('.viewer-header')
  if (mainHeader) mainHeader.inert = true
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
  const state = { position: 0, target: 0, zoom: 0, zoomTransition: 0, reduced: reduced.matches, mouseX: -10, mouseY: -10, mousePower: 0.1 }
  const mouse = { x: -10, y: -10 }
  const previousMouse = { ...mouse }
  const ctx = gsap.context(() => {}, root)
  let loop
  const animate = callback => { loop?.wake(); return ctx.add(callback) }
  let width, height, mobile, horizontal, step, aspect = 1.5, renderer, disposed = false, paused = false, active = 0, pointer, dragged = false
  let baseWidth, baseHeight, zoomTween
  const lastIndex = () => Math.max(0, count - 1)
  const layout = () => {
    width = root.clientWidth
    height = root.clientHeight
    mobile = width < 680
    horizontal = mobile && height >= width
    const first = thumbs[0].getBoundingClientRect()
    const oldStep = step || 1
    step = (horizontal ? first.width : first.height) + 10
    state.target = state.target / oldStep * step
    state.position = state.position / oldStep * step
    if (horizontal) {
      baseWidth = aspect > 1 ? width - 40 : height * 0.53 * aspect
      baseHeight = baseWidth / aspect
    } else if (aspect > 1) {
      baseHeight = width * 0.401041666667
      if (baseHeight > height) baseHeight *= height / width + 0.2
      baseWidth = baseHeight * aspect
    } else {
      baseHeight = height * 0.94537037037
      if (baseHeight * aspect > width * 0.8) baseHeight *= 0.5
      baseWidth = baseHeight * aspect
    }
    frame.style.width = `${baseWidth}px`
    frame.style.height = `${baseHeight}px`
    frame.style.top = horizontal ? 'calc(50% - 80px)' : '50%'
    rail.style.padding = horizontal ? `0 ${width / 2 - first.width / 2}px` : `${height / 2 - first.height / 2}px 0`
    loop?.wake()
    if (state.zoom) gsap.set(frame, { scale: horizontal ? width / baseWidth : height / baseHeight, y: horizontal ? 80 : 0 })
  }
  layout()
  const go = next => {
    if (state.zoom || paused) return
    const clamped = Math.max(0, Math.min(lastIndex(), next))
    if (clamped === active) return
    loop.wake()
    active = clamped
    onIndex(active)
    state.target = active * step
    state.position = state.target
  }
  const toggleZoom = () => {
    if (dragged || paused) return
    const next = !state.zoom
    state.zoom = next ? 1 : 0
    root.dataset.zoom = String(next)
    onZoom(next)
    animate(() => {
      zoomTween?.kill()
      zoomTween = gsap.timeline()
      zoomTween.to(frame, { scale: next ? (horizontal ? width / baseWidth : height / baseHeight) : 1, y: next && horizontal ? 80 : 0, duration: state.reduced ? 0 : next ? 1 : 0.4, ease: next ? 'expo.inOut' : 'expo.out' }, 0)
        .to('.viewer-backdrop', { opacity: next ? 1 : 0, duration: state.reduced ? 0 : 0.5 }, 0)
        .to(header, { opacity: next ? 0 : 1, pointerEvents: next ? 'none' : 'auto', duration: state.reduced ? 0 : 0.5 }, 0)
      if (next && !state.reduced) zoomTween.to(state, { zoomTransition: 1, duration: 0.5, ease: 'power4.in' }, 0).to(state, { zoomTransition: 0, duration: 0.5, ease: 'power1.out' }, 0.5)
    })
  }
  const tick = (_time, elapsed) => {
    if (disposed || paused || document.hidden) return
    const delta = Math.min((elapsed || 16.67) / 16.67, 3)
    state.position += (state.target - state.position) * (state.reduced ? 1 : 1 - Math.pow(1 - MOTION.ease, delta))
    state.mouseX += (mouse.x - state.mouseX) * 0.1
    state.mouseY += (mouse.y - state.mouseY) * 0.1
    const speed = 2 * Math.hypot(mouse.x - previousMouse.x, mouse.y - previousMouse.y) * 1000 / (elapsed || 16.67)
    state.mousePower += (Math.max(0.1, Math.min(Math.sqrt(speed), 1)) - state.mousePower) * 0.1
    previousMouse.x = mouse.x
    previousMouse.y = mouse.y
    const next = Math.max(0, Math.min(lastIndex(), Math.round(state.position / step)))
    if (next !== active) { active = next; onIndex(next) }
    rail.style.transform = horizontal ? `translate3d(${-state.position}px,0,0)` : `translate3d(0,${-state.position}px,0)`
    renderer?.render(delta)
  }
  loop = createFrameLoop({
    ticker: gsap.ticker, draw: tick, hidden: () => document.hidden || paused,
    moving: () => Math.abs(state.target - state.position) > 0.1 || ctx.getTweens().some(tween => tween.isActive())
  })
  loop.wake()
  let rendererRequested = false, idleHandle
  const loadRenderer = () => {
    if (disposed || rendererRequested || state.reduced) return
    rendererRequested = true
    import('./webgl').then(({ createPhotoRenderer }) => {
      if (disposed || state.reduced) return
      try { renderer = createPhotoRenderer(stage, { kind: 'viewer', state: () => state, onReady: () => loop.wake() }) } catch { root.dataset.renderer = 'dom' }
    }).catch(() => { root.dataset.renderer = 'dom' })
  }
  const rendererTimer = setTimeout(() => {
    if ('requestIdleCallback' in window) idleHandle = window.requestIdleCallback(loadRenderer, { timeout: 1500 })
    else loadRenderer()
  }, 2000)
  const onWheel = event => {
    if (event.ctrlKey || event.target.closest('a,.viewer-status')) return
    event.preventDefault()
    loop.wake()
    loadRenderer()
    if (state.zoom || paused) return
    const units = event.deltaMode === 1 ? 20 : event.deltaMode === 2 ? height : 1
    const axisScale = horizontal ? 1 : height / width
    state.target = Math.max(0, Math.min(lastIndex() * step, state.target + (event.deltaY + event.deltaX) * units * (mobile ? MOTION.wheelMobile : MOTION.wheelDesktop) * axisScale))
  }
  const onKeyDown = event => {
    if (event.key === 'Escape') { event.preventDefault(); state.zoom ? toggleZoom() : onClose() }
    if (event.key.startsWith('Arrow') && !event.altKey && !event.metaKey) {
      event.preventDefault()
      go(active + (event.key === 'ArrowDown' || event.key === 'ArrowRight' ? 1 : -1))
    }
    if (event.key === 'Home' || event.key === 'End') { event.preventDefault(); go(event.key === 'Home' ? 0 : lastIndex()) }
    if (event.key === 'Tab') {
      const targets = [...root.querySelectorAll('a,button')].filter(el => !el.disabled && el.tabIndex >= 0 && (state.zoom ? el === frame : true))
      const first = targets[0], last = targets[targets.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
  }
  const down = event => {
    dragged = false
    if (event.button !== 0 || state.zoom || event.target.closest('a,.viewer-header,.viewer-status,.viewer-navigation,.viewer-retry')) return
    pointer = { id: event.pointerId, x: event.clientX, y: event.clientY, target: state.target }
  }
  const move = event => {
    loop.wake()
    mouse.x = event.clientX / width
    mouse.y = 1 - event.clientY / height
    if (!pointer) return
    const distance = horizontal ? pointer.x - event.clientX : pointer.y - event.clientY
    if (Math.abs(distance) > 6) {
      dragged = true
      root.setPointerCapture(pointer.id)
      state.target = Math.max(0, Math.min(lastIndex() * step, pointer.target + distance * 1.8))
    }
  }
  const up = () => { pointer = null }
  const clickCapture = event => { if (dragged) { event.preventDefault(); event.stopPropagation() } }
  const onReduced = () => {
    state.reduced = reduced.matches
    if (state.reduced) {
      ctx.getTweens().forEach(tween => tween.progress(1))
      renderer?.destroy()
      renderer = null
      rendererRequested = false
    } else loadRenderer()
    loop.wake()
  }
  const onVisibility = () => { if (document.hidden) loop.stop(); else loop.wake() }
  document.addEventListener('visibilitychange', onVisibility)
  root.addEventListener('wheel', onWheel, { passive: false })
  root.addEventListener('keydown', onKeyDown)
  root.addEventListener('pointerdown', down)
  root.addEventListener('pointermove', move)
  root.addEventListener('pointerup', up)
  root.addEventListener('pointercancel', up)
  root.addEventListener('click', clickCapture, true)
  window.addEventListener('resize', layout)
  reduced.addEventListener('change', onReduced)
  animate(() => {
    gsap.fromTo(root, { y: state.reduced ? 0 : '15vh' }, { y: 0, duration: state.reduced ? 0 : 2, ease: 'expo.inOut' })
    if (mainHeader) gsap.fromTo(mainHeader, { y: 0, opacity: 1 }, { y: '-100%', opacity: 0, duration: state.reduced ? 0 : 1, ease: 'power4.inOut' })
    gsap.from(header, { y: '100%', opacity: 0, delay: state.reduced ? 0 : 0.5, duration: state.reduced ? 0 : 1.5, ease: 'power4.out' })
    gsap.from(thumbs.slice(0, 11), { [horizontal ? 'y' : 'x']: horizontal ? '-150vh' : '-50vw', clipPath: horizontal ? 'inset(100% 0 0 0)' : 'inset(0 70% 0 30%)', stagger: state.reduced ? 0 : 0.06, duration: state.reduced ? 0 : horizontal ? 1.7 : 1.5, ease: 'power4.out', delay: state.reduced ? 0 : 0.7 })
  })
  root.querySelector('.viewer-close').focus({ preventScroll: true })
  return {
    go,
    toggleZoom,
    imageLoaded (image) { aspect = image.naturalWidth / image.naturalHeight; layout() },
    exit () {
      if (paused) return
      paused = true
      loop.stop()
      animate(() => {
        // Closing during the entrance must not leave competing page tweens.
        gsap.killTweensOf([root, mainHeader].filter(Boolean))
        // Complete the visual exit before restoring the originating route.
        const exitTimeline = gsap.timeline({ onComplete: onExited })
        exitTimeline.to(root, { y: mobile ? '-5vh' : '-10vh', clipPath: 'inset(0vh 0vw 100vh 0vw)', duration: state.reduced ? 0 : 1.8, ease: 'expo.inOut' }, 0)
        if (mainHeader) exitTimeline.to(mainHeader, { y: 0, opacity: 1, duration: state.reduced ? 0 : 0.5 }, state.reduced ? 0 : 0.5)
      })
    },
    destroy () {
      disposed = true
      if (mainHeader) mainHeader.inert = false
      loop.destroy()
      clearTimeout(rendererTimer)
      if (idleHandle !== undefined) window.cancelIdleCallback(idleHandle)
      document.removeEventListener('visibilitychange', onVisibility)
      root.removeEventListener('wheel', onWheel)
      root.removeEventListener('keydown', onKeyDown)
      root.removeEventListener('pointerdown', down)
      root.removeEventListener('pointermove', move)
      root.removeEventListener('pointerup', up)
      root.removeEventListener('pointercancel', up)
      root.removeEventListener('click', clickCapture, true)
      window.removeEventListener('resize', layout)
      reduced.removeEventListener('change', onReduced)
      ctx.revert()
      if (mainHeader) gsap.set(mainHeader, { clearProps: 'transform,opacity' })
      renderer?.destroy()
    }
  }
}

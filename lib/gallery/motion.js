import { gsap } from 'gsap'
import { createFrameLoop } from './frame-loop'
import { MOTION } from './constants'

export function createGalleryMotion (root, { onCategory, onReady, onProgress, onWindow, onMode, initial }) {
  const board = root.querySelector('.gallery-board')
  const stage = root.querySelector('.gallery-stage')
  const sections = [...root.querySelectorAll('.gallery-section')]
  const columns = [...root.querySelectorAll('.gallery-column')]
  const frames = [...root.querySelectorAll('.gallery-frame')]
  const controls = root.querySelector('.gallery-controls')
  const title = root.querySelector('.gallery-category-title')
  const splash = root.querySelector('.gallery-splash')
  const skipIntro = Boolean(initial)
  const wrapper = root.closest('.wrapper')
  const media = window.matchMedia('(prefers-reduced-motion: reduce)')
  const state = { target: 0, position: 0, mode: 0, transition: 0, power: 0, bend: 0, direction: 0.1, mouseX: -10, mouseY: -10, category: sections[0]?.dataset.category, reduced: media.matches }
  const mouse = { x: -10, y: -10 }
  let width = root.clientWidth, height = root.clientHeight, grid, sectionWidth, mobile
  let renderer, disposed = false, paused = false, ready = false, entered = false, interactive = false, mode = 'grid', hovered = null, pointer = null, dragged = false
  let modeTimeline, scrollTween, powerTween, bendTween, settleTimer, snapTimer
  let loop, lastAnchor, idleHandle, rendererRequested = false
  let wheelDistance = 0
  const wheelHistory = []
  const ctx = gsap.context(() => {}, root)
  const animate = fn => { loop?.wake(); return ctx.add(fn) }
  const timers = new Set()
  const later = (callback, delay) => {
    const id = setTimeout(() => { timers.delete(id); if (!disposed) callback() }, delay)
    timers.add(id)
    return id
  }
  const shape = frame => Number(frame.dataset.aspect || 1.5) > 1 ? { width: '100%', height: '65%' } : { width: '65%', height: '100%' }
  const publishCategory = category => {
    if (!category || state.category === category) return
    state.category = category
    onCategory(category)
    frames.forEach(frame => { frame.dataset.selected = String(frame.dataset.category === category) })
  }
  const measure = () => {
    width = root.clientWidth
    height = root.clientHeight
    grid = width < 680 ? width / 20.1 : width / 60
    mobile = width < 680
    sectionWidth = sections[0]?.offsetWidth || width / (mobile ? 2 : 4)
  }
  measure()
  if (Number.isFinite(initial?.position)) state.target = state.position = initial.position * sectionWidth
  const scrollTo = (value, duration = 1.5, ease = 'power2.out') => animate(() => {
    clearTimeout(snapTimer)
    scrollTween?.kill()
    if (state.reduced || duration === 0) state.target = state.position = value
    else scrollTween = gsap.to(state, { target: value, duration, ease, overwrite: 'auto' })
  })
  const queueSnap = () => {
    clearTimeout(snapTimer)
    if (mobile) snapTimer = later(() => {
      if (!pointer) scrollTo(Math.round((state.target + width / 2 - sectionWidth / 2) / sectionWidth) * sectionWidth - width / 2 + sectionWidth / 2, 1)
    }, 500)
  }
  const pulse = amount => animate(() => {
    powerTween?.kill()
    bendTween?.kill()
    wheelDistance += Math.abs(amount) / 120
    if (wheelHistory.length > 2) {
      wheelHistory.shift()
      wheelHistory.push(wheelDistance)
      const value = Math.min(Math.abs(wheelHistory[0] - wheelHistory[2]), 3) / 3
      powerTween = gsap.to(state, { power: value, duration: 0.9, ease: 'power1.out', overwrite: 'auto' })
      bendTween = gsap.to(state, { bend: value, duration: 1, ease: 'power1.out', overwrite: 'auto' })
    } else wheelHistory.push(wheelDistance)
    clearTimeout(settleTimer)
    settleTimer = later(() => animate(() => {
      powerTween?.kill()
      bendTween?.kill()
      gsap.to(state, { power: 0, duration: 0.9, ease: 'power1.out' })
      gsap.to(state, { bend: 0, duration: 1, ease: 'power1.out' })
    }), 30)
    queueSnap()
  })
  const tick = (time, deltaMs) => {
    if (disposed || document.hidden || paused) return
    const delta = Math.min((deltaMs || 16.67) / 16.67, 3)
    state.position += (state.target - state.position) * (state.reduced ? 1 : 1 - Math.pow(1 - MOTION.ease, delta))
    state.mouseX += (mouse.x - state.mouseX) * (1 - Math.pow(0.9, delta))
    state.mouseY += (mouse.y - state.mouseY) * (1 - Math.pow(0.9, delta))
    const anchor = Math.floor(state.position / sectionWidth)
    if (anchor !== lastAnchor) { lastAnchor = anchor; onWindow(anchor) }
    let distance = Infinity, current = state.category
    sections.forEach(section => {
      const left = Number(section.dataset.logical) * sectionWidth - state.position
      section.style.transform = `translate3d(${left}px,0,0)`
      if (Math.abs(left + sectionWidth / 2 - width / 2) < distance) {
        distance = Math.abs(left + sectionWidth / 2 - width / 2)
        current = section.dataset.category
      }
    })
    if (mode === 'full') {
      distance = Infinity
      columns.forEach((column, index) => {
        if (index % 4 !== 0) return
        const frame = column.children[2]?.firstElementChild
        if (!frame) return
        const rect = frame.getBoundingClientRect()
        const next = Math.abs(rect.left + rect.width / 2 - width / 2)
        if (next < distance) { distance = next; current = frame.dataset.category }
      })
    }
    if (ready) publishCategory(hovered || current)
    columns.forEach(column => [...column.children].forEach((cell, row) => {
      cell.style.transform = `translateY(${mode === 'grid' && !state.reduced ? state.power * grid * (2 - row) : 0}px)`
    }))
    root.dataset.position = state.position.toFixed(2)
    frames.forEach((frame, index) => {
      const section = sections[Math.floor(index / 10)]
      const left = Number(section.dataset.logical) * sectionWidth - state.position
      const inView = left >= -sectionWidth / 2 && left < width - sectionWidth / 2
      frame.tabIndex = inView && (mode === 'grid' || (Math.floor(index / 5) % 4 === 0 && index % 5 === 2)) ? 0 : -1
    })
    renderer?.render(delta)
  }
  loop = createFrameLoop({
    ticker: gsap.ticker, draw: tick,
    hidden: () => document.hidden || paused,
    moving: () => Math.abs(state.target - state.position) > 0.1 || ctx.getTweens().some(tween => tween.isActive())
  })
  loop.wake()

  const setMode = (next, { force = false, immediate = false, preservePosition = false } = {}) => {
    if (!interactive || (mode === next && !force)) return
    mode = next
    onMode(next)
    root.dataset.mode = next
    if (next === 'grid') root.dataset.gridVisited = 'true'
    wrapper.dataset.galleryMode = next
    modeTimeline?.kill()
    animate(() => {
      gsap.killTweensOf(frames)
      gsap.killTweensOf(state, 'mode,transition')
      modeTimeline = gsap.timeline()
      if (state.reduced || immediate) {
        state.mode = next === 'full' ? 1 : 0
        state.transition = 0
        columns.forEach((column, index) => [...column.children].forEach((cell, row) => {
          const frame = cell.firstElementChild
          gsap.set(frame, next === 'grid' ? { ...shape(frame), y: 0 } : row === 2 ? { width: index % 4 === 0 ? (mobile ? width - grid : width * 0.49) : 0, height: mobile ? height * 1.2 : height * 1.5, y: 0 } : { height: 0 })
        }))
        root.dataset.dark = String(next === 'full')
        if (!preservePosition) scrollTo(state.target + width * (mobile ? 4.5 : 2.5), 0)
        return
      }
      modeTimeline.to(title, { opacity: 0, duration: 0.3 }, 0)
        .to(title, { opacity: 1, duration: 0.5 }, 1.25)
      if (next === 'full') {
        const rects = new Map(frames.map(frame => [frame, frame.getBoundingClientRect()]))
        modeTimeline.to(state, { mode: 1, duration: 2 }, 0.5)
          .call(() => { root.dataset.dark = 'true' }, [], 0.5)
          .to(state, { transition: 1, duration: 0.75, ease: 'power1.out' }, 0)
          .to(state, { transition: 0, duration: 2.5, ease: 'power2.out' }, 0.75)
        columns.forEach((column, index) => [...column.children].forEach((cell, row) => {
          const frame = cell.firstElementChild
          const rect = rects.get(frame)
          if (row === 2) {
            modeTimeline.to(frame, { width: index % 4 === 0 ? (mobile ? width - grid : width * 0.49) : 0, duration: index % 4 === 0 ? 2 : 0.6, ease: mobile ? 'power4.out' : 'power3.out' }, 0)
            if (index % 4 === 0) modeTimeline.to(frame, { height: mobile ? height * 1.2 : height * 1.5, duration: 2, ease: mobile ? 'power2.inOut' : 'power3.inOut' }, 0)
          } else {
            modeTimeline.to(frame, { height: 0, y: row < 2 ? -0.5 * (rect.top + rect.height) : -0.5 * (rect.top - height - rect.height), duration: row === 0 || row === 4 ? 0.4 : 0.5, ease: 'power2.out' }, row === 1 || row === 3 ? 0.1 : 0)
          }
        }))
        modeTimeline.call(() => scrollTo(state.target + width * (mobile ? 4.5 : 2.5), 2), [], 0.05)
      } else {
        root.dataset.dark = 'false'
        modeTimeline.to(state, { mode: 0, duration: 1 }, 0)
          .to(state, { transition: 0.5, duration: 0.5, ease: 'power1.in' }, 0)
          .to(state, { transition: 0, duration: 2, ease: 'power1.out' }, 0.5)
        columns.forEach(column => [...column.children].forEach((cell, row) => {
          const frame = cell.firstElementChild
          modeTimeline.to(frame, { width: shape(frame).width, duration: 1.5, ease: 'power4.out' }, row === 2 ? 0.25 : 0.7)
            .to(frame, { height: shape(frame).height, duration: row === 2 ? 1.25 : 1.5, ease: 'power4.out' }, row === 2 ? 0.25 : 0.7)
            .to(frame, { y: 0, duration: 1.5, ease: 'power4.out' }, row === 0 || row === 4 ? 0.6 : row === 2 ? 0 : 0.3)
        }))
        modeTimeline.call(() => scrollTo(state.target + width * (mobile ? 4.5 : 2.5), 3, 'expo.out'), [], 0.05)
      }
    })
  }
  const startIntro = () => {
    if (ready || disposed) return
    ready = true
    root.dataset.ready = 'true'
    onProgress(100)
    animate(() => {
      if (!splash || state.reduced || skipIntro) {
        entered = true
        root.dataset.entered = 'true'
        interactive = true
        onReady()
        if (splash) gsap.set(splash, { display: 'none' })
        scrollTo(initial ? state.position : width * (mobile ? 4.48 : 2.125), 0)
        if (initial?.mode === 'full') setMode('full', { immediate: true, preservePosition: true })
        return
      }
      const rects = new Map(frames.map(frame => [frame, frame.getBoundingClientRect()]))
      columns.forEach(column => [...column.children].forEach((cell, row) => {
        const frame = cell.firstElementChild
        const rect = rects.get(frame)
        gsap.set(frame, row === 2 ? { width: '187%', height: '20vw' } : { y: row < 2 ? -(rect.top + rect.height) : -(rect.top - height - rect.height) })
      }))
      gsap.set(controls, { opacity: 0 })
      gsap.set(stage, { opacity: 0 })
      const timeline = gsap.timeline({ onComplete: () => {
        entered = true
        splash.hidden = true
        root.dataset.entered = 'true'
        if (mode === 'grid' && !modeTimeline?.isActive()) frames.forEach(frame => gsap.set(frame, shape(frame)))
      } })
      timeline.fromTo('.gallery-splash-title', { opacity: 0 }, { opacity: 1, duration: 0.4 }, 0)
        .fromTo('.gallery-splash-front', { opacity: 0 }, { opacity: 1, duration: 0.3 }, 0.1)
        .fromTo('.gallery-splash-bottom', { opacity: 0 }, { opacity: 1, duration: 0.3 }, 0.15)
        .to('.gallery-splash-title .in span', { y: '-14vw', duration: 0.5, ease: 'power1.in', stagger: 0.05 }, 0.7)
        .to('.gallery-splash-title .out span', { y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.05 }, 0.9)
        .to('.gallery-splash-title', { y: '-30vh', duration: 2, ease: 'power4.inOut' }, 1.1)
        .to('.gallery-splash-image', { ...(mobile ? { height: '120%' } : { width: '130%' }), duration: 1.8, ease: 'power2.inOut' }, 1.1)
        .to('.gallery-splash-front', { clipPath: 'inset(0vh 0vw 0vh 0vw)', y: mobile ? 0 : '-10vh', duration: 1.8, ease: 'expo.inOut' }, 1.1)
        .to(splash, { clipPath: 'inset(0vh 0vw 100vh 0vw)', duration: 1.8, ease: 'expo.inOut' }, 1.1)
        .call(() => { interactive = true; onReady() }, [], 2.5)
        .to(stage, { opacity: 1, duration: 1 }, 2.1)
        .call(() => scrollTo(state.target + width * (mobile ? 4.48 : 2.125), 3, 'power4.out'), [], 2.1)
        .fromTo(state, { transition: 1 }, { transition: 0, duration: 1.5, ease: 'power1.out' }, 2.1)
        .to(controls, { opacity: 1, duration: 0.5 }, 3.6)
      columns.forEach(column => [...column.children].forEach((cell, row) => {
        const frame = cell.firstElementChild
        if (row === 2) {
          timeline.to(frame, { width: () => shape(frame).width, duration: 2.3, ease: 'power4.out' }, 2.6)
            .to(frame, { height: () => shape(frame).height, duration: 1.8, ease: 'power4.out' }, 2.1)
        } else timeline.to(frame, { y: 0, duration: 1.7, ease: 'expo.out' }, row === 0 || row === 4 ? 3.1 : 2.6)
      }))
    })
  }
  const updateImageAspect = image => {
    const frame = image.closest('.gallery-frame')
    if (!frame || !image.naturalWidth) return
    frame.dataset.aspect = image.naturalWidth / image.naturalHeight
    if (!ready || (entered && mode === 'grid' && !modeTimeline?.isActive())) animate(() => gsap.set(frame, shape(frame)))
  }
  // Capture also handles photos mounted later by the recycled section window.
  const onImageLoad = event => { updateImageAspect(event.target); loop.wake() }
  stage.addEventListener('load', onImageLoad, true)
  stage.querySelectorAll('img').forEach(image => { if (image.complete) updateImageAspect(image) })
  // Lazy images outside the viewport may never load. They must not gate entry.
  startIntro()
  const loadRenderer = () => {
    if (rendererRequested || disposed || state.reduced) return
    rendererRequested = true
    import('./webgl').then(({ createPhotoRenderer }) => {
      if (disposed || state.reduced) return
      try {
        renderer = createPhotoRenderer(stage, { state: () => state, onReady: () => loop.wake() })
        root.dataset.renderer = 'webgl'
        loop.wake()
      } catch { root.dataset.renderer = 'dom' }
    }).catch(() => { root.dataset.renderer = 'dom' })
  }
  later(() => {
    if ('requestIdleCallback' in window) idleHandle = window.requestIdleCallback(loadRenderer, { timeout: 2000 })
    else loadRenderer()
  }, skipIntro ? 200 : 5500)

  const onWheel = event => {
    if (paused || !interactive || event.ctrlKey || event.target.closest('a, .gallery-controls')) return
    event.preventDefault()
    loop.wake()
    loadRenderer()
    scrollTween?.kill()
    clearTimeout(snapTimer)
    hovered = null
    const units = event.deltaMode === 1 ? 20 : event.deltaMode === 2 ? width : 1
    const delta = (event.deltaX + event.deltaY) * units
    state.target += delta * (mobile ? MOTION.wheelMobile : MOTION.wheelDesktop)
    state.direction = delta > 0 ? 0.1 : -0.1
    pulse(delta)
  }
  const onPointerDown = event => {
    if (paused || !interactive || event.button !== 0 || event.target.closest('.gallery-controls, a')) return
    scrollTween?.kill()
    clearTimeout(snapTimer)
    dragged = false
    pointer = { id: event.pointerId, x: event.clientX, y: event.clientY, target: state.target }
  }
  const onPointerMove = event => {
    loop.wake()
    mouse.x = event.clientX / width
    mouse.y = 1 - event.clientY / height
    if (pointer) {
      const distance = pointer.x - event.clientX
      if (Math.abs(distance) > 6) {
        scrollTween?.kill()
        dragged = true
        root.dataset.dragging = 'true'
        stage.setPointerCapture(pointer.id)
        hovered = null
        state.target = pointer.target + distance * MOTION.dragRatio
        state.direction = distance > 0 ? 0.1 : -0.1
      }
    } else if (!mobile && !paused && state.power < 0.04) {
      hovered = event.target.closest('.gallery-frame')?.dataset.category || null
    }
  }
  const onPointerUp = () => {
    if (pointer && dragged) queueSnap()
    pointer = null
    delete root.dataset.dragging
  }
  // Touch begins with implicit capture on the image. Moving capture to the stage
  // fires a bubbling lostpointercapture on that image, which is not a drag end.
  const onLostCapture = event => { if (event.target === stage) onPointerUp() }
  const onClickCapture = event => {
    if (dragged && event.target.closest('.gallery-stage')) {
      event.preventDefault()
      event.stopPropagation()
      dragged = false
    }
  }
  const onKeyDown = event => {
    if (paused || !interactive || event.target.closest('a,input') || (event.key === ' ' && event.target.closest('button')) || event.ctrlKey || event.metaKey || event.altKey) return
    const values = { ArrowRight: 40, ArrowDown: 40, ArrowLeft: -40, ArrowUp: -40, ' ': width }
    if (values[event.key] !== undefined) { loop.wake(); loadRenderer(); event.preventDefault(); hovered = null; scrollTween?.kill(); state.target += values[event.key] }
  }
  const onResize = () => {
    const fraction = state.target / (sectionWidth || 1)
    const wasMobile = mobile
    measure()
    state.target = state.position = fraction * sectionWidth
    loop.wake()
    if (ready && (wasMobile !== mobile || mode === 'full')) setMode(mode, { force: true, immediate: true, preservePosition: true })
  }
  const onMotionPreference = () => {
    state.reduced = media.matches
    if (state.reduced) {
      ctx.getTweens().forEach(tween => tween.progress(1))
      state.transition = state.power = state.bend = 0
      if (splash) splash.hidden = true
      state.position = state.target
      renderer?.destroy()
      renderer = null
      rendererRequested = false
    } else loadRenderer()
    loop.wake()
  }
  const onVisibility = () => { if (document.hidden) loop.stop(); else loop.wake() }
  document.addEventListener('visibilitychange', onVisibility)
  root.addEventListener('wheel', onWheel, { passive: false })
  stage.addEventListener('pointerdown', onPointerDown)
  root.addEventListener('pointermove', onPointerMove)
  root.addEventListener('pointerup', onPointerUp)
  root.addEventListener('pointercancel', onPointerUp)
  stage.addEventListener('lostpointercapture', onLostCapture)
  root.addEventListener('click', onClickCapture, true)
  stage.addEventListener('keydown', onKeyDown)
  window.addEventListener('resize', onResize)
  media.addEventListener('change', onMotionPreference)
  return {
    setMode,
    state,
    board,
    pause () { loop.stop(); paused = true; hovered = null; pointer = null },
    resume () { paused = false; loop.wake(); setMode(mode, { force: true, immediate: true, preservePosition: true }) },
    snapshot () { return { position: state.position / sectionWidth, mode } },
    refresh () { loop.wake(); stage.querySelectorAll('img').forEach(image => { if (image.complete) updateImageAspect(image) }) },
    focusCategory (category, element) {
      loop.wake()
      hovered = category
      const rect = element?.getBoundingClientRect()
      if (rect && element.matches(':focus-visible') && (rect.left < 0 || rect.right > width)) scrollTo(state.target + rect.left + rect.width / 2 - width / 2, 0.6)
    },
    destroy () {
      disposed = true
      timers.forEach(clearTimeout)
      clearTimeout(settleTimer)
      clearTimeout(snapTimer)
      stage.removeEventListener('load', onImageLoad, true)
      loop.destroy()
      if (idleHandle !== undefined) window.cancelIdleCallback(idleHandle)
      document.removeEventListener('visibilitychange', onVisibility)
      root.removeEventListener('wheel', onWheel)
      stage.removeEventListener('pointerdown', onPointerDown)
      root.removeEventListener('pointermove', onPointerMove)
      root.removeEventListener('pointerup', onPointerUp)
      root.removeEventListener('pointercancel', onPointerUp)
      stage.removeEventListener('lostpointercapture', onLostCapture)
      root.removeEventListener('click', onClickCapture, true)
      stage.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('resize', onResize)
      media.removeEventListener('change', onMotionPreference)
      ctx.revert()
      renderer?.destroy()
      delete wrapper.dataset.galleryMode
    }
  }
}

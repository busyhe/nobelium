import * as THREE from 'three'
import { ResourceCache } from './resource-cache'
import { galleryVertex, galleryFragment, galleryScreenVertex, galleryScreenFragment, viewerVertex, viewerFragment, viewerScreenVertex, viewerScreenFragment } from './shaders'

// The DOM remains the accessible, clickable layout and the no-WebGL fallback.
// WebGL only draws its photographs, using Photoyoshi's original shader programs.
export function createPhotoRenderer (root, { kind = 'gallery', state, onReady = () => {} }) {
  const isViewer = kind === 'viewer'
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
  const canvas = renderer.domElement
  canvas.className = 'gallery-canvas'
  canvas.setAttribute('aria-hidden', 'true')
  root.appendChild(canvas)
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 10000)
  const screenScene = new THREE.Scene()
  const screenCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
  const target = new THREE.WebGLRenderTarget(1, 1, { depthBuffer: false })
  const loader = new THREE.TextureLoader()
  const noise = loader.load('/gallery/noise.jpg', () => { if (!disposed) onReady() })
  const records = [...root.querySelectorAll('[data-gallery-image]')].map(element => ({ element, section: element.closest('.gallery-section'), mesh: null, source: null }))
  const textures = new ResourceCache({
    maxEntries: isViewer ? 4 : 32,
    maxWeight: isViewer ? 24_000_000 : 12_000_000,
    dispose: (texture, source) => {
      records.forEach(record => {
        if (record.source !== source) return
        scene.remove(record.mesh)
        record.mesh?.geometry.dispose()
        record.mesh?.material.dispose()
        record.mesh = null
        record.source = null
        delete record.element.dataset.webgl
      })
      texture.dispose()
    }
  })
  const sections = [...new Set(records.map(record => record.section).filter(Boolean))]
  const screenUniforms = {
    tDiffuse: { value: target.texture }, u_time: { value: 0 }, uMouse: { value: new THREE.Vector2(-10, -10) },
    resolution: { value: new THREE.Vector2(1, 1) }, u_type: { value: isViewer ? 123 : 1 },
    scroll_pow: { value: 0 }, blendFactor: { value: 0 }, modeChangePow: { value: 0 }, roundPow: { value: 1 },
    uMouseSwitch: { value: 0.5 }, mode: { value: 0 }, device: { value: 0 }, pm: { value: 0.1 },
    mousePow: { value: 0 }, zoomTransition: { value: 0 }
  }
  const screenMaterial = new THREE.ShaderMaterial({
    uniforms: screenUniforms, vertexShader: isViewer ? viewerScreenVertex : galleryScreenVertex,
    fragmentShader: isViewer ? viewerScreenFragment : galleryScreenFragment, depthTest: false
  })
  const screenGeometry = new THREE.PlaneGeometry(2, 2)
  screenScene.add(new THREE.Mesh(screenGeometry, screenMaterial))
  let width, height, dpr, lost = false, disposed = false, time = 0
  const resize = () => {
    width = root.clientWidth
    height = root.clientHeight
    dpr = Math.min(window.devicePixelRatio || 1, 2)
    renderer.setPixelRatio(dpr)
    renderer.setSize(width, height)
    target.setSize(width * dpr, height * dpr)
    camera.aspect = width / height
    camera.position.z = height / (2 * Math.tan(25 * Math.PI / 180))
    camera.updateProjectionMatrix()
    screenUniforms.resolution.value.set(1, height / width)
    screenUniforms.device.value = width < 680 ? 0.5 : 0
    onReady()
  }
  resize()
  const makeMesh = (record, image, rect) => {
    if (!rect.width || !rect.height) return
    const src = image.currentSrc || image.src
    let texture = textures.get(src)
    if (!texture) {
      // Use a decoded texture image, independent of Next Image's responsive DOM node.
      texture = loader.load(src, loaded => {
        if (disposed || textures.get(src) !== loaded) { loaded.dispose(); return }
        textures.weigh(src, loaded.image.width * loaded.image.height)
        onReady()
      }, undefined, () => { if (!disposed) onReady() })
      textures.set(src, texture)
    }
    const imageAspect = image.naturalWidth / image.naturalHeight
    const cell = width < 680 ? width * 0.199004975124 : width / 15
    const planeWidth = isViewer ? rect.width : cell * Math.min(imageAspect, 1)
    const geometry = new THREE.PlaneGeometry(planeWidth, planeWidth / imageAspect, isViewer ? 2 : 36, isViewer ? 2 : 36)
    if (record.mesh) {
      record.mesh.material.uniforms.tA.value = texture
      record.mesh.geometry.dispose()
      record.mesh.geometry = geometry
      record.source = src
      return
    }
    const material = new THREE.ShaderMaterial({
      side: THREE.DoubleSide, transparent: true, depthTest: false,
      uniforms: {
        noise: { value: noise }, tA: { value: texture }, hoverN: { value: 0 }, f_type: { value: isViewer ? 4 : 1 },
        u_isHovered: { value: false }, vUvScale: { value: new THREE.Vector2(1, 1) }, opacityN: { value: 0.2 },
        scrollPow: { value: 0 }, u_time: { value: 0 }, uMouse: { value: new THREE.Vector2(-10, -10) },
        radius: { value: 0.001 }, u_res: { value: new THREE.Vector2(width * dpr, height * dpr) },
        mode: { value: 0 }, u_type: { value: isViewer ? 2 : 1 }, pw: { value: 0 }, u_mousePow: { value: 0 },
        ttP: { value: 0 }, zoom: { value: 0 }, device: { value: width < 680 ? 1 : 0 }
      },
      vertexShader: isViewer ? viewerVertex : galleryVertex, fragmentShader: isViewer ? viewerFragment : galleryFragment
    })
    record.mesh = new THREE.Mesh(geometry, material)
    record.source = src
    scene.add(record.mesh)
  }
  const onLost = event => {
    event.preventDefault()
    lost = true
    canvas.style.visibility = 'hidden'
    records.forEach(({ element }) => { delete element.dataset.webgl })
  }
  canvas.addEventListener('webglcontextlost', onLost)
  const observer = new ResizeObserver(resize)
  observer.observe(root)
  return {
    render (delta = 1) {
      if (disposed || lost || !width || !height) return
      const s = state()
      const bounds = root.getBoundingClientRect()
      // Read one rectangle per section before inspecting its photos. Most of
      // the repeating wall is off screen, including during the full-view warp.
      const nearby = new Set(sections.filter(section => {
        const rect = section.getBoundingClientRect()
        return rect.right > bounds.left - width && rect.left < bounds.right + width
      }))
      time += 0.0001 * records.length * delta
      const visibleSources = new Set()
      for (const record of records) {
        const { element } = record
        if (record.section && !nearby.has(record.section)) {
          if (record.mesh) record.mesh.visible = false
          delete element.dataset.webgl
          continue
        }
        const rect = element.getBoundingClientRect()
        const visible = rect.width > 0.5 && rect.height > 0.5 && rect.right > -width / 2 && rect.left < width * 1.5 && (!isViewer || element.dataset.active === 'true')
        if (!visible) {
          if (record.mesh) record.mesh.visible = false
          continue
        }
        const image = element.querySelector('img')
        if (!image?.complete || !image.naturalWidth) {
          if (record.mesh) record.mesh.visible = false
          delete element.dataset.webgl
          continue
        }
        if (record.source !== (image.currentSrc || image.src)) makeMesh(record, image, rect)
        visibleSources.add(record.source)
        textures.get(record.source)
        const mesh = record.mesh
        if (!mesh) continue
        if (!mesh.material.uniforms.tA.value.image?.complete) {
          mesh.visible = false
          delete element.dataset.webgl
          continue
        }
        mesh.visible = true
        const aspect = rect.width / rect.height
        const imageAspect = image.naturalWidth / image.naturalHeight
        const geometry = mesh.geometry.parameters
        mesh.scale.set(
          aspect > imageAspect ? aspect / imageAspect * rect.height / geometry.height : rect.width / geometry.width,
          aspect > imageAspect ? rect.height / geometry.height : imageAspect / aspect * rect.width / geometry.width, 1
        )
        mesh.position.set(rect.left - bounds.left + rect.width / 2 - width / 2, height / 2 - (rect.top - bounds.top) - rect.height / 2, 0)
        const u = mesh.material.uniforms
        u.vUvScale.value.set(aspect > imageAspect ? 1 : aspect / imageAspect, aspect > imageAspect ? imageAspect / aspect : 1)
        const active = element.dataset.category === s.category ? 1 : 0
        u.hoverN.value += (active - u.hoverN.value) * (1 - Math.pow(0.95, delta))
        u.mode.value = s.mode || 0
        u.scrollPow.value = s.reduced ? 0 : s.power || 0
        u.pw.value = s.reduced ? 0 : (s.bend || 0) * (s.direction || 0.1)
        u.uMouse.value.set(s.mouseX ?? -10, s.mouseY ?? -10)
        u.u_res.value.set(width * dpr, height * dpr)
        u.u_time.value = s.reduced ? 0 : time
        u.u_mousePow.value = s.reduced ? 0 : s.mousePower || 0.1
        u.zoom.value = s.zoom || 0
        element.dataset.webgl = 'true'
      }
      textures.trim(visibleSources)
      root.dataset.textureCount = String(textures.entries.size)
      screenUniforms.scroll_pow.value = s.reduced ? 0 : s.power || 0
      screenUniforms.mode.value = s.mode || 0
      screenUniforms.modeChangePow.value = s.reduced ? 0 : s.transition || 0
      screenUniforms.zoomTransition.value = s.reduced ? 0 : s.zoomTransition || 0
      screenUniforms.pm.value = s.direction || 0.1
      screenUniforms.uMouse.value.set(s.mouseX ?? -10, s.mouseY ?? -10)
      renderer.setRenderTarget(target)
      renderer.clear()
      renderer.render(scene, camera)
      renderer.setRenderTarget(null)
      renderer.clear()
      renderer.render(screenScene, screenCamera)
    },
    destroy () {
      disposed = true
      observer.disconnect()
      canvas.removeEventListener('webglcontextlost', onLost)
      records.forEach(({ element }) => {
        delete element.dataset.webgl
      })
      textures.clear()
      delete root.dataset.textureCount
      noise.dispose()
      target.dispose()
      screenMaterial.dispose()
      screenGeometry.dispose()
      renderer.dispose()
      renderer.forceContextLoss()
      canvas.remove()
    }
  }
}

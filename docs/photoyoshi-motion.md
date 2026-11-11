# Photoyoshi motion port

The reference is the local `photoyoshi` project. Its custom animation code has been translated into scoped React lifecycles; the original bundled application, router, analytics, and hard-coded photography data are not loaded.

| Reference | Implementation | Parameters retained |
| --- | --- | --- |
| `ql.onSplash` | `lib/gallery/motion.js` | 0.7 s opening hold, 0.05 s letter stagger, 1.8 s `expo.inOut` cover wipe, 2.3 s center-image settling, 0.5/1 s row offsets |
| `c` scrolling | `lib/gallery/motion.js` | 0.125 interpolation; desktop/mobile wheel scale 80/120 and 200/120; drag ratio 1.8; three-event power history; 30 ms stop and 500 ms mobile centering timers |
| `jl.onFull/onGrid` | `lib/gallery/motion.js` | Four rows collapse in 0.4/0.5 s; every fourth center image expands to 49 vw × 150 vh (portrait mobile: viewport minus one grid unit × 120 vh); original `power*`/`expo` eases and screen-warp sequence |
| `Pl`, `Dl` custom shaders | `lib/gallery/shaders.js`, `webgl.js` | Category desaturation/noise, cursor response, scroll bending, full-view edge dimming, zoom distortion |
| `ql.HomeToWork/WorkToHome` | `components/gallery/GalleryViewer.js` | 1.8 s upward clipping, 2 s incoming translation, 0.06 s thumbnail stagger |
| `Yl`, `Dl.castClick` | `components/gallery/GalleryViewer.js` | Centered desktop vertical / mobile horizontal thumbnail rail; keyboard selection; 1 s `expo.inOut` zoom in and 0.4 s `expo.out` zoom out; scrolling locked during zoom |

GSAP 3.11.2 and Three.js 0.170.0 match the reference bundle. The noise texture is copied from its `assets/img/noise3.jpg`. Shader code is kept readable rather than copying the whole vendor bundle.

Adaptations: the name, covers, tags, counts, and post links come from this project's configuration and Notion data. The gallery uses deterministic samples instead of random selection. Each post opens its own photo viewer at `/[slug]`; collection titles lead to their tag index. The viewer's story title is a label, and the former article-view query no longer changes the layout. The reference directory does not contain its linked About page, so the existing profile destination is retained. Search, tag, pagination, and standalone Notion `Page` routes remain available.

Every timeline, ticker, listener, observer, canvas, geometry, material, and texture is released on unmount. `prefers-reduced-motion` removes spatial transitions without removing navigation. A DOM image layer remains available when WebGL cannot initialize or loses its context. Missing/expired Notion covers retain a text placeholder.

Collection positions and the first desktop viewport's photos are present in the server-rendered HTML. An intersection observer mounts photos within one viewport of either side of the stage and removes distant image nodes while keeping their frames and collection positions. Grid photos request thumbnail sizes; switching to full view upgrades the expanded photos. WebGL checks section bounds before measuring nearby frames and creates textures only near the viewport.

The splash wordmark and footer are visible in the initial HTML, and the complete opening timeline starts on hydration without waiting for image requests. Off-screen lazy images and slow or failed covers cannot delay entry. This also applies when returning through the site title; the motion timings and geometry above are preserved. Image load events are captured at the stage so newly mounted photos still update their aspect ratios. Animation setup batches geometry reads before changing frame styles.

The gallery, post viewer, search, and standalone page routes use the configured live Notion database. The preview uses the same data adapters and contains no fixture fallback. Notion access uses `notion-client` 8 and `https://app.notion.com/api/v3`; the retired `www.notion.so` API can return Cloudflare 403 responses.

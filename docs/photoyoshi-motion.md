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

Adaptations: the name, covers, tags, counts, and article links come from this project's configuration and Notion data. The gallery uses deterministic samples instead of random selection; all collection entries remain available in its viewer. The reference directory does not contain its linked About page, so the existing profile destination is retained. Collection navigation uses Next shallow URLs, preserving the blog's search, tag, pagination, and article routes.

Every timeline, ticker, listener, observer, canvas, geometry, material, and texture is released on unmount. `prefers-reduced-motion` removes spatial transitions without removing navigation. A DOM image layer remains available when WebGL cannot initialize or loses its context. Missing/expired Notion covers retain a text placeholder.

Collection positions are present in the server-rendered HTML so native lazy loading prioritizes nearby photographs before hydration. WebGL creates textures only near the viewport. This keeps large live databases from queuing every repeated gallery image ahead of the visible photos; the motion timings and geometry above are preserved.

The gallery, collection viewer, search, and article routes use the configured live Notion database. The preview uses the same data adapters and contains no fixture fallback. Notion access uses `notion-client` 8 and `https://app.notion.com/api/v3`; the retired `www.notion.so` API can return Cloudflare 403 responses.

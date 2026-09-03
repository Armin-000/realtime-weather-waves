# Oceanis optimization report

## Result

The uploaded source project contained approximately 54.23 MiB of files (excluding `node_modules`). The optimized source is approximately 2.17 MiB.

- Source reduction: ~96.0%
- `public/` reduction: ~54.08 MiB -> ~1.96 MiB (~96.4%)
- Production should publish only `dist/`; `node_modules` is a build-time dependency tree and should not be served as the application.

## Main changes

1. Cloud textures
   - Removed duplicate JPG cloud assets that were never referenced.
   - Replaced ten 2048x2048 PNG cloud textures with ten 1024x1024 WebP textures.
   - Alpha transparency is preserved.
   - Updated `RealisticSky.ts` to use `.webp` assets.
   - Re-enabled frustum culling for individual cloud planes.

2. Heavy demo/marketing media
   - Removed unused `day.gif`, `Sunrise.gif`, `night.gif` and large day/sunset/night PNG screenshots from `public/`.
   - Added compact WebP screenshots under `docs/screenshots/` for README presentation.
   - Added a dedicated 1200x630 `public/og-oceanis.jpg` social preview and updated HTML metadata.

3. Ocean GPU workload
   - Water geometry reduced from 520x520 to 256x256 subdivisions.
   - Water reflection target reduced from 1024x1024 to 512x512.
   - Desktop pixel ratio is capped at 1.75; coarse-pointer/mobile devices at 1.25.
   - Removed an unused PMREM environment generation pass because the scene contains no environment-mapped/PBR materials using `scene.environment`.

4. Startup behavior
   - The preloader no longer waits for the browser `load` event and every non-critical resource. It transitions after the first render frame.
   - Added `powerPreference: 'high-performance'` to the WebGL renderer.
   - Rendering work is skipped when the document is hidden.
   - Frame delta is capped after tab/background stalls to avoid large simulation jumps.

5. Weather/network path
   - Weather forecast and marine requests now run in parallel after geocoding.
   - Geocoding results are cached in memory for the session.
   - Autocomplete requests cancel stale in-flight requests with `AbortController`.

6. UI lifecycle
   - Removed a repeated `document.addEventListener('click', ...)` registration from every weather-panel re-render.
   - Replaced it with one global outside-click listener, avoiding long-session listener accumulation/memory leakage.

7. Fonts and project hygiene
   - Replaced CSS `@import` for Google Fonts with HTML preconnect + stylesheet links.
   - Removed unused Vite starter assets from `src/assets/`.
   - Added a supported Node engine declaration.
   - Added `DEPLOYMENT.md` with static-production deployment guidance.

## Deployment requirement

Run:

```bash
npm ci
npm run build
```

Then publish only `dist/` through a static web server/CDN. Do not use `vite preview` as the long-running production server and do not deploy `node_modules` as public runtime content.

## Validation performed

- All TypeScript sources were syntax-transpiled successfully with TypeScript.
- JSON files were parsed successfully.
- Local static asset references were checked and resolve.
- All optimized cloud WebP files are 1024x1024 RGBA and preserve transparency.

A full `npm ci && npm run build` could not be executed in this sandbox because outbound npm package installation was unavailable. No dependency versions were changed.

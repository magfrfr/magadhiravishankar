# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server (Vite HMR) → http://localhost:5173
npm run build     # Production build → dist/
npm run preview   # Serve the production build locally
npm run lint      # Run ESLint
node scripts/shoot.mjs [stops]   # Headless Edge screenshots → .shots/ (e.g. `node scripts/shoot.mjs 0,0.5,1`)
```

No test suite is configured. Visual changes are verified with `scripts/shoot.mjs` (requires the dev server running); always LOOK at the screenshots before calling a visual change done.

## Architecture (v6.0 — "a portfolio, with one object in it")

**Layout rule (v4.5, hers, non-negotiable):** nothing from the scene may sit behind **body** text. The orb takes the empty half of every chapter and the text takes the other; the ferrofluid band stays under the type. Orb anchors + per-chapter `SCALE_AT` in `chapterMath.js` exist to enforce that — if you move a text block, re-check the anchor and re-shoot. **Amended v5.0 (her call):** objects *may* cross the giant display words. They may not cross paragraphs, experience panels or links.

The old known gap is **fixed** in v5.0. The rule now holds mid-transition too, via two corrections in `Orb.jsx` rather than a reshaped `ORB_PATH` (whose anchor array is length-coupled to `IDENTITY_AT`/`SCALE_AT`, so adding a point silently breaks `getPoint(u/last)`): a `lift` that raises the path while it sweeps between chapters, and a `penned` clamp that holds the orb in the left margin for as long as the experience panels are on screen, not only at that chapter's centre line.

Single-page React 19 + Vite app. Entry: `src/main.jsx` → `src/App.jsx`. **No StrictMode** — the custom rAF layers are simpler without dev double-mounting. A cinematic scroll story: one WebGL orb travels the page and changes identity per chapter — **moon → wireframe globe → tennis ball → moon** — while DOM text dissolves between chapters.

**Content** — ALL copy lives in `src/content.js` (META, LOADER, CONTACT, SOCIALS, CHAPTERS, CATEGORIES, ITEMS, BUNNIES). No strings in components. Chapter order: `hero → builder → everything → connect` — the beach/Chennai chapter was CUT (v3.4, "emphasis on chennai is not really needed"); don't reintroduce Chennai content beyond the hero tagline.
- `builder` is the portfolio proper. Each `experience[]` entry is `{ when, role, org, metric, metricLabel, points[], stack[], href? }`. **The metric is the thing a reader keeps, so it has to be real** — 68.3% cross-validated, Top 20 nationally, 150+ startups vetted. NO invented metrics. (The BCI number was 70.6%/75.5% until 2026-07-27, when a data leak was found in the pipeline: CSP had been fitted over the whole dataset before splitting. Do not restore the old figures.) An entry with no honest number does not get one.
- `everything` is `range: true`: the thirteen things set as type, grouped by `CATEGORIES`.
- Voice is plain. The old "signal acquired · 60 fps" / "acquiring signal" copy was cut in v6.0 — it read as a game, not a portfolio.

**Scene (`src/scene/`)** — lazy-loaded R3F `<Canvas>` fixed behind the DOM (`Scene.jsx`): Rig (cursor parallax), Stars, Orb and Grade (desktop, non-reduced-motion).
- `scrollBus.js`: plain mutable object shared between DOM and frame loop — `bus.u` is the continuous chapter coordinate (0=hero … 3=connect), computed from live section rects. `CHAPTER_IDS` MUST match content.js ids — if they drift, `readChapterCoord` freezes and the whole scene goes dead. **Also home to the pure envelope math** (`smoothstep`, `lerp`, `seaWeight`, `riseWeight`) — it must stay three-free because DOM layers (FluidSea) import it; putting three-importing code here would drag three.js into the main bundle.
- `chapterMath.js`: identity map, orb path (CatmullRom through per-chapter anchors), scales, rim colors; re-exports the scrollBus math. Arrays are length-coupled to the chapter count.
- `Orb.jsx`: useFrame priority -1, publishes `bus.orb`; procedural identity crossfade in `orbShader.js` (no textures).
- `environments/`: `Stars` only is mounted. `Sea/Stage/Court/Scalp` retired on disk (Stage/Court reference removed exports — re-wire before re-mounting).

**FluidSea (`src/components/FluidSea.jsx` + `Ferrofluid.jsx`)** — the site's water: ReactBits Ferrofluid (ogl, own small canvas, adapted: window-level pointermove since the layer is pointer-events none; `runningRef` skips rendering when invisible). Her params: flow up, shimmer 2, speed 0.3, glow 1.3, turbulence 0.25. Colors were hers (#2b2eba/#6366F1) until v5.0 deepened them for the pale build — see the palette section. One fixed layer at z-1: a bottom wave band during hero/connect (`seaWeight`), rising to fill the viewport behind the everything chapter (`riseWeight`, u≈2) via an animated CSS mask — no GL resize.

**Selected work (`src/components/WorkList.jsx`, v6.0)** — the builder chapter body and the professional core of the site. An editorial list, not cards: a hairline rule, the year on the left, role/org/points/stack in the middle, and the metric set large on the right. An entry with `href` renders as an `<a>` with an arrow that travels on hover; the hover state is the rule darkening and the row indenting, nothing lifts or glows. Motion is `whileInView` with `once: true`: rows rise and unblur in sequence, each rule draws in from the left. `reducedMotion` renders the same layout static.

**Range (`src/components/RangeList.jsx`, v6.0)** — the "all of it" body: the thirteen things as type, grouped by `CATEGORIES`, revealed in sequence on scroll. Hovering a word lifts its fact into **one** caption line rather than scattering thirteen tooltips. This replaced, in order, a physics pile, a card rail, a 3D voxel heap and a dome — see the memory file before proposing another one.

**Glass system (v4.5)** — one `.glass` class in App.css (frosted background gradient + `backdrop-filter` over the WebGL canvas + a conic-gradient `::after` masked to a 1px iridescent ring). Applied to tags, socials and the corner link. Coarse pointers drop the blur and keep the look (mobile GPUs choke on stacked backdrop-filters over the canvas). `::after` is the rim.

**Seamless DOM** — Lenis smooth scroll (skipped in lite/reduced-motion); `chapters/useChapterFade.js` gives every chapter scroll-linked opacity/y/blur dissolves with long overlaps (blur skipped in lite); `components/AnnotationRail.jsx` is the fixed top-left mono line that scramble-rewrites per chapter (desktop replaces in-flow `.eyebrow` via `.rail-on`; lite mode shows in-flow eyebrows instead); `components/Magnetic.jsx` wraps the corner link + socials. `components/Loader.jsx` is the boot overlay: a counter that crawls to 88% and only sprints to 100 once `bus.sceneReady` (6s timeout as a backstop), drawn as an arc dial with a sweeping highlight, lifting off as a clip-path curtain. First visit only, tracked in localStorage `mg-intro`. The dial is styling — the crawl/hold/sprint timing and the `dt` clamps are the load-bearing part, don't restyle them away.

**Badge reel (`components/BadgeReel.jsx`)** — the ID card (`/idcard.webp`) latched top-right on a verlet-rope cord; drag anywhere, spring snap-back with wobble. Pure rAF + refs, no physics lib.

**Pets (`src/pets/`)** — two pixel bunnies (Ash brown, Kiko lavender). `sprites.js` holds string-grid frames (16×20×7) rendered to offscreen canvas; if you touch bunny art, rasterize and LOOK at it first (bunny ears must be long, narrow, separated). `PetsLayer.jsx` runs the hop/sleep/happy FSM; clicking pets them (hearts).

**Modes** — `liteMode` = coarse pointer or ≤768px (DPR 1, fewer particles, no Lenis/rail/magnetic/parallax). `prefers-reduced-motion` = no letter/fade animation, no camera parallax, no orb spin, and both scroll-reveal lists render in place.

**Lint note** — `react-hooks/purity` + `immutability` are off for `src/scene/**` only (R3F frame-loop mutation is idiomatic there); don't disable them elsewhere.

**Styling** — tokens in `src/index.css` ("pale studio": paper/surface/tide/ember/ink/iris, plus gloss/shadow/shadow-deep), layout in `src/App.css`. Fonts: Bricolage Grotesque (display), Newsreader (story), JetBrains Mono (annotations). Display type is set at **weight 400**, not 800 — the reference carries headlines by size alone, and `useWeightRipple` thins from 400 down to 200 to match.

**Palette flip (v5.0)** — the site was midnight-dark through v4.6 and is now pale periwinkle with ink type, her call after we studied noomoagency.com together. Things that invert and are easy to get wrong on this build:
- **Additive light is useless on paper.** The orb's halo plane is a *contact shadow* now (normal blending, cool grey, parked behind and below the sphere so depth testing clips it to a skirt), not an additive glow. Bloom sits at threshold 0.9 / intensity 0.3 so it only catches true speculars; at the old 0.15 it turned the whole frame to milk.
- **Bright rims dissolve silhouettes.** `orbShader` reflection is spread across the body (`0.55 + 0.25 * fresnel`) instead of piled on the edge, rim additive is down to 0.18, and `envCol` is lit as a bright room with a warm floor bounce so the dark glass body reads as glass rather than as a hole in the page.
- **Text protection reverses.** Halo text-shadows are white here, not black.
- **The ferrofluid was tuned to glow against midnight** and composited over paper as grey smears. Colours are deepened (`#1b1d8f`/`#3538c9`/`#4f46e5`), the layer carries `saturate(1.4) contrast(1.18)`, and the wave band sits lower (74–92%) so it clears the hero tagline.
- `.atmosphere` (was `.night-tint`) is the warm iridescent glow weather. It paints **before** the canvas in `App.jsx` at the same z-index, so the transparent canvas sits on top of it — don't move it after `<Scene>` or it will wash out the orb and the fluid.
- Depth of field is mounted ahead of Bloom in `Grade.jsx`, desktop-only like the rest of the composer. It is doing most of the work that reads as an expensive render.

**Pending assets** — real photos go in `public/photos/`; nothing renders them today, so the folder is unused until a chapter gets a `photos[]` again.

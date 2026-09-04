# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server (Vite HMR) -> http://localhost:5173
npm run build     # Production build -> dist/
npm run preview   # Serve the production build locally
npm run lint      # Run ESLint
node scripts/shoot.mjs [stops]   # Headless Edge screenshots -> .shots/ (e.g. node scripts/shoot.mjs 0,0.5,1)
```

No test suite is configured. Visual changes are verified with `scripts/shoot.mjs` (requires the dev server running); always LOOK at the screenshots before calling a visual change done.

**Do not verify by screenshotting a browser tab you are driving remotely.** A backgrounded Chrome tab gets `visibilityState: "hidden"` and fires zero `requestAnimationFrame` callbacks, so the scene, the camera rig and every framer-motion animation freeze at once and the page looks catastrophically broken when nothing is wrong. `shoot.mjs` is the reliable check.

## Architecture (v7.0, "the desk")

Single-page React 19 + Vite app. Entry: `src/main.jsx` -> `src/App.jsx`. **No StrictMode**, the custom rAF layers are simpler without dev double-mounting.

**The premise.** Scrolling does not move an object down the page. It dollies a camera through one 3D desk, and the desk is seen through a **picture window** whose rectangle opens and closes as you go. The half the window gives up is exactly where that chapter's text sits, so the composition creates the text column instead of leaving dead space. Reference is illoca.unseen.co, which is not an illustration: it is a 3D scene wearing a two-tone posterised shader with ink edges and grain.

**Layout rule (hers, non-negotiable):** nothing from the scene may sit behind **any** text, including the giant display words. The old v5.0 amendment that let objects cross display type is dead; her name across the desk was the single worst thing on the page. `FRAMES` in `deskPieces.js` and the chapter paddings in `App.css` are two halves of one decision. Move one and you must move the other.

### Scene (`src/scene/`)

Lazy-loaded R3F `<Canvas shadows>` fixed behind the DOM (`Scene.jsx`), which mounts only `DeskRig` and `Desk`.

- **`scrollBus.js`** is a plain mutable object shared between the DOM and the frame loop. `bus.u` is the continuous chapter coordinate (0=hero to 3=connect) read from live section rects. `CHAPTER_IDS` MUST match the ids in `content.js`; if they drift, `readChapterCoord` freezes and the whole scene goes dead. **Must stay three-free**, because DOM layers import its envelope math and pulling three.js in here would drag it into the main bundle.
- **`desk/deskPieces.js`** is the desk as data. Every piece is a primitive (`box`, `cyl`, `cone`); the look comes from shading and ink edges, not modelling. Per-piece flags: `t` albedo (0 dark object, 1 white paper), `e:false` to skip ink edges, `s:false` to stop casting a shadow, `d` the drawing kind, `dev` marks the one sheet that develops. Also holds `CAMERA_STOPS` and `FRAMES`, both length-coupled to the chapter count.
- **`desk/deskMaterial.js`** is the three-band toon `ShaderMaterial` (`lights: true`, `getShadowMask()`), warm paper against saturated blue.
- **`desk/deskDrawings.js`** generates seeded canvas textures for the sheets, sampled as an alpha mask. Kinds are `signal` (EEG channels whose noise falls away as the stage rises), `chart` and `notes`.
- **`desk/Desk.jsx`** builds the group, adds `EdgesGeometry` ink lines per piece, and crossfades the developing sheet's stages in `useFrame`.
- **`desk/DeskRig.jsx`** is the camera dolly along a CatmullRom through `CAMERA_STOPS`, and the only writer of `bus.u`, `bus.sceneReady` and the `--frame-*` CSS variables.

**Parked, still on disk, NOT mounted:** `Orb.jsx`, `orbShader.js`, `chapterMath.js`, `environments/*`, `Grade.jsx` (bloom and DOF), and `components/FluidSea.jsx` plus `Ferrofluid.jsx` (commented out in `App.jsx`). They are the v6.0 orb build. Re-wire before re-mounting anything.

### Four things that will bite you

1. **The vertex shader needs `beginnormal_vertex` and `defaultnormal_vertex`.** `shadowmap_vertex` reads `transformedNormal`; drop those chunks and the program fails to link.
2. **`--frame-t/r/b/l` may only be declared on `:root`.** A copy of them on `.scene-canvas` beats the inherited value and silently freezes the window at its default.
3. **Albedo is applied inside each band, never as a mix toward light afterwards.** The latter washes the whole scene to milk.
4. **The back wall must not cast a shadow** (`s: false`) or it throws one across the entire desk and everything goes blue.

### Frame timing

`bus.u` equals `i` at chapter `i`'s centre line, so chapter `i` owns the screen for roughly `u` in `(i-0.5, i+0.5)`. The window must therefore HOLD its shape either side of a centre and swap across the MIDPOINT between two: `smoothstep(0.40, 0.70, u - i)`. Slower and it sweeps under arriving text; earlier and a chapter sits on top of the *next* chapter's window, which is worse. Re-shoot all four stops if you touch it.

The camera also pans so the subject centres in the **visible** window rather than the canvas, which is why a shot framed for the full canvas arrives cropped at the half-width stops.

## Content

ALL copy lives in `src/content.js` (META, LOADER, CONTACT, SOCIALS, CHAPTERS, CATEGORIES, ITEMS, BUNNIES). No strings in components. Chapters: `hero -> builder -> everything -> connect`.

- **No Chennai anywhere**, in any form. It was cut from the tagline, the eyebrow and the meta description.
- `builder` is the portfolio proper. Each `experience[]` entry is `{ when, role, org, metric, metricLabel, points[], stack[], href? }`. **The metric is the thing a reader keeps, so it has to be real**: 68.3% cross-validated, Top 20 nationally, 150+ startups vetted. NO invented metrics. `metric` is optional and an entry with no honest figure leaves the column empty. (The BCI number was 70.6%/75.5% until a data leak was found: CSP had been fitted over the whole dataset before splitting. Do not restore the old figures.)
- `everything` is `range: true`, the thirteen things set as type and grouped by `CATEGORIES`.
- Voice is plain. Em dashes are banned in her copy, so is the Oxford comma.

## DOM

- **`WorkList.jsx`** is selected work as an editorial hairline list: year left, role/org/points/stack middle, metric large right. In the half-width lane it takes the same single-column reflow the phone build uses, metric first.
- **`RangeList.jsx`** is the thirteen things as grouped type with one shared caption line on hover. This replaced, in order, a physics pile, a card rail, a 3D voxel heap and a dome. Read the memory file before proposing another one.
- **Chrome is flat.** `.glass` is a flat chip: 3px radius, one 1px ink rule, no blur. The frosted iridescent version, the `.atmosphere` glow blooms, `.vignette` and `.cursor-glow` were all deleted, because they were a soft-focus language fighting a hard-edged picture. Do not restore them without asking.
- Lenis smooth scroll (skipped in lite and reduced-motion); `chapters/useChapterFade.js` gives scroll-linked dissolves; `AnnotationRail.jsx` is the fixed mono line that scramble-rewrites per chapter; `Magnetic.jsx` wraps the corner link and the socials; `Loader.jsx` is the boot overlay whose counter crawls to 88% until `bus.sceneReady` then sprints (the timing and the `dt` clamps are load-bearing, the dial is only styling); `Cursor.jsx` is desktop-only.
- **Pets (`src/pets/`)** are two pixel bunnies, Ash and Kiko. Hers, explicitly kept, do not propose cutting them. If you touch bunny art, rasterize and LOOK at it: ears must be long, narrow and separated.

## Modes

`liteMode` is a coarse pointer or a viewport at or under 768px. `prefers-reduced-motion` drops letter animation, parallax and the scroll reveals.

**There is no lite or mobile path for the desk yet.** The frame rects, the chapter paddings and the camera stops are all tuned for one desktop breakpoint. This is the biggest known gap.

## Styling

Tokens in `src/index.css`, layout in `src/App.css`. The ground is **warm paper** (`--paper: #e7e1d3`) carrying a 26px graph-paper grid, so the margin the picture gives up reads as the sheet the picture is lying on. `--tide` is the same blue the desk casts its shadows in, so type rules and the picture share one hue. This replaced the v5.0 pale-periwinkle palette on her call, deliberately.

Fonts: Bricolage Grotesque (display, weight 400 not 800), Newsreader (story), JetBrains Mono (annotations).

**Lint note:** `react-hooks/purity` and `immutability` are off for `src/scene/**` only. `react-hooks/refs` is NOT, so writing `ref.current` inside a `useMemo` will fail lint. Return the handle from the memo instead.

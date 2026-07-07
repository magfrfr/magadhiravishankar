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

## Architecture (v3.3 — "one object, four lives + an inventory")

Single-page React 19 + Vite app. Entry: `src/main.jsx` → `src/App.jsx`. **No StrictMode** — the custom rAF layers are simpler without dev double-mounting. A cinematic scroll story: one WebGL orb travels the page and changes identity per chapter — **moon → wireframe globe → tennis ball → moon** — while DOM text dissolves between chapters.

**Content** — ALL copy lives in `src/content.js` (META, SOCIALS, CHAPTERS, CATEGORIES, ITEMS, BUNNIES). No strings in components. Chapter order: `hero → builder → everything → connect` — the beach/Chennai chapter was CUT (v3.4, her ask: "emphasis on chennai is not really needed"); don't reintroduce Chennai content beyond the hero tagline. `builder` is recruiter-grade ("the work so far": `experience[]` entries with real numbers — top 20 national, **150+ startups vetted**, 109 subjects — and metric-chip tags; NO invented metrics, NO coconut-recycler story, BCI accuracy % still pending); `everything` is "jack of all trades, master of some" with `toybox: true`.

**Scene (`src/scene/`)** — lazy-loaded R3F `<Canvas>` fixed behind the DOM (`Scene.jsx`): Rig (cursor parallax) + Stars + Orb only.
- `scrollBus.js`: plain mutable object shared between DOM and frame loop — `bus.u` is the continuous chapter coordinate (0=hero … 3=connect), computed from live section rects. `CHAPTER_IDS` MUST match content.js ids — if they drift, `readChapterCoord` freezes and the whole scene goes dead. **Also home to the pure envelope math** (`smoothstep`, `lerp`, `seaWeight`, `riseWeight`) — it must stay three-free because DOM layers (FluidSea) import it; putting three-importing code here would drag three.js into the main bundle.
- `chapterMath.js`: identity map, orb path (CatmullRom through per-chapter anchors), scales, rim colors; re-exports the scrollBus math. Arrays are length-coupled to the chapter count.
- `Orb.jsx`: useFrame priority -1, publishes `bus.orb`; procedural identity crossfade in `orbShader.js` (no textures).
- `environments/`: `Stars` only is mounted. `Sea/Stage/Court/Scalp` retired on disk (Stage/Court reference removed exports — re-wire before re-mounting).

**FluidSea (`src/components/FluidSea.jsx` + `Ferrofluid.jsx`)** — the site's water: ReactBits Ferrofluid (ogl, own small canvas, adapted: window-level pointermove since the layer is pointer-events none; `runningRef` skips rendering when invisible). Her exact params: flow up, shimmer 2, speed 0.3, glow 1.3, turbulence 0.25, colors #2b2eba/#6366F1. One fixed layer at z-1: a bottom wave band during hero/connect (`seaWeight`), rising to fill the viewport behind the everything chapter (`riseWeight`, u≈2) via an animated CSS mask — no GL resize.

**Inventory (`src/toybox/Inventory.jsx`)** — the "all of it" section body (rendered by `Chapter.jsx` when `chapter.toybox`): the performer ID card (`/idcard.webp` via `PhotoFrame` `src` prop, cursor tilt, NO frame chrome — `.inventory-card` overrides strip border/shadow/caption, "just the card") beside `CATEGORIES` groups (stage/sport/off hours) of pixel sprites (`buildItemSprite`, 64px, image-rendering pixelated), hover/tap reveals the item's fact. `BlurText.jsx` (ReactBits) animates chapter titles.

**Toybox (`src/toybox/`)** — the "all of it" chapter body, rendered by `Chapter.jsx` when `chapter.toybox` (as a sibling of the fading inner div — must not inherit the chapter fade transform). `itemSprites.js` = 13 pixel sprites (24×24 string grids → offscreen canvas; `node scripts/render_items.mjs` to review). `Toybox.jsx`: desktop = matter-js physics pile (dynamically imported; items tumble in on first intersection, drag/toss via MouseConstraint, hover shows name+fact tag; engine rAF pauses off-screen; matter's wheel listeners are stripped so Lenis keeps scrolling — keep that fix). Mobile/lite/reduced-motion = dense grid, spring stagger, tap reveals the fact.

**Seamless DOM** — Lenis smooth scroll (skipped in lite/reduced-motion); `chapters/useChapterFade.js` gives every chapter scroll-linked opacity/y/blur dissolves with long overlaps (blur skipped in lite); `components/AnnotationRail.jsx` is the fixed top-left mono line that scramble-rewrites per chapter (desktop replaces in-flow `.eyebrow` via `.rail-on`; lite mode shows in-flow eyebrows instead); `components/Magnetic.jsx` wraps the sound toggle + socials.

**Badge reel (`components/BadgeReel.jsx`)** — the ID card (`/idcard.webp`) latched top-right on a verlet-rope cord; drag anywhere, spring snap-back with wobble + `zip` SFX. Pure rAF + refs, no physics lib.

**Pets (`src/pets/`)** — two pixel bunnies (Ash brown, Kiko lavender). `sprites.js` holds string-grid frames (16×20×7) rendered to offscreen canvas; if you touch bunny art, rasterize and LOOK at it first (bunny ears must be long, narrow, separated). `PetsLayer.jsx` runs the hop/sleep/happy FSM; clicking pets them (hearts).

**Audio (`src/audio/sfx.js`)** — WebAudio chiptune blips (hop/pet/toggle/zip), no files. Off by default; toggle top-right persists in localStorage `mg-sound`.

**Modes** — `liteMode` = coarse pointer or ≤768px (DPR 1, fewer particles, no Lenis/rail/magnetic/parallax). `prefers-reduced-motion` = no letter/fade animation, no camera parallax, no orb spin.

**Lint note** — `react-hooks/purity` + `immutability` are off for `src/scene/**` only (R3F frame-loop mutation is idiomatic there); don't disable them elsewhere.

**Styling** — tokens in `src/index.css` ("midnight beach": bay/undertow/biolume/sodium/moonwash/kiko), layout in `src/App.css`. Fonts: Bricolage Grotesque (display), Newsreader (story), JetBrains Mono (annotations).

**Pending assets** — real photos go in `public/photos/` (beach.jpg, candid.jpg, dance.jpg, tennis.jpg); placeholders render until then. BCI accuracy numbers pending for the builder chapter.

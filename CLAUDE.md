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

## Architecture (v4.6 — "one object, four lives + a pinned rail")

**Layout rule (v4.5, hers, non-negotiable):** nothing from the scene may sit behind text. The orb takes the empty half of every chapter and the text takes the other; the ferrofluid band stays under the type. Orb anchors + per-chapter `SCALE_AT` in `chapterMath.js` exist to enforce that — if you move a text block, re-check the anchor and re-shoot. **Known gap:** the rule holds at every chapter center, but mid-transition the orb crosses the frame and can pass over the tail of the builder entries (visible around 0.28 of total scroll). Pre-existing, not yet fixed — a fix means reshaping `ORB_PATH`, whose anchor array is length-coupled to `IDENTITY_AT`/`SCALE_AT`.

Single-page React 19 + Vite app. Entry: `src/main.jsx` → `src/App.jsx`. **No StrictMode** — the custom rAF layers are simpler without dev double-mounting. A cinematic scroll story: one WebGL orb travels the page and changes identity per chapter — **moon → wireframe globe → tennis ball → moon** — while DOM text dissolves between chapters.

**Content** — ALL copy lives in `src/content.js` (META, LOADER, TICKER, MUSIC, SOCIALS, CHAPTERS, CATEGORIES, ITEMS, BUNNIES). No strings in components. Chapter order: `hero → builder → everything → connect` — the beach/Chennai chapter was CUT (v3.4, her ask: "emphasis on chennai is not really needed"); don't reintroduce Chennai content beyond the hero tagline. `builder` is recruiter-grade ("the work so far": `experience[]` entries with real numbers — top 20 national, **150+ startups vetted**, 109 subjects — and metric-chip tags; NO invented metrics, NO coconut-recycler story, BCI accuracy % still pending); `everything` is "jack of all trades, master of some" with `toybox: true`.

**Scene (`src/scene/`)** — lazy-loaded R3F `<Canvas>` fixed behind the DOM (`Scene.jsx`): Rig (cursor parallax) + Stars + Orb only.
- `scrollBus.js`: plain mutable object shared between DOM and frame loop — `bus.u` is the continuous chapter coordinate (0=hero … 3=connect), computed from live section rects. `CHAPTER_IDS` MUST match content.js ids — if they drift, `readChapterCoord` freezes and the whole scene goes dead. **Also home to the pure envelope math** (`smoothstep`, `lerp`, `seaWeight`, `riseWeight`) — it must stay three-free because DOM layers (FluidSea) import it; putting three-importing code here would drag three.js into the main bundle.
- `chapterMath.js`: identity map, orb path (CatmullRom through per-chapter anchors), scales, rim colors; re-exports the scrollBus math. Arrays are length-coupled to the chapter count.
- `Orb.jsx`: useFrame priority -1, publishes `bus.orb`; procedural identity crossfade in `orbShader.js` (no textures).
- `environments/`: `Stars` only is mounted. `Sea/Stage/Court/Scalp` retired on disk (Stage/Court reference removed exports — re-wire before re-mounting).

**FluidSea (`src/components/FluidSea.jsx` + `Ferrofluid.jsx`)** — the site's water: ReactBits Ferrofluid (ogl, own small canvas, adapted: window-level pointermove since the layer is pointer-events none; `runningRef` skips rendering when invisible). Her exact params: flow up, shimmer 2, speed 0.3, glow 1.3, turbulence 0.25, colors #2b2eba/#6366F1. One fixed layer at z-1: a bottom wave band during hero/connect (`seaWeight`), rising to fill the viewport behind the everything chapter (`riseWeight`, u≈2) via an animated CSS mask — no GL resize.

**Activity rail (`src/toybox/ActivityRail.jsx`, v4.5)** — the "all of it" body on desktop: `Chapter.jsx` puts the chapter in a 360vh section (`.chapter--rail`) whose `.rail-sticky` frame holds the screen while the track of glass cards travels sideways, driven by `useScroll(offset: ['start start','end end'])` through a spring. Card 00 is the performer pass, then 13 activity cards (sprite, name, fact, category). Cards lean with `--skew` (the same scroll-velocity var the titles use). The pinned header gets NO chapter fade — the sticky frame carries it in and out. `scrollBus.readChapterCoord` measures `.rail-sticky` instead of the section when present, so the orb identity holds for the whole pin. Lite/reduced-motion fall back to `Inventory`.

**Scroll ticker (`src/components/ScrollTicker.jsx`, v4.6)** — the marquee band App renders between the builder chapter and "all of it". Base drift 42px/s plus `bus.vel * 0.25`, so it surges with fast scrolling and reverses when you scroll back up; two identical `.ticker-run` copies with the offset wrapping on one run's width, so there is no seam. Lines come from `TICKER` in content.js and every one of them is a fact stated elsewhere on the site — never put a new claim here. The band is frosted (`backdrop-filter`) on purpose: the orb crosses the middle of the frame on this stretch and the glass keeps the type readable. Coarse pointers drop the blur. `reducedMotion` renders it static.

**CD player (`src/components/CDPlayer.jsx`, v4.6)** — fixed dock bottom-right: a disc that spins only while playing (CSS `animation-play-state`, so `prefers-reduced-motion` kills it for free) with elapsed time as an SVG ring. Track comes from `MUSIC` in content.js. **`public/music/track.wav` is a generated placeholder tone, not a song** — replace the file and the title/artist together. Nothing autoplays; if the audio file 404s the dock hides itself (`.cd-dock--gone`) rather than sitting broken. Independent of the `♪` toggle, which still governs only the `sfx.js` blips.

**Glass system (v4.5)** — one `.glass` class in App.css (frosted background gradient + `backdrop-filter` over the WebGL canvas + a conic-gradient `::after` masked to a 1px iridescent ring). Applied to rail cards, experience entries, tags, socials, the sound toggle and the lite inventory cells. Coarse pointers drop the blur and keep the look (mobile GPUs choke on stacked backdrop-filters over the canvas). `::after` is the rim — `.xp li::before` is the entry counter, don't collide.

**Inventory (`src/toybox/Inventory.jsx`)** — the lite-mode "all of it" body (rendered by `Chapter.jsx` when `chapter.toybox`): the performer ID card (`/idcard.webp` via `PhotoFrame` `src` prop, cursor tilt, NO frame chrome — `.inventory-card` overrides strip border/shadow/caption, "just the card") beside `CATEGORIES` groups (stage/sport/off hours) of pixel sprites (`buildItemSprite`, 64px, image-rendering pixelated), hover/tap reveals the item's fact. `BlurText.jsx` (ReactBits) animates chapter titles.

**Toybox (`src/toybox/`)** — `itemSprites.js` = 13 pixel sprites (24×24 string grids → offscreen canvas; `node scripts/render_items.mjs` to review). `Toybox.jsx`: desktop = matter-js physics pile (dynamically imported; items tumble in on first intersection, drag/toss via MouseConstraint, hover shows name+fact tag; engine rAF pauses off-screen; matter's wheel listeners are stripped so Lenis keeps scrolling — keep that fix). Mobile/lite/reduced-motion = dense grid, spring stagger, tap reveals the fact.

**Seamless DOM** — Lenis smooth scroll (skipped in lite/reduced-motion); `chapters/useChapterFade.js` gives every chapter scroll-linked opacity/y/blur dissolves with long overlaps (blur skipped in lite); `components/AnnotationRail.jsx` is the fixed top-left mono line that scramble-rewrites per chapter (desktop replaces in-flow `.eyebrow` via `.rail-on`; lite mode shows in-flow eyebrows instead); `components/Magnetic.jsx` wraps the sound toggle + socials. `components/Loader.jsx` is the boot overlay: a counter that crawls to 88% and only sprints to 100 once `bus.sceneReady` (6s timeout as a backstop), drawn as an arc dial with a sweeping highlight, lifting off as a clip-path curtain. First visit only, tracked in localStorage `mg-intro`. The dial is styling — the crawl/hold/sprint timing and the `dt` clamps are the load-bearing part, don't restyle them away.

**Badge reel (`components/BadgeReel.jsx`)** — the ID card (`/idcard.webp`) latched top-right on a verlet-rope cord; drag anywhere, spring snap-back with wobble + `zip` SFX. Pure rAF + refs, no physics lib.

**Pets (`src/pets/`)** — two pixel bunnies (Ash brown, Kiko lavender). `sprites.js` holds string-grid frames (16×20×7) rendered to offscreen canvas; if you touch bunny art, rasterize and LOOK at it first (bunny ears must be long, narrow, separated). `PetsLayer.jsx` runs the hop/sleep/happy FSM; clicking pets them (hearts).

**Audio (`src/audio/sfx.js`)** — WebAudio chiptune blips (hop/pet/toggle/zip), no files. Off by default; toggle top-right persists in localStorage `mg-sound`.

**Modes** — `liteMode` = coarse pointer or ≤768px (DPR 1, fewer particles, no Lenis/rail/magnetic/parallax). `prefers-reduced-motion` = no letter/fade animation, no camera parallax, no orb spin.

**Lint note** — `react-hooks/purity` + `immutability` are off for `src/scene/**` only (R3F frame-loop mutation is idiomatic there); don't disable them elsewhere.

**Styling** — tokens in `src/index.css` ("midnight beach": bay/undertow/biolume/sodium/moonwash/kiko), layout in `src/App.css`. Fonts: Bricolage Grotesque (display), Newsreader (story), JetBrains Mono (annotations).

**Pending assets** — real photos go in `public/photos/` (beach.jpg, candid.jpg, dance.jpg, tennis.jpg); placeholders render until then. BCI accuracy numbers pending for the builder chapter.

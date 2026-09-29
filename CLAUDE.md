# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server (Vite HMR) -> http://localhost:5173
npm run build     # Production build -> dist/
npm run preview   # Serve the production build locally
npm run lint      # Run ESLint
node scripts/shoot.mjs [stops] [WxH]   # Headless Edge screenshots -> .shots/ (e.g. node scripts/shoot.mjs 0,0.5,1 390x844)
```

No test suite is configured. Visual changes are verified with `scripts/shoot.mjs` (requires the dev server running); always LOOK at the screenshots before calling a visual change done. The second argument is the viewport, and anything 768 or narrower is shot with touch emulation so the page takes the lite path — **a layout change has to be shot at both `1440x900` and `390x844`**, because the two are different compositions, not one design reflowing.

**Do not verify by screenshotting a browser tab you are driving remotely.** A backgrounded Chrome tab gets `visibilityState: "hidden"` and fires zero `requestAnimationFrame` callbacks, so the scene, the camera rig and every framer-motion animation freeze at once and the page looks catastrophically broken when nothing is wrong. `shoot.mjs` is the reliable check.

## Architecture (v7.3, "the desk")

Single-page React 19 + Vite app. Entry: `src/main.jsx` -> `src/App.jsx`. **No StrictMode**, the custom rAF layers are simpler without dev double-mounting.

**The premise.** Scrolling does not move an object down the page. It dollies a camera through one 3D desk, and the desk is seen through a **picture window** whose rectangle opens and closes as you go. The half the window gives up is exactly where that chapter's text sits, so the composition creates the text column instead of leaving dead space. Reference is illoca.unseen.co, which is not an illustration: it is a 3D scene wearing a two-tone posterised shader with ink edges and grain.

**Layout rule (hers, non-negotiable):** nothing from the scene may sit behind **any** text, including the giant display words. The old v5.0 amendment that let objects cross display type is dead; her name across the desk was the single worst thing on the page. `FRAMES` in `deskPieces.js` and the chapter paddings in `App.css` are two halves of one decision. Move one and you must move the other.

**Two compositions, one breakpoint.** At or above 981px (`wide`) the window is half the screen and the chapter text sits in the other half. Below it there is no half to give up: a phone chapter runs three or four screens tall, so a window pinned to the viewport would have the copy scrolling straight through it. The picture becomes a **figure in the flow** instead — each chapter renders an empty `.chapter-slot` box and the rig clips the canvas to that box's live rect, so the picture behaves like an image on a page and the copy can never reach it. 981 appears in two places, `SPLIT_QUERY` in `App.jsx` and the `min-width` block in `App.css`, and they have to stay the same number.

### Scene (`src/scene/`)

Lazy-loaded R3F `<Canvas shadows>` fixed behind the DOM (`Scene.jsx`), which mounts only `DeskRig` and `Desk`.

- **`scrollBus.js`** is a plain mutable object shared between the DOM and the frame loop. `bus.u` is the continuous chapter coordinate (0=hero to 3=connect) read from live section rects. `CHAPTER_IDS` MUST match the ids in `content.js`; if they drift, `readChapterCoord` freezes and the whole scene goes dead. **Must stay three-free**, because DOM layers import its envelope math and pulling three.js in here would drag it into the main bundle.
- **`desk/deskPieces.js`** is the desk as data. Every piece is a primitive (`box`, `cyl`, `cone`); the look comes from shading and ink edges, not modelling. Per-piece flags: `t` albedo (0 dark object, 1 white paper), `e:false` to skip ink edges, `s:false` to stop casting a shadow, `d` the drawing kind, `dev` marks the one sheet that develops. Also holds `CAMERA_STOPS`, `FRAMES` and `LITE_SPANS`, all three length-coupled to the chapter count.
- **`desk/deskMaterial.js`** is the three-band toon `ShaderMaterial` (`lights: true`, `getShadowMask()`), warm paper against saturated blue.
- **`desk/deskDrawings.js`** generates seeded canvas textures for the sheets, sampled as an alpha mask. Kinds are `signal` (EEG channels whose noise falls away as the stage rises), `chart` and `notes`.
- **`desk/Desk.jsx`** builds the group, adds `EdgesGeometry` ink lines per piece, and crossfades the developing sheet's stages in `useFrame`.
- **`desk/DeskRig.jsx`** is the camera dolly along a CatmullRom through `CAMERA_STOPS`, and the only writer of `bus.u`, `bus.sceneReady` and the `--frame-*` CSS variables. It takes the window either from `FRAMES` (wide) or from the picture slot nearest the viewport (lite).

**Parked, still on disk, NOT mounted:** `Orb.jsx`, `orbShader.js`, `chapterMath.js`, `environments/*`, `Grade.jsx` (bloom and DOF), and `components/FluidSea.jsx` plus `Ferrofluid.jsx` (commented out in `App.jsx`). They are the v6.0 orb build. Re-wire before re-mounting anything.

### Four things that will bite you

1. **The vertex shader needs `beginnormal_vertex` and `defaultnormal_vertex`.** `shadowmap_vertex` reads `transformedNormal`; drop those chunks and the program fails to link.
2. **`--frame-t/r/b/l` may only be declared on `:root`.** A copy of them on `.scene-canvas` beats the inherited value and silently freezes the window at its default.
3. **Albedo is applied inside each band, never as a mix toward light afterwards.** The latter washes the whole scene to milk.
4. **The back wall must not cast a shadow** (`s: false`) or it throws one across the entire desk and everything goes blue.
5. **A window clipped to nothing still draws its hairline.** `.scene-frame` is a bordered box, so when the lite slot scrolls off and the inset clamps to zero height it becomes a rule straight across the top or bottom of the screen. `--frame-op` fades it out with the last of its height.

### Frame timing

`bus.u` equals `i` at chapter `i`'s centre line, so chapter `i` owns the screen for roughly `u` in `(i-0.5, i+0.5)`. The window HOLDS its shape either side of a centre and swaps across a slot in between. **That slot is measured, not fixed** — `swapWindows()` in `scrollBus.js` reads the live page and centres each swap halfway between the point chapter `i`'s type clears the screen and the point chapter `i+1`'s first reaches it, one window per gap.

It has to be per gap, because the chapters are nothing like each other in height (the work chapter is nearly three times the hero) and the single constant this replaced was 0.17 too late on the first gap and 0.15 too early on the last. The cost was not subtle: the entire work chapter arrived at **full opacity on top of the desk**, which is the one thing the layout rule forbids.

`useChapterFade` reads the same windows and gates each chapter's opacity to zero across them, so no type is ever lit while the window is crossing the screen. **The gate and the swap are two halves of one decision; change one and you must change the other.** Gaps 2 and 3 have no text-free instant available at all (the outgoing chapter outlasts the arrival of the incoming one), so there the gate is what does the work. None of this applies below the breakpoint, where the picture is a box in the flow and cannot cross anything: the gate stays open and the old scroll-linked dissolve runs alone.

**Verify with a scripted sweep, not by eye.** Walk the scroll in 0.01 steps, read `--frame-*` off `:root`, and intersect it with the client rect of every text node whose chapter is above ~0.03 opacity. It must print nothing. Screenshots at four stops will not catch this: all three overlaps sat between the stops.

The camera also pans so the subject centres in the **visible** window rather than the canvas, which is why a shot framed for the full canvas arrives cropped at the half-width stops.

### Fitting the lite shots

The wide distances in `CAMERA_STOPS` are hand-tuned against the wide `FRAMES` and stay exactly as they are. A slot has no such pairing — its shape is whatever the phone's width and the CSS height make it — so the lite path throws the distance away and solves it: `LITE_SPANS` names a world-space box per stop and the camera pulls back until that box **covers** the slot. Cover, not contain: taking the further of the two fits leaves the desk floating in the middle of a wide slot with paper all around it. Only the distance changes, so a phone sees the same four angles.

`LITE_SPANS` and the `.chapter-slot` heights in `App.css` are the two halves of that decision, the same way `FRAMES` and the chapter paddings are for the wide build. A shorter slot crops harder at the same span.

## Content

ALL copy lives in `src/content.js` (META, LOADER, CONTACT, PROFILE, CV, SOCIALS, CHAPTERS, CATEGORIES, ITEMS, TOOLS, BUNNIES). No strings in components. Chapters: `hero -> builder -> everything -> connect`.

- **No Chennai anywhere**, in any form. It was cut from the tagline, the eyebrow and the meta description.
- `builder` is the portfolio proper. Each `experience[]` entry is `{ when, role, org, metric, metricLabel, points[], stack[], href? }`. **The metric is the thing a reader keeps, so it has to be real**: 68.3% cross-validated, Top 20 nationally, 150+ startups vetted. NO invented metrics. `metric` is optional and an entry with no honest figure leaves the column empty. (The BCI number was 70.6%/75.5% until a data leak was found: CSP had been fitted over the whole dataset before splitting. Do not restore the old figures.)
- The BCI entry also carries `study`, a `{ label, rows[] }` case study rendered under the row. `the catch` row is the point of it: she found the CSP leak herself and the number went DOWN. Do not soften it and do not restore 75.5%.
- `everything` is `range: true`, the thirteen things set as type and grouped by `CATEGORIES`. `builder` is `tools: true`, the skills band at its foot.
- `PROFILE` and `CV` are the recruiter facts: degree, school, graduating mid-2027, open to a Jan - Jun 2027 research internship. **No CGPA on the site, her call.** `PROFILE.short` is the compressed hero version of the same three lines. `TOOLS` comes straight off her resume, nothing aspirational.
- **The CV is `public/Magadhi-Ravishankar-CV.pdf`, a copy of `OneDrive/Desktop/Magadhi Ravishankar Resume.pdf`.** It is a copy, not a link, so refreshing the resume means copying it across again **and re-running `python scripts/strip-cv-phone.py`**, which takes her phone number off the contact line and re-sets that line centred without it. Her call, 2026-09-29: the number does not go on a public download. Email and LinkedIn stay.
- Voice is plain. Em dashes are banned in her copy, so is the Oxford comma.

## DOM

- **`WorkList.jsx`** is selected work as an editorial hairline list: year left, role/org/points/stack middle, metric large right. In the half-width lane it takes the same single-column reflow the phone build uses, metric first.
- **`ToolBand.jsx`** is the skills band at the foot of the work chapter. It borrows RangeList's skeleton (mono label left, wrapped items right, one hairline per group) but sets the items small, so it reads as the spec under the work rather than a second headline list.
- **`RangeList.jsx`** is the thirteen things as grouped type with one shared caption line on hover. This replaced, in order, a physics pile, a card rail, a 3D voxel heap and a dome. Read the memory file before proposing another one.
- **`.chapter-slot`** is the empty box each chapter renders below the split breakpoint for the rig to clip the picture to. It carries no visuals of its own, only height.
- **Chrome is flat**, on phones too. `.glass` is a flat chip: 3px radius, one 1px ink rule, no blur. A `@media (pointer: coarse)` override was still painting the old frosted gradient on every chip below 768px long after v6.0 flattened them; it is gone. `.corner-cta` carries its own opaque `--surface` background instead, because it is fixed and every heading on the page eventually passes under it. The frosted iridescent version, the `.atmosphere` glow blooms, `.vignette` and `.cursor-glow` were all deleted, because they were a soft-focus language fighting a hard-edged picture. Do not restore them without asking.
- Lenis smooth scroll (skipped in lite and reduced-motion); `chapters/useChapterFade.js` gives scroll-linked dissolves; `AnnotationRail.jsx` is the fixed mono line that scramble-rewrites per chapter; `Magnetic.jsx` wraps the corner link and the socials; `Loader.jsx` is the boot overlay whose counter crawls to 88% until `bus.sceneReady` then sprints (the timing and the `dt` clamps are load-bearing, the dial is only styling); `Cursor.jsx` is desktop-only.
- **Pets (`src/pets/`)** are two pixel bunnies, Ash and Kiko. Hers, explicitly kept, do not propose cutting them. If you touch bunny art, rasterize and LOOK at it: ears must be long, narrow and separated.

## Modes

`liteMode` is a coarse pointer or a viewport at or under 768px, and it governs cost: device pixel ratio 1, no antialias, a 1024 shadow map, no Lenis, no cursor and no rail. `wide` is a viewport at or over 981px and it governs **composition**: which of the two picture arrangements the page is in. They are separate on purpose. The band between 769 and 980px is a mouse-driven desktop window that still gets the in-flow picture, which is the arrangement that fits it.

`prefers-reduced-motion` drops letter animation, parallax and the scroll reveals.

**Connect is bottom-anchored**, so every row added to it climbs toward the picture above. Add anything there and re-shoot the last stop at 1440x900: the sign-off landing on the desk is the failure mode. The hero is the mirror of it, where the scroll hint is the thing that gets pushed onto the picture's top edge.

## Styling

Tokens in `src/index.css`, layout in `src/App.css`. The ground is **warm paper** (`--paper: #e7e1d3`) carrying a 26px graph-paper grid, so the margin the picture gives up reads as the sheet the picture is lying on. `--tide` is the same blue the desk casts its shadows in, so type rules and the picture share one hue. This replaced the v5.0 pale-periwinkle palette on her call, deliberately.

Fonts: Bricolage Grotesque (display, weight 400 not 800), Newsreader (story), JetBrains Mono (annotations).

**Lint note:** `react-hooks/purity` and `immutability` are off for `src/scene/**` only. `react-hooks/refs` is NOT, so writing `ref.current` inside a `useMemo` will fail lint. Return the handle from the memo instead.

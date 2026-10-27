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

## Architecture (v8.0, "the field")

Single-page React 19 + Vite app. Entry: `src/main.jsx` -> `src/App.jsx`. **No StrictMode**, the custom rAF layers are simpler without dev double-mounting.

**The premise.** A dark page and one cloud of glowing particles that changes shape with the scroll: a ringed sphere for the hero, stacked signal traces for the work, a spiral disc for the range, a horizon for the sign-off. Every particle owns a slot in all four formations, so moving between chapters is the cloud pouring from one shape into the next, staggered per particle and swinging out on its own arc mid-flight. The field lives inside a **picture window** that opens on whichever side of the screen the chapter text is not using. The window has no border: the shader fades the field to exactly zero at its edges, and `.scene-frame` paints a radial glow that also reaches zero there.

v8.0 (2026-10-27) replaced the v7 desk, her words: "too old looking, i want fresh amazing seamless". She picked dark cinematic from four options. The desk is in git at `25f4bef` if ever needed.

**Layout rule (hers, non-negotiable):** nothing from the scene may sit behind **any** text. `FRAMES` in `field/fieldShapes.js` and the chapter paddings in `App.css` are two halves of one decision. Move one and you must move the other.

**Two compositions, one breakpoint.** At or above 981px (`wide`) the window is half the screen and the chapter text sits in the other half. Below it the window follows an empty `.chapter-slot` box in the flow, so the copy can never reach it. 981 appears in two places, `SPLIT_QUERY` in `App.jsx` and the `min-width` block in `App.css`, and they have to stay the same number.

### Scene (`src/scene/`)

Lazy-loaded R3F `<Canvas>` fixed behind the DOM (`Scene.jsx`), which mounts only `FieldRig` and `Field`. No shadows, no post-processing: additive points on a transparent canvas over a near-black page.

- **`scrollBus.js`** is a plain mutable object shared between the DOM and the frame loop. `bus.u` is the continuous chapter coordinate (0=hero to 3=connect) read from live section rects. `bus.field` is where the rig tells the field to sit. `CHAPTER_IDS` MUST match the ids in `content.js`. **Must stay three-free**, because DOM layers import it.
- **`field/fieldShapes.js`** holds `FRAMES` (the window per chapter), `EXTENTS` (each formation's half size, which the fit reads) and `buildFormations`, which seeds all four position sets. All three are length-coupled to the chapter count.
- **`field/FieldRig.jsx`** is the only writer of `bus.u`, `bus.sceneReady`, `bus.field` and the `--frame-*` CSS variables. It computes the window (from `FRAMES` on wide, from the nearest slot on lite), centres and scales the formation to fill 84% of it, and picks which two formations the scroll sits between and how far through the morph it is. The camera stays on the z axis and only drifts with the pointer.
- **`field/Field.jsx`** is the `Points` mesh and its shader. The vertex shader animates all four formations, blends the two current ones per particle, lets the pointer part the cloud and lets scroll velocity smear it. The fragment shader draws a soft dot and multiplies it by the distance to the window edge (`uRect`, in device pixels, GL origin bottom-left), which is what keeps the field off the type now that the canvas has no clip-path.

**Parked, still on disk, NOT mounted:** `Orb.jsx`, `orbShader.js`, `chapterMath.js`, `environments/*`, `Grade.jsx` (bloom and DOF), and `components/FluidSea.jsx` plus `Ferrofluid.jsx` (commented out in `App.jsx`). They are the v6.0 orb build.

### Things that will bite you

1. **`--frame-t/r/b/l` may only be declared on `:root`.** A copy on `.scene-canvas` beats the inherited value and silently freezes the window at its default.
2. **The field's edge fade is the only thing keeping it off the type.** If you ever add a clip-path back, fine, but never remove the `uRect` fade without one, or the cloud spills across the text column.
3. **The morph runs a little wider than the window swap** (`MORPH_LEAD` in FieldRig). That is deliberate: the cloud starts leaving before the window moves. It still finishes inside the window, because the edge fade follows the window, not the formation.
4. **A window with no height still paints.** `--frame-op` fades `.scene-frame` with the last of its height.

### Frame timing

`bus.u` equals `i` at chapter `i`'s centre line, so chapter `i` owns the screen for roughly `u` in `(i-0.5, i+0.5)`. The window HOLDS its shape either side of a centre and swaps across a slot in between. **That slot is measured, not fixed** — `swapWindows()` in `scrollBus.js` reads the live page and centres each swap halfway between the point chapter `i`'s type clears the screen and the point chapter `i+1`'s first reaches it, one window per gap.

It has to be per gap, because the chapters are nothing like each other in height (the work chapter is nearly three times the hero) and the single constant this replaced was 0.17 too late on the first gap and 0.15 too early on the last. The cost was not subtle: the entire work chapter arrived at **full opacity on top of the desk**, which is the one thing the layout rule forbids.

`useChapterFade` reads the same windows and gates each chapter's opacity to zero across them, so no type is ever lit while the window is crossing the screen. **The gate and the swap are two halves of one decision; change one and you must change the other.** Gaps 2 and 3 have no text-free instant available at all (the outgoing chapter outlasts the arrival of the incoming one), so there the gate is what does the work. None of this applies below the breakpoint, where the picture is a box in the flow and cannot cross anything: the gate stays open and the old scroll-linked dissolve runs alone.

**Verify with a scripted sweep, not by eye.** Walk the scroll in 0.01 steps, read `--frame-*` off `:root`, and intersect it with the client rect of every text node whose chapter is above ~0.03 opacity. It must print nothing. Screenshots at four stops will not catch this: all three overlaps sat between the stops.

### Fitting the lite shots

Below the breakpoint the window is whatever box `.chapter-slot` happens to be, and the formation is fitted to it the same way as on wide: centred, scaled to 84% of the box by `EXTENTS`. There is no per-stop tuning to keep in sync any more.

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
- **Chrome is flat**, on phones too. `.glass` is a flat chip: 3px radius, one 1px rule, no blur, rose on hover. A `@media (pointer: coarse)` override was still painting the old frosted gradient on every chip below 768px long after v6.0 flattened them; it is gone. `.corner-cta` carries its own opaque `--surface` background instead, because it is fixed and every heading on the page eventually passes under it. The frosted iridescent version, the `.atmosphere` glow blooms, `.vignette` and `.cursor-glow` were all deleted, because they were a soft-focus language fighting a hard-edged picture. Do not restore them without asking.
- Lenis smooth scroll (skipped in lite and reduced-motion); `chapters/useChapterFade.js` gives scroll-linked dissolves; `AnnotationRail.jsx` is the fixed mono line that scramble-rewrites per chapter; `Magnetic.jsx` wraps the corner link and the socials; `Loader.jsx` is the boot overlay whose counter crawls to 88% until `bus.sceneReady` then sprints (the timing and the `dt` clamps are load-bearing, the dial is only styling); `Cursor.jsx` is desktop-only.
- **Pets (`src/pets/`)** are two pixel bunnies, Ash and Kiko. Hers, explicitly kept, do not propose cutting them. If you touch bunny art, rasterize and LOOK at it: ears must be long, narrow and separated.

## Modes

`liteMode` is a coarse pointer or a viewport at or under 768px, and it governs cost: device pixel ratio 1, no antialias, 6,000 particles instead of 18,000, no Lenis, no cursor and no rail. `wide` is a viewport at or over 981px and it governs **composition**: which of the two picture arrangements the page is in. They are separate on purpose. The band between 769 and 980px is a mouse-driven desktop window that still gets the in-flow picture, which is the arrangement that fits it.

`prefers-reduced-motion` drops letter animation, parallax and the scroll reveals.

**Connect is bottom-anchored**, so every row added to it climbs toward the picture above. The hero is the mirror of it, where the scroll hint gets pushed onto the picture's top edge.

**Both ends are sized against the VIEWPORT HEIGHT, and that is the trap.** `FRAMES` puts the hero window at 46vh and the connect window's lower edge at 39vh, but type is a fixed pixel stack, so a short window shrinks the gap without shrinking the thing filling it. At 1536x864 — the commonest Windows laptop viewport — `say hi` sat 13px inside the picture and `scroll ↓` had zero clearance; at 1366x768 it was 68px. A window 900px tall is fine, which is exactly why shooting only 1440x900 missed it for two releases.

So the display type and every vertical gap in those two chapters carry a vh term (`min(10vw, 9.8vh)`, `min(1.6rem, 2vh)`). **Never give either chapter a fixed-rem vertical gap, and never size `.chapter-title` or `.hero-name` on vw alone.** Verify by sweeping window sizes, not one size: 1920x1080 down to 990x700, checking each text rect against the live `--frame-*`. Everything from 1920x1080 to 990x700 currently clears, the tightest being 12px.

## Styling

Tokens in `src/index.css`, layout in `src/App.css`. **Dark since v8.0**: `--paper` is `#08080b` (the name stayed, the colour is night), type is bone white `--ink` `#f2f0ec`, and there is ONE accent, rose `--tide` `#ff4d6d`, which is her burgundy brought up to a brightness that holds on black. The field adds a violet (`--cool-rgb`) for depth only; it never goes on type. The hero's full stop and every work metric carry the rose. Palette history: periwinkle, teal, royal blue, burgundy, now rose on black. Do not propose another without her asking.

**Colour literals come from `--tide-rgb` / `--ember-rgb` / `--ink-rgb` / `--cool-rgb` via `rgb(var(--tide-rgb) / 0.22)`. Do not hand-write a colour in App.css.** Every past palette swap left hardcoded `rgba()` behind. `--iris` and the bunny sprites are outside the palette.

**Every colour on type must clear 4.5:1 against `--paper`, checked by script, not by eye.** Current: `--tide` 6.22, `--ember` 8.94, `--dim` 8.67, `--faint` 5.12, `--ink` 17.6.

Fonts: **Geist** (display and body, variable 100..900, so the weight ripple works; hero 600, titles 500, tracked tight) and **Geist Mono** (annotations). The serif and the italics are gone: they were most of what read as "old". `index.html` carries an inline dark background so there is no white flash before the CSS loads.

**Lint note:** `react-hooks/purity` and `immutability` are off for `src/scene/**` only. `react-hooks/refs` is NOT, so writing `ref.current` inside a `useMemo` will fail lint. Return the handle from the memo instead.

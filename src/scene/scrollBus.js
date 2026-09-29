// Shared mutable state between the DOM world and the R3F frame loop.
// Written every frame by ScrollTracker / Orb, read by environments.
// Plain object on purpose — no react state churn at 60fps.
// Also home to the pure scroll-envelope math (no three.js import here —
// this module is shared with DOM layers that must stay out of the 3D chunk).

export const smoothstep = (a, b, x) => {
  const t = Math.min(Math.max((x - a) / (b - a), 0), 1);
  return t * t * (3 - 2 * t);
};

export const lerp = (a, b, t) => a + (b - a) * t;

/** Sea presence: full at the hero, gone mid-story, returns for connect. */
export function seaWeight(u) {
  return Math.max(1 - smoothstep(0.35, 0.95, u), smoothstep(2.55, 2.95, u));
}

/** Fluid rise: the sea fills the screen behind the jack-of-all-trades chapter (u≈2). */
export function riseWeight(u) {
  return smoothstep(1.4, 1.9, u) * (1 - smoothstep(2.3, 2.8, u));
}

export const bus = {
  u: 0,                      // continuous chapter coordinate: 0=hero … 4=connect
  vel: 0,                    // smoothed scroll velocity, px/s (signed)
  velN: 0,                   // vel clamped to -1..1 — drives skew/streak/squash
  sceneReady: false,         // true once the 3D scene has rendered a frame (loader waits on it)
  mouse: { x: 0, y: 0 },     // NDC, -1..1
  mouseActive: false,        // a fine pointer has actually moved (gates orb poke)
  mouseEnergy: 0,            // decays; excites the sea
  orb: {
    x: 0, y: 0, z: 0,
    scale: 1,
    // identity weights, all 0..1: [moon, spotlight, ball, electrode]
    w: [1, 0, 0, 0],
  },
};

export const CHAPTER_IDS = ['hero', 'builder', 'everything', 'connect'];

/**
 * Continuous chapter coordinate from live section rects.
 * u = i exactly when chapter i's center sits on the viewport center line.
 */
export function readChapterCoord() {
  const centerline = window.innerHeight * 0.5;
  const centers = [];
  for (const id of CHAPTER_IDS) {
    const el = document.getElementById(`ch-${id}`);
    if (!el) return bus.u; // DOM not ready — hold last value
    const r = el.getBoundingClientRect();
    centers.push(r.top + r.height / 2);
  }
  if (centerline <= centers[0]) return 0;
  const last = centers.length - 1;
  if (centerline >= centers[last]) return last;
  for (let i = 0; i < last; i++) {
    if (centerline >= centers[i] && centerline <= centers[i + 1]) {
      return i + (centerline - centers[i]) / (centers[i + 1] - centers[i]);
    }
  }
  return bus.u;
}

// Half-width of a swap, in gap coordinates, and the length of the dissolve
// that clears the type either side of one.
export const SWAP_HALF = 0.09;
export const SWAP_FADE = 0.07;

const FALLBACK = CHAPTER_IDS.slice(0, -1).map(() => [0.40, 0.58]);
const cache = { key: '', windows: FALLBACK };

/**
 * Where the picture window may swap from chapter i's shape to chapter i+1's,
 * as a pair of `u - i` coordinates, one entry per gap.
 *
 * The window has to sweep across the screen to get from one side to the other,
 * so it must do it while as little type is lit as possible. A single constant
 * cannot manage that, because the gaps are nothing like each other — the work
 * chapter is nearly three times the height of the hero — and one number put
 * the swap far too late on the first gap: the whole work chapter arrived at
 * full opacity while the window still wore the hero's shape, and the picture
 * ran straight through it.
 *
 * So each swap is centred on a measurement of the live page, halfway between
 * the point chapter i's type clears the screen and the point chapter i+1's
 * type first reaches it. On the gaps where the outgoing chapter outlasts the
 * arrival of the incoming one there is no clean instant at all, and that
 * midpoint is simply the least-lit one; `useChapterFade` takes both ends of
 * the type down around it.
 *
 * Measured off `offsetTop`/`offsetHeight`, never the client rect, because the
 * dissolve puts a transform on the very element being measured.
 */
export function swapWindows() {
  const key = `${window.innerWidth}x${window.innerHeight}x${document.body.scrollHeight}`;
  if (key === cache.key) return cache.windows;

  const vh = window.innerHeight;
  const boxes = [];
  for (const id of CHAPTER_IDS) {
    const el = document.getElementById(`ch-${id}`);
    const ink = el?.firstElementChild;
    if (!ink) return cache.windows;
    const r = el.getBoundingClientRect();
    const top = r.top + (ink.offsetTop - el.offsetTop);
    boxes.push({ centre: r.top + r.height / 2, inkTop: top, inkBottom: top + ink.offsetHeight });
  }

  const windows = [];
  for (let i = 0; i < boxes.length - 1; i++) {
    const gap = boxes[i + 1].centre - boxes[i].centre;
    if (!(gap > 0)) return cache.windows;
    const exit = (boxes[i].inkBottom - boxes[i].centre + vh / 2) / gap;
    const enter = (boxes[i + 1].inkTop - boxes[i].centre - vh / 2) / gap;
    // the upper clamp keeps the last swap clear of u = LAST, where the
    // coordinate stops advancing and a chapter fading in would never arrive
    const c = Math.min(Math.max((exit + enter) / 2, 0.18), 0.78);
    windows.push([c - SWAP_HALF, c + SWAP_HALF]);
  }

  cache.key = key;
  cache.windows = windows;
  return windows;
}

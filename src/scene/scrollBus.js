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
  mouse: { x: 0, y: 0 },     // NDC, -1..1
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

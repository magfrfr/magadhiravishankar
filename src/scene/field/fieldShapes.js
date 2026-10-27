// The field as data: one particle cloud, four formations, one per chapter.
// Every particle owns a slot in all four, so a scroll between chapters is the
// whole cloud flowing from one shape into the next rather than a cut.
//
// Formations are built inside a unit box and the rig scales them to fit the
// picture window, so EXTENTS (half width, half height) is what the fit reads.

// The picture window per chapter, as viewport fractions [x, y, w, h]. These are
// the scene half of the layout; the chapter paddings in App.css are the DOM
// half. Move one and you must move the other, or the type lands on the field.
export const FRAMES = [
  [0.06, 0.46, 0.88, 0.48],  // hero — wide band under the headline block
  [0.03, 0.12, 0.42, 0.76],  // builder — left panel, the work list rides the right
  [0.55, 0.12, 0.42, 0.76],  // everything — right panel, the words take the left
  [0.12, 0.05, 0.76, 0.34],  // connect — a top band, the sign-off sits under it
];

export const EXTENTS = [
  [1.9, 1.0],   // hero — the sphere plus the halo ring around it
  [1.0, 1.0],   // builder — stacked signal traces
  [1.15, 0.75], // everything — the spiral disc, tilted
  [2.4, 0.55],  // connect — the horizon
];

const TAU = Math.PI * 2;

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// a shell with a thin ring around it: most of the cloud on the sphere, a
// tenth of it orbiting, so the hero reads as a body with a field around it
function sphere(r, out, i) {
  if (r() < 0.12) {
    const a = r() * TAU;
    const rad = 1.45 + (r() - 0.5) * 0.35;
    out[i] = Math.cos(a) * rad;
    out[i + 1] = (r() - 0.5) * 0.05;
    out[i + 2] = Math.sin(a) * rad;
    return;
  }
  const z = r() * 2 - 1;
  const a = r() * TAU;
  const s = Math.sqrt(1 - z * z);
  const rad = 0.78 + Math.pow(r(), 3) * 0.2;
  out[i] = s * Math.cos(a) * rad;
  out[i + 1] = z * rad;
  out[i + 2] = s * Math.sin(a) * rad;
}

// channel index travels in z's sign-free slot: the shader reads y to know
// which trace a particle belongs to, so the traces stay evenly stacked
const CHANNELS = 9;
function waves(r, out, i) {
  const c = Math.floor(r() * CHANNELS);
  out[i] = r() * 2 - 1;
  out[i + 1] = (c / (CHANNELS - 1)) * 1.8 - 0.9;
  out[i + 2] = (r() - 0.5) * 0.06;
}

function spiral(r, out, i) {
  const arm = Math.floor(r() * 3);
  const d = Math.pow(r(), 0.7);
  const a = d * 5.2 + (arm * TAU) / 3 + (r() - 0.5) * 0.55 * (1 - d * 0.5);
  out[i] = Math.cos(a) * d * 1.1;
  out[i + 1] = (r() - 0.5) * 0.08 * (1.2 - d);
  out[i + 2] = Math.sin(a) * d * 1.1;
}

function horizon(r, out, i) {
  out[i] = (r() * 2 - 1) * 2.4;
  out[i + 1] = 0;
  out[i + 2] = (r() * 2 - 1) * 1.1;
}

const BUILDERS = [sphere, waves, spiral, horizon];

/** Four Float32Array position sets plus a per-particle seed, all of length count. */
export function buildFormations(count) {
  const r = rng(7);
  const sets = BUILDERS.map(() => new Float32Array(count * 3));
  const seed = new Float32Array(count);
  for (let p = 0; p < count; p++) {
    seed[p] = r();
    BUILDERS.forEach((fn, k) => fn(r, sets[k], p * 3));
  }
  return { sets, seed };
}

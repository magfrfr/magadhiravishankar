// The desk, as data. Every piece is a primitive: the look comes from the
// shading and the ink edges, not from modelling detail. Y is up and the desk
// surface sits at y = 0, so anything lying on it just needs a tiny y.
//
//   k    box | cyl | cone     (cyl args: [rTop, rBottom, h, seg])
//   a    geometry args
//   p    position
//   r    rotation (radians)
//   t    tint 0..1 — how far toward paper the piece sits (sheets are white)
//   e    false to skip the ink edge pass (round things with dense edges)
//   s    false to stop the piece casting a shadow
//   d    'signal' | 'chart' | 'notes' — line work generated onto the sheet
//   dev  this sheet's drawing develops with the scroll (only one should)

const P = Math.PI;

export const PIECES = [
  // ── the room ──────────────────────────────────────────
  { k: 'box', a: [26, 0.4, 14], p: [0, -0.2, -1], t: 0.74 },        // desk top
  { k: 'box', a: [30, 12, 0.4], p: [0, 6, -8.2], t: 0.02, e: false, s: false }, // back wall

  // ── paper ─────────────────────────────────────────────
  { k: 'box', a: [4.8, 0.02, 3.5], p: [-0.4, 0.02, 0.5], r: [0, 0.06, 0], t: 0.92, d: 'signal', dev: true },
  { k: 'box', a: [3.3, 0.02, 2.5], p: [2.2, 0.05, -1.0], r: [0, -0.3, 0], t: 0.86, d: 'chart' },
  { k: 'box', a: [2.1, 0.02, 1.5], p: [3.7, 0.08, 1.4], r: [0, 0.42, 0], t: 0.95, d: 'notes' },
  { k: 'box', a: [2.6, 0.02, 1.9], p: [-3.1, 0.04, 2.4], r: [0, -0.5, 0], t: 0.88, d: 'signal' },

  // ── laptop ────────────────────────────────────────────
  { k: 'box', a: [2.9, 0.14, 2.0], p: [-4.8, 0.07, 0.8], r: [0, 0.14, 0], t: 0.10 },
  { k: 'box', a: [2.9, 1.9, 0.1], p: [-5.0, 0.98, -0.13], r: [-0.26, 0.14, 0], t: 0.10 },

  // ── books, stacked and not quite square ───────────────
  { k: 'box', a: [2.4, 0.3, 1.7], p: [5.6, 0.15, 0.9], r: [0, 0.1, 0], t: 0.06 },
  { k: 'box', a: [2.3, 0.26, 1.6], p: [5.5, 0.43, 0.95], r: [0, -0.06, 0], t: 0.14 },
  { k: 'box', a: [2.1, 0.22, 1.5], p: [5.65, 0.67, 0.88], r: [0, 0.19, 0], t: 0.02 },

  // ── notebook, open ────────────────────────────────────
  { k: 'box', a: [1.9, 0.12, 2.6], p: [-2.6, 0.06, -2.6], r: [0, -0.16, 0], t: 0.80, d: 'notes' },

  // ── mug and pens ──────────────────────────────────────
  { k: 'cyl', a: [0.44, 0.4, 0.8, 20], p: [4.3, 0.4, -2.2], t: 0.55, e: false },
  { k: 'cyl', a: [0.045, 0.045, 1.5, 8], p: [4.2, 0.9, -2.3], r: [0.18, 0, 0.12], t: 0 },
  { k: 'cyl', a: [0.045, 0.045, 1.6, 8], p: [4.45, 0.92, -2.1], r: [-0.2, 0, -0.16], t: 0 },
  { k: 'cyl', a: [0.045, 0.045, 1.4, 8], p: [4.35, 0.86, -2.35], r: [0.1, 0, -0.24], t: 0.6 },

  // ── loose pencil and ruler on the sheets ──────────────
  { k: 'cyl', a: [0.06, 0.06, 2.0, 8], p: [1.2, 0.07, 2.3], r: [0, 0.5, P / 2], t: 0.7 },
  { k: 'cone', a: [0.06, 0.18, 8], p: [0.32, 0.07, 2.78], r: [0, 0.5, -P / 2], t: 0 },
  { k: 'box', a: [0.34, 0.03, 3.2], p: [-2.0, 0.05, 1.2], r: [0, 0.34, 0], t: 0.9 },

  // ── desk lamp ─────────────────────────────────────────
  { k: 'cyl', a: [0.75, 0.8, 0.14, 22], p: [-7.0, 0.07, -2.8], t: 0.2, e: false },
  { k: 'cyl', a: [0.09, 0.09, 3.4, 8], p: [-6.7, 1.7, -2.7], r: [0.1, 0, 0.18], t: 0.1 },
  { k: 'cyl', a: [0.09, 0.09, 2.2, 8], p: [-5.85, 3.2, -2.5], r: [0, 0, 1.15], t: 0.1 },
  { k: 'cone', a: [1.0, 1.1, 22], p: [-5.0, 2.9, -2.4], r: [0.35, 0, 2.5], t: 0.35, e: false },

  // ── plant ─────────────────────────────────────────────
  { k: 'cyl', a: [0.6, 0.44, 0.95, 18], p: [7.6, 0.47, -3.0], t: 0.25, e: false },
  { k: 'cone', a: [0.5, 1.7, 6], p: [7.4, 1.7, -2.9], r: [0.2, 0.3, 0.22], t: 0.4 },
  { k: 'cone', a: [0.42, 1.4, 6], p: [7.9, 1.55, -3.2], r: [-0.18, 0.9, -0.3], t: 0.4 },
  { k: 'cone', a: [0.36, 1.2, 6], p: [7.7, 1.4, -2.6], r: [0.32, 1.7, 0.05], t: 0.4 },

  // ── phone, face down ──────────────────────────────────
  { k: 'box', a: [0.9, 0.08, 1.8], p: [2.9, 0.04, 2.6], r: [0, -0.55, 0], t: 0 },
];

// Distances are set so the subject fits the *visible* half of the frame, not
// the whole canvas: at the two half-width stops we only ever see half the
// horizontal field, so a shot framed for the full canvas arrives cropped.
export const CAMERA_STOPS = [
  // The four stops have to differ in SCALE, not just angle, or the whole
  // ride reads as one crop sliding around. Wide room, down onto one sheet,
  // low across the objects, then a long pull out.
  // hero — establishing wide, the whole desk in a letterbox
  { pos: [0.0, 9.0, 17.0], tgt: [0, 0.5, -0.5] },
  // builder — pushed down onto the developing sheet, the way illoca pushes
  // onto the blueprint
  { pos: [-1.2, 7.5, 8.6], tgt: [-0.4, 0.05, 0.5] },
  // everything — low and close across the mug, the books and the plant
  { pos: [7.2, 3.8, 7.0], tgt: [5.7, 0.5, -0.9] },
  // connect — the long pull out, wider than the hero
  { pos: [6.0, 13.0, 21.0], tgt: [0.5, 0.5, -1.5] },
];

// Where the picture window sits at each stop, as viewport fractions
// [x, y, w, h]. The half the frame gives up is where the chapter text lands.
export const FRAMES = [
  [0.06, 0.46, 0.88, 0.48],  // hero — wide letterbox, the whole headline block clears it
  [0.03, 0.12, 0.42, 0.76],  // builder — left panel, work list rides the right
  [0.55, 0.12, 0.42, 0.76],  // everything — right panel, the words take the left
  [0.12, 0.05, 0.76, 0.34],  // connect — a top band, the sign-off sits well under it
];

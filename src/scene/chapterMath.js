import * as THREE from 'three';
import { smoothstep, lerp } from './scrollBus';

export { smoothstep, lerp, seaWeight, riseWeight } from './scrollBus';

// Orb identity codes (must match orbShader.js)
export const ID = { MOON: 0, SPOT: 1, BALL: 2, GRID: 3 };

// Identity at each chapter center: hero, builder, everything, connect
const IDENTITY_AT = [ID.MOON, ID.GRID, ID.BALL, ID.MOON];

// Orb radius at each identity
const SCALE_OF = { [ID.MOON]: 1.5, [ID.SPOT]: 0.95, [ID.BALL]: 0.5, [ID.GRID]: 0.85 };

// Rim glow color per identity: moonwash, sodium, tennis, biolume
export const RIM_OF = {
  [ID.MOON]: new THREE.Color('#c9c3dd'),
  [ID.SPOT]: new THREE.Color('#f2a97e'),
  [ID.BALL]: new THREE.Color('#d9f24e'),
  [ID.GRID]: new THREE.Color('#7fe9de'),
};

// Where the orb sits at each chapter center (world units, camera at z=8 fov 38).
// Rule: the orb never sits behind a text block — it takes the empty half.
const ANCHORS = [
  new THREE.Vector3(0.0, 1.5, 0),     // hero — glass bubble floats above the name
  new THREE.Vector3(-2.75, 0.55, 0),  // builder — globe holds the left margin, entries ride the right
  new THREE.Vector3(2.2, 1.9, -0.3),  // everything — ball parks high, ceding the floor to the inventory
  new THREE.Vector3(0.0, 1.9, -0.2),  // connect — moon sits above the sign-off, not behind it
];

// Per-chapter size trim, on top of the identity radius: keeps the orb inside
// its own space instead of spilling under the type.
const SCALE_AT = [0.8, 0.72, 1.0, 0.55];

export const ORB_PATH = new THREE.CatmullRomCurve3(ANCHORS, false, 'centripetal', 0.6);

/**
 * Everything the orb needs at chapter coordinate u.
 * Identities blend across the mid-region between chapter centers,
 * so each identity is pure while its chapter is on screen.
 */
export function orbStateAt(u) {
  const last = IDENTITY_AT.length - 1;
  const i = Math.min(Math.floor(u), last - 1);
  const f = u - i;
  const a = IDENTITY_AT[i];
  const b = IDENTITY_AT[i + 1];
  const t = a === b ? 0 : smoothstep(0.3, 0.7, f);

  const w = [0, 0, 0, 0];
  w[a] += 1 - t;
  w[b] += t;

  return {
    idA: a,
    idB: b,
    blend: t,
    scale: lerp(SCALE_OF[a], SCALE_OF[b], t) * lerp(SCALE_AT[i], SCALE_AT[i + 1], f),
    w,
    pos: ORB_PATH.getPoint(u / last),
  };
}


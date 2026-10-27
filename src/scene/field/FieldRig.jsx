import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { bus, readChapterCoord, lerp, smoothstep, swapWindows } from '../scrollBus';
import { FRAMES, EXTENTS } from './fieldShapes';

const LAST = FRAMES.length - 1;
export const CAM_DIST = 10;

const clamp = (x, a, b) => Math.min(Math.max(x, a), b);
const pct = (x) => `${(clamp(x, 0, 1) * 100).toFixed(2)}%`;

// The annotation rail and the corner link are FIXED chrome sized in pixels,
// while FRAMES is in viewport fractions, so on a short window the connect
// window climbs into them. No vh number can prevent that; the floor is in
// pixels too. The window loses height off its top and keeps its bottom edge.
const CHROME_PX = 64;

// how much wider than the window swap the formation morph runs, in gap
// coordinates: the cloud starts leaving a little before the window moves and
// finishes settling a little after, so the change reads as a flow, not a cut
const MORPH_LEAD = 0.14;

/** Picture window at chapter coordinate u, as viewport fractions [x,y,w,h]. */
function frameAt(u) {
  const i = Math.min(Math.floor(u), LAST - 1);
  // bus.u equals i at chapter i's centre line, so the window HOLDS its shape
  // either side of a centre and swaps across a slot measured per gap: the
  // chapters are wildly different heights and one constant cannot suit all
  // three. See swapWindows.
  const [s0, s1] = swapWindows()[i];
  const t = smoothstep(s0, s1, clamp(u - i, 0, 1));
  const a = FRAMES[i];
  const b = FRAMES[i + 1];
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t), lerp(a[3], b[3], t)];
}

function morphAt(u) {
  const i = Math.min(Math.floor(u), LAST - 1);
  const [s0, s1] = swapWindows()[i];
  return [i, smoothstep(s0 - MORPH_LEAD, s1 + MORPH_LEAD, clamp(u - i, 0, 1))];
}

/**
 * Which picture box the window belongs to below the breakpoint. The one with
 * the most height on screen wins; while none is on screen the last one is
 * kept, so the hand-off always happens off screen.
 */
function pickSlot(slots, prev) {
  const vh = window.innerHeight;
  let best = prev < slots.length ? prev : 0;
  let bestVis = 0;
  for (let i = 0; i < slots.length; i++) {
    const r = slots[i].getBoundingClientRect();
    const vis = Math.min(r.bottom, vh) - Math.max(r.top, 0);
    if (vis > bestVis) { bestVis = vis; best = i; }
  }
  return best;
}

/**
 * The scroll drives two things here. The picture window opens and closes on
 * the side of the screen the chapter text is not using, and the particle field
 * inside it flows from one chapter's formation to the next. This rig owns the
 * first and tells the field where to sit for the second, through bus.field.
 *
 * Below the split breakpoint (`wide` is false) the window follows a real box
 * in the flow instead, `.chapter-slot`, so a chapter can run as tall as it
 * likes without the copy ever crossing the field.
 */
export default function FieldRig({ liteMode, reducedMotion, wide }) {
  const { camera } = useThree();
  const root = useMemo(() => document.documentElement, []);
  // live collection: the slots mount and unmount with the breakpoint
  const slots = useMemo(() => document.getElementsByClassName('chapter-slot'), []);
  const ready = useRef(false);
  const slot = useRef(0);

  useFrame((state, dt) => {
    const k = Math.min(dt * 5, 1);
    bus.u = lerp(bus.u, readChapterCoord(), k);
    bus.mouseEnergy *= Math.pow(0.35, dt);
    const u = clamp(bus.u, 0, LAST);

    let fx, fy, fw, fh;
    if (wide || slots.length === 0) {
      [fx, fy, fw, fh] = frameAt(u);
      const floor = CHROME_PX / window.innerHeight;
      if (fy < floor) {
        fh = Math.max(fy + fh - floor, 0.05);
        fy = floor;
      }
    } else {
      slot.current = pickSlot(slots, slot.current);
      const r = slots[slot.current].getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      fx = r.left / vw;
      fy = r.top / vh;
      fw = r.width / vw;
      fh = r.height / vh;
    }

    root.style.setProperty('--frame-t', pct(fy));
    root.style.setProperty('--frame-r', pct(1 - fx - fw));
    root.style.setProperty('--frame-b', pct(1 - fy - fh));
    root.style.setProperty('--frame-l', pct(fx));
    const onScreen = Math.min(fy + fh, 1) - Math.max(fy, 0);
    root.style.setProperty('--frame-op', smoothstep(0.004, 0.03, onScreen).toFixed(3));

    // place the formation in the middle of the visible window and size it to
    // fill most of it, with the camera held still on the z axis
    const halfH = Math.tan((camera.fov * Math.PI) / 360) * CAM_DIST;
    const halfW = halfH * camera.aspect;
    const [seg, morph] = morphAt(u);
    const ew = lerp(EXTENTS[seg][0], EXTENTS[seg + 1][0], morph);
    const eh = lerp(EXTENTS[seg][1], EXTENTS[seg + 1][1], morph);
    const ww = fw * 2 * halfW;
    const wh = fh * 2 * halfH;

    const f = bus.field;
    f.x = (fx + fw / 2 - 0.5) * 2 * halfW;
    f.y = -(fy + fh / 2 - 0.5) * 2 * halfH;
    f.scale = Math.min(ww / (2 * ew), wh / (2 * eh)) * 0.84;
    f.seg = seg;
    f.morph = morph;
    // the window in device pixels, GL origin bottom-left, for the edge fade
    const W = state.size.width;
    const H = state.size.height;
    f.rect[0] = fx * W;
    f.rect[1] = (1 - fy - fh) * H;
    f.rect[2] = (fx + fw) * W;
    f.rect[3] = (1 - fy) * H;

    const px = !liteMode && !reducedMotion ? bus.mouse.x * 0.35 : 0;
    const py = !liteMode && !reducedMotion ? bus.mouse.y * 0.22 : 0;
    camera.position.x = lerp(camera.position.x, px, k * 0.6);
    camera.position.y = lerp(camera.position.y, py, k * 0.6);
    camera.position.z = CAM_DIST;
    camera.lookAt(camera.position.x * 0.4, camera.position.y * 0.4, 0);

    if (!ready.current) {
      ready.current = true;
      bus.sceneReady = true;
    }
  }, -1);

  return null;
}

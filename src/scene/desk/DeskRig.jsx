import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { bus, readChapterCoord, lerp, smoothstep } from '../scrollBus';
import { CAMERA_STOPS, FRAMES, LITE_SPANS } from './deskPieces';

const LAST = CAMERA_STOPS.length - 1;

const POS_PATH = new THREE.CatmullRomCurve3(
  CAMERA_STOPS.map(s => new THREE.Vector3(...s.pos)), false, 'centripetal', 0.4
);
const TGT_PATH = new THREE.CatmullRomCurve3(
  CAMERA_STOPS.map(s => new THREE.Vector3(...s.tgt)), false, 'centripetal', 0.4
);

const clamp = (x, a, b) => Math.min(Math.max(x, a), b);
const pct = (x) => `${(clamp(x, 0, 1) * 100).toFixed(2)}%`;

/** Picture window at chapter coordinate u, as viewport fractions [x,y,w,h]. */
function frameAt(u) {
  const i = Math.min(Math.floor(u), LAST - 1);
  // bus.u equals i at chapter i's centre line, so chapter i owns the screen
  // for roughly u in (i-0.5, i+0.5). The window therefore has to HOLD its
  // shape either side of a centre and swap across the midpoint between two.
  // Too slow and it sweeps under the arriving text; too early and a chapter
  // sits on the next chapter's window, which is worse.
  const t = smoothstep(0.40, 0.70, clamp(u - i, 0, 1));
  const a = FRAMES[i];
  const b = FRAMES[i + 1];
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t), lerp(a[3], b[3], t)];
}

/** The world-space box the shot should cover at u, for the fitted lite path. */
function spanAt(u) {
  const i = Math.min(Math.floor(u), LAST - 1);
  const t = clamp(u - i, 0, 1);
  const a = LITE_SPANS[i];
  const b = LITE_SPANS[i + 1];
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
}

/**
 * Which picture box the window belongs to. The one with the most height on
 * screen wins; while none is on screen the last one is kept, so the swap from
 * one chapter's picture to the next always happens off screen where it cannot
 * be seen as a jump.
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
 * The scroll no longer moves an object down the page — it dollies the camera
 * through the desk, and the picture window it is seen through opens and closes
 * around it. The half the window gives up is where the chapter text goes, so
 * the composition creates the text column instead of leaving it empty.
 *
 * Below the split breakpoint (`wide` is false) there is no half to give up.
 * The window follows a real box in the flow instead — `.chapter-slot` — so a
 * chapter can run as tall as it likes without the copy ever crossing the
 * picture, and the shot is fitted to that box rather than framed for a
 * desktop letterbox.
 */
export default function DeskRig({ liteMode, reducedMotion, wide }) {
  const { camera } = useThree();
  const root = useMemo(() => document.documentElement, []);
  // live collection: the slots mount and unmount with the breakpoint
  const slots = useMemo(() => document.getElementsByClassName('chapter-slot'), []);
  const v = useMemo(() => ({
    pos: new THREE.Vector3(),
    tgt: new THREE.Vector3(),
    right: new THREE.Vector3(),
    up: new THREE.Vector3(),
    fwd: new THREE.Vector3(),
    off: new THREE.Vector3(),
  }), []);
  const ready = useRef(false);
  const slot = useRef(0);

  useFrame((_, dt) => {
    const k = Math.min(dt * 5, 1);
    bus.u = lerp(bus.u, readChapterCoord(), k);
    bus.mouseEnergy *= Math.pow(0.35, dt);

    const u = clamp(bus.u, 0, LAST);
    POS_PATH.getPoint(u / LAST, v.pos);
    TGT_PATH.getPoint(u / LAST, v.tgt);

    let fx, fy, fw, fh;
    if (wide || slots.length === 0) {
      [fx, fy, fw, fh] = frameAt(u);
    } else {
      slot.current = pickSlot(slots, slot.current);
      const r = slots[slot.current].getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      // geometric, not clipped: the shot stays locked to the box as the box
      // travels up the screen, the way a picture on a page does
      fx = r.left / vw;
      fy = r.top / vh;
      fw = r.width / vw;
      fh = r.height / vh;
    }

    root.style.setProperty('--frame-t', pct(fy));
    root.style.setProperty('--frame-r', pct(1 - fx - fw));
    root.style.setProperty('--frame-b', pct(1 - fy - fh));
    root.style.setProperty('--frame-l', pct(fx));
    // a window clipped to nothing still draws its hairline as a rule across
    // the screen edge, so the frame fades out with the last of its height
    const onScreen = Math.min(fy + fh, 1) - Math.max(fy, 0);
    root.style.setProperty('--frame-op', smoothstep(0.004, 0.03, onScreen).toFixed(3));

    v.fwd.subVectors(v.tgt, v.pos);
    let dist = v.fwd.length();
    v.fwd.divideScalar(dist || 1);

    // The desktop stop distances are hand-tuned against the desktop frames and
    // stay as they are. The lite path has no such pairing — the box is
    // whatever the phone's width and the slot height make it — so its shots
    // are fitted: pull back until the named world box covers the window.
    if (!wide && slots.length > 0) {
      const tanH = Math.tan((camera.fov * Math.PI) / 360);
      const [sw, sh] = spanAt(u);
      // the nearer of the two fits, so the shot always fills the box and the
      // box decides the crop. Taking the further one instead leaves the desk
      // floating in the middle of a wide slot with paper all around it.
      dist = Math.min(
        sw / (2 * tanH * camera.aspect * Math.max(fw, 0.05)),
        sh / (2 * tanH * Math.max(fh, 0.05))
      );
    }

    // Pan so the subject sits in the middle of the *visible* window rather
    // than the middle of the canvas. Moving the camera moves the image the
    // other way, hence the negative on x.
    v.right.crossVectors(v.fwd, camera.up).normalize();
    v.up.crossVectors(v.right, v.fwd).normalize();
    const halfH = Math.tan((camera.fov * Math.PI) / 360) * dist;
    const halfW = halfH * camera.aspect;
    const cx = fx + fw / 2;
    const cy = fy + fh / 2;
    v.off.copy(v.right).multiplyScalar(-(cx - 0.5) * 2 * halfW)
      .addScaledVector(v.up, (cy - 0.5) * 2 * halfH);

    if (!liteMode && !reducedMotion) {
      v.off.addScaledVector(v.right, bus.mouse.x * 0.28);
      v.off.addScaledVector(v.up, bus.mouse.y * 0.18);
    }

    camera.position.copy(v.tgt).addScaledVector(v.fwd, -dist).add(v.off);
    v.tgt.add(v.off);
    camera.lookAt(v.tgt);

    if (!ready.current) {
      ready.current = true;
      bus.sceneReady = true;
    }
  }, -1);

  return null;
}

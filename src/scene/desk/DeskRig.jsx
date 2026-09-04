import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { bus, readChapterCoord, lerp, smoothstep } from '../scrollBus';
import { CAMERA_STOPS, FRAMES } from './deskPieces';

const LAST = CAMERA_STOPS.length - 1;

const POS_PATH = new THREE.CatmullRomCurve3(
  CAMERA_STOPS.map(s => new THREE.Vector3(...s.pos)), false, 'centripetal', 0.4
);
const TGT_PATH = new THREE.CatmullRomCurve3(
  CAMERA_STOPS.map(s => new THREE.Vector3(...s.tgt)), false, 'centripetal', 0.4
);

/** Picture window at chapter coordinate u, as viewport fractions [x,y,w,h]. */
function frameAt(u) {
  const i = Math.min(Math.floor(u), LAST - 1);
  // bus.u equals i at chapter i's centre line, so chapter i owns the screen
  // for roughly u in (i-0.5, i+0.5). The window therefore has to HOLD its
  // shape either side of a centre and swap across the midpoint between two.
  // Too slow and it sweeps under the arriving text; too early and a chapter
  // sits on the next chapter's window, which is worse.
  const t = smoothstep(0.40, 0.70, Math.min(Math.max(u - i, 0), 1));
  const a = FRAMES[i];
  const b = FRAMES[i + 1];
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t), lerp(a[3], b[3], t)];
}

/**
 * The scroll no longer moves an object down the page — it dollies the camera
 * through the desk, and the picture window it is seen through opens and closes
 * around it. The half the window gives up is where the chapter text goes, so
 * the composition creates the text column instead of leaving it empty.
 */
export default function DeskRig({ liteMode, reducedMotion }) {
  const { camera } = useThree();
  const root = useMemo(() => document.documentElement, []);
  const v = useMemo(() => ({
    pos: new THREE.Vector3(),
    tgt: new THREE.Vector3(),
    right: new THREE.Vector3(),
    up: new THREE.Vector3(),
    fwd: new THREE.Vector3(),
    off: new THREE.Vector3(),
  }), []);
  const ready = useRef(false);

  useFrame((_, dt) => {
    const k = Math.min(dt * 5, 1);
    bus.u = lerp(bus.u, readChapterCoord(), k);
    bus.mouseEnergy *= Math.pow(0.35, dt);

    const p = Math.min(Math.max(bus.u, 0), LAST) / LAST;
    POS_PATH.getPoint(p, v.pos);
    TGT_PATH.getPoint(p, v.tgt);

    const [fx, fy, fw, fh] = frameAt(Math.min(Math.max(bus.u, 0), LAST));
    root.style.setProperty('--frame-t', `${(fy * 100).toFixed(2)}%`);
    root.style.setProperty('--frame-r', `${((1 - fx - fw) * 100).toFixed(2)}%`);
    root.style.setProperty('--frame-b', `${((1 - fy - fh) * 100).toFixed(2)}%`);
    root.style.setProperty('--frame-l', `${(fx * 100).toFixed(2)}%`);

    // Pan so the subject sits in the middle of the *visible* window rather
    // than the middle of the canvas. Moving the camera moves the image the
    // other way, hence the negative on x.
    v.fwd.subVectors(v.tgt, v.pos);
    const dist = v.fwd.length();
    v.fwd.divideScalar(dist || 1);
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

    camera.position.copy(v.pos).add(v.off);
    v.tgt.add(v.off);
    camera.lookAt(v.tgt);

    if (!ready.current) {
      ready.current = true;
      bus.sceneReady = true;
    }
  }, -1);

  return null;
}

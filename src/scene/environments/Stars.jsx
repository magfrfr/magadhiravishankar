import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { bus } from '../scrollBus';

// Always-on dust field: the continuity glue between every chapter. Ink specks
// on the pale build, where white points were invisible — they read as motes
// hanging in the room, and depth of field throws them nicely out of focus.
// A ghost copy of the field trails the scroll velocity so fast scrolling
// streaks them into short comet tails.
export default function Stars({ liteMode }) {
  const ghost = useRef();
  const count = liteMode ? 120 : 320;
  const positions = useMemo(() => {
    const p = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      p[i * 3] = (Math.random() - 0.5) * 14;
      p[i * 3 + 1] = (Math.random() - 0.35) * 8;
      p[i * 3 + 2] = -4 - Math.random() * 3;
    }
    return p;
  }, [count]);

  const mat = useMemo(
    () =>
      new THREE.PointsMaterial({
        color: '#3d4766',
        size: 0.03,
        transparent: true,
        opacity: 0.55,
        depthWrite: false,
        sizeAttenuation: true,
      }),
    []
  );

  const ghostMat = useMemo(
    () =>
      new THREE.PointsMaterial({
        color: '#3d4766',
        size: 0.03,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        sizeAttenuation: true,
      }),
    []
  );

  useFrame(() => {
    const g = ghost.current;
    if (!g) return;
    const n = bus.velN;
    g.position.y = n * 1.1;
    ghostMat.opacity = Math.min(Math.abs(n) * 0.8, 0.65);
  });

  return (
    <>
      <points material={mat}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
      </points>
      {!liteMode && (
        <points ref={ghost} material={ghostMat}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          </bufferGeometry>
        </points>
      )}
    </>
  );
}

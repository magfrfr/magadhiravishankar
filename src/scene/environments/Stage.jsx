import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { bus } from '../scrollBus';
import { ID } from '../chapterMath';

const MOTES = 130;

// Dust drifting up through the spotlight beam, and a warm pool on the floor.
export default function Stage({ liteMode }) {
  const points = useRef();
  const pool = useRef();
  const count = liteMode ? 50 : MOTES;

  const { positions, seeds } = useMemo(() => {
    const p = new Float32Array(count * 3);
    const s = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      p[i * 3] = (Math.random() - 0.5) * 2.4;
      p[i * 3 + 1] = Math.random(); // 0 floor → 1 lamp, normalized
      p[i * 3 + 2] = (Math.random() - 0.5) * 0.8;
      s[i] = Math.random();
    }
    return { positions: p, seeds: s };
  }, [count]);

  const poolMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: '#f2a97e',
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    []
  );
  const moteMat = useMemo(
    () =>
      new THREE.PointsMaterial({
        color: '#ffe9cf',
        size: 0.035,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        sizeAttenuation: true,
      }),
    []
  );

  useFrame(() => {
    const w = bus.orb.w[ID.SPOT];
    const visible = w > 0.02;
    points.current.visible = visible;
    pool.current.visible = visible;
    if (!visible) return;

    const t = performance.now() / 1000;
    const beamTopY = bus.orb.y;
    const beamLen = 3.6;
    const arr = points.current.geometry.attributes.position.array;
    for (let i = 0; i < count; i++) {
      const rise = (seeds[i] + t * 0.03 * (0.5 + seeds[i])) % 1;
      const spread = 0.25 + rise * 1.3; // beam widens toward the floor
      arr[i * 3] = bus.orb.x + Math.sin(seeds[i] * 40 + t * 0.4) * spread * 0.8;
      arr[i * 3 + 1] = beamTopY - rise * beamLen;
      arr[i * 3 + 2] = bus.orb.z - 0.2 + Math.cos(seeds[i] * 27 + t * 0.3) * spread * 0.3;
    }
    points.current.geometry.attributes.position.needsUpdate = true;
    moteMat.opacity = w * 0.8;

    pool.current.position.set(bus.orb.x, beamTopY - beamLen, bus.orb.z - 0.2);
    poolMat.opacity = w * 0.15;
  });

  return (
    <>
      <points ref={points} material={moteMat}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
      </points>
      <mesh ref={pool} material={poolMat} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[1.7, 40]} />
      </mesh>
    </>
  );
}

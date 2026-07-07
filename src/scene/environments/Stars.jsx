import { useMemo } from 'react';
import * as THREE from 'three';

// Always-on night sky: the continuity glue between every chapter.
export default function Stars({ liteMode }) {
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
        color: '#eae6f2',
        size: 0.025,
        transparent: true,
        opacity: 0.55,
        depthWrite: false,
        sizeAttenuation: true,
      }),
    []
  );

  return (
    <points material={mat}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
    </points>
  );
}

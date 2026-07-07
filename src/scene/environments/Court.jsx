import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { bus } from '../scrollBus';
import { ID, COURT_GROUND_Y } from '../chapterMath';

const TRAIL = 44;

const baselineFragment = /* glsl */ `
uniform float uOpacity;
varying vec2 vUv;
void main() {
  vec2 c = vUv - 0.5;
  float a = exp(-abs(c.x) * 7.0) * exp(-abs(c.y) * 9.0) * uOpacity;
  gl_FragColor = vec4(0.95, 0.66, 0.49, a);
}
`;

const baselineVertex = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

// The rally: a fading trajectory trail behind the ball and a glowing baseline
// that flashes on every bounce.
export default function Court() {
  const line = useRef();
  const baseline = useRef();
  const head = useRef(0);
  const ring = useMemo(() => new Float32Array(TRAIL * 3), []);
  const seeded = useRef(false);

  const trailMat = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: '#d9f24e',
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    []
  );
  const baseMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: baselineVertex,
        fragmentShader: baselineFragment,
        uniforms: { uOpacity: { value: 0 } },
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    []
  );

  useFrame(() => {
    const w = bus.orb.w[ID.BALL];
    const visible = w > 0.02;
    line.current.visible = visible;
    baseline.current.visible = visible;
    if (!visible) {
      seeded.current = false;
      return;
    }

    if (!seeded.current) {
      // fill the whole ring with the current position so the trail grows out
      // of the ball instead of streaking across the screen
      for (let i = 0; i < TRAIL; i++) {
        ring[i * 3] = bus.orb.x;
        ring[i * 3 + 1] = bus.orb.y;
        ring[i * 3 + 2] = bus.orb.z;
      }
      seeded.current = true;
    }

    head.current = (head.current + 1) % TRAIL;
    ring[head.current * 3] = bus.orb.x;
    ring[head.current * 3 + 1] = bus.orb.y;
    ring[head.current * 3 + 2] = bus.orb.z;

    // unroll the ring buffer oldest→newest into the geometry
    const arr = line.current.geometry.attributes.position.array;
    for (let i = 0; i < TRAIL; i++) {
      const src = (head.current + 1 + i) % TRAIL;
      arr[i * 3] = ring[src * 3];
      arr[i * 3 + 1] = ring[src * 3 + 1];
      arr[i * 3 + 2] = ring[src * 3 + 2];
    }
    line.current.geometry.attributes.position.needsUpdate = true;
    trailMat.opacity = w * 0.55;

    baseline.current.position.x = bus.orb.x;
    baseMat.uniforms.uOpacity.value = w * (0.25 + bus.orb.ground * 0.9);
  });

  return (
    <>
      <line ref={line} material={trailMat}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[new Float32Array(TRAIL * 3), 3]} />
        </bufferGeometry>
      </line>
      <mesh ref={baseline} material={baseMat} position={[0, COURT_GROUND_Y - 0.35, -0.3]}>
        <planeGeometry args={[6, 0.5]} />
      </mesh>
    </>
  );
}

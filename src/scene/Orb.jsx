import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { bus, readChapterCoord } from './scrollBus';
import { orbStateAt, ID, RIM_OF, lerp } from './chapterMath';
import { orbVertex, orbFragment, glowVertex, glowFragment } from './orbShader';

export default function Orb({ reducedMotion }) {
  const mesh = useRef();
  const glow = useRef();
  const rim = useMemo(() => new THREE.Color(), []);

  const orbMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: orbVertex,
        fragmentShader: orbFragment,
        uniforms: {
          uTime: { value: 0 },
          uIdA: { value: 0 },
          uIdB: { value: 0 },
          uBlend: { value: 0 },
          uRim: { value: new THREE.Color('#c9c3dd') },
        },
      }),
    []
  );

  const glowMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: glowVertex,
        fragmentShader: glowFragment,
        uniforms: {
          uColor: { value: new THREE.Color('#c9c3dd') },
          uIntensity: { value: 0.55 },
        },
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    []
  );

  // Runs before every environment (priority -1): computes the frame's truth
  // (chapter coord + orb state) and publishes it on the bus.
  useFrame((state, dt) => {
    const t = performance.now() / 1000;
    bus.u = lerp(bus.u, readChapterCoord(), Math.min(dt * 5, 1)); // eased, no snap
    const s = orbStateAt(bus.u);

    // anchors are designed for a ~16:9 frustum (half-width 4.4); on narrow
    // screens squeeze x inward and shrink the orb so it stays in frame
    const halfW = state.viewport.width / 2;
    const xf = Math.min(1, halfW / 4.4);
    const sizeF = 0.55 + 0.45 * xf;

    const m = mesh.current;
    m.position.set(s.pos.x * xf, s.pos.y, s.pos.z);
    m.scale.setScalar(s.scale * sizeF);

    // spin: barely for the moon, lively for the ball
    if (!reducedMotion) {
      m.rotation.y = t * 0.05;
      m.rotation.z -= dt * 4.5 * s.w[ID.BALL];
    }

    orbMat.uniforms.uTime.value = t;
    orbMat.uniforms.uIdA.value = s.idA;
    orbMat.uniforms.uIdB.value = s.idB;
    orbMat.uniforms.uBlend.value = s.blend;
    rim.copy(RIM_OF[s.idA]).lerp(RIM_OF[s.idB], s.blend);
    orbMat.uniforms.uRim.value.copy(rim);

    // halo tracks the orb
    const g = glow.current;
    g.position.copy(m.position);
    g.position.z += 0.01;
    g.scale.setScalar(s.scale * sizeF * 3.0);
    glowMat.uniforms.uColor.value.copy(rim);
    glowMat.uniforms.uIntensity.value = 0.45 + 0.15 * s.w[ID.MOON] + 0.2 * s.w[ID.BALL];

    bus.orb.x = m.position.x;
    bus.orb.y = m.position.y;
    bus.orb.z = m.position.z;
    bus.orb.scale = s.scale * sizeF;
    bus.orb.w = s.w;
  }, -1);

  return (
    <>
      <mesh ref={mesh} material={orbMat}>
        <sphereGeometry args={[1, 64, 64]} />
      </mesh>
      <mesh ref={glow} material={glowMat}>
        <planeGeometry args={[1, 1]} />
      </mesh>
    </>
  );
}

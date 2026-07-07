import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { bus } from '../scrollBus';
import { seaWeight } from '../chapterMath';

const seaVertex = /* glsl */ `
uniform float uTime;
varying vec2 vLocal;
varying float vH;
void main() {
  vLocal = position.xy;
  float h =
    0.16 * sin(position.x * 0.7 + uTime * 0.9) +
    0.11 * sin(position.x * 1.7 - uTime * 1.25 + position.y * 0.6) +
    0.05 * sin(position.x * 3.6 + uTime * 2.0 + position.y * 1.7);
  vH = h;
  vec3 p = position + vec3(0.0, 0.0, h);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}
`;

const seaFragment = /* glsl */ `
uniform float uTime;
uniform float uOpacity;
uniform float uOrbX;
uniform float uMoonW;
uniform vec2 uMouse;
uniform float uMouseE;
varying vec2 vLocal;
varying float vH;

float hash2(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

void main() {
  vec3 deep = vec3(0.028, 0.05, 0.11);
  vec3 midw = vec3(0.05, 0.10, 0.19);
  float toward = smoothstep(-7.0, 7.0, vLocal.y);
  vec3 col = mix(midw, deep, toward);
  col += vec3(0.10, 0.22, 0.24) * max(vH, 0.0) * 2.2; // crest catch-light

  // bioluminescent speckle — fine grains that twinkle on their own clocks,
  // riding the wave crests
  vec2 cell = floor(vLocal * 11.0);
  float h = hash2(cell);
  float tw = smoothstep(0.90, 1.0, sin(uTime * (1.2 + h * 2.0) + h * 6.283));
  float crest = smoothstep(0.02, 0.14, vH);
  float spark = step(0.965, h) * tw * crest;
  col += vec3(0.22, 0.68, 0.62) * spark * 0.9;

  // moon lane — a soft streak under wherever the moon hangs
  float lane = exp(-abs(vLocal.x - uOrbX) * 0.75) * uMoonW;
  col += vec3(0.55, 0.53, 0.66) * lane * (0.16 + max(vH, 0.0) * 0.9);

  // cursor ripple — additive-only rings so the water never goes murky
  float d = distance(vLocal, uMouse);
  float ring = max(sin(d * 7.0 - uTime * 4.5), 0.0);
  col += vec3(0.22, 0.65, 0.60) * ring * exp(-d * 1.4) * uMouseE * 0.16;

  gl_FragColor = vec4(col, uOpacity * (0.9 + vH * 0.3));
}
`;

export default function Sea({ liteMode }) {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: seaVertex,
        fragmentShader: seaFragment,
        uniforms: {
          uTime: { value: 0 },
          uOpacity: { value: 1 },
          uOrbX: { value: 0 },
          uMoonW: { value: 1 },
          uMouse: { value: new THREE.Vector2(99, 99) },
          uMouseE: { value: 0 },
        },
        transparent: true,
        depthWrite: false,
      }),
    []
  );
  const mesh = useRef();

  useFrame(() => {
    const w = seaWeight(bus.u);
    mesh.current.visible = w > 0.01;
    if (!mesh.current.visible) return;
    mat.uniforms.uTime.value = performance.now() / 1000;
    mat.uniforms.uOpacity.value = w;
    mat.uniforms.uOrbX.value = bus.orb.x;
    mat.uniforms.uMoonW.value = bus.orb.w[0] * w;
    // map cursor NDC onto sea-plane coords: x across, lower half of screen = depth
    mat.uniforms.uMouse.value.set(bus.mouse.x * 5.0, (-bus.mouse.y - 0.15) * 6.0);
    mat.uniforms.uMouseE.value = bus.mouseEnergy;
  });

  return (
    <mesh ref={mesh} material={mat} rotation-x={-Math.PI / 2.35} position={[0, -1.75, -1.5]}>
      <planeGeometry args={[30, 15, liteMode ? 48 : 128, liteMode ? 24 : 64]} />
    </mesh>
  );
}

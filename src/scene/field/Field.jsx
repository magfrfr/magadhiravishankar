import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { bus, lerp } from '../scrollBus';
import { buildFormations } from './fieldShapes';
import { CAM_DIST } from './FieldRig';

const VERT = /* glsl */ `
uniform float uTime;
uniform float uSeg;
uniform float uMorph;
uniform float uVel;
uniform float uSize;
uniform vec3 uMouse;
attribute vec3 aP0;
attribute vec3 aP1;
attribute vec3 aP2;
attribute vec3 aP3;
attribute float aSeed;
varying float vSeed;
varying float vDepth;
varying float vAlpha;

vec3 rotY(vec3 p, float a) { float c = cos(a), s = sin(a); return vec3(c * p.x + s * p.z, p.y, -s * p.x + c * p.z); }
vec3 rotX(vec3 p, float a) { float c = cos(a), s = sin(a); return vec3(p.x, c * p.y - s * p.z, s * p.y + c * p.z); }

void main() {
  float t = uTime;

  // hero: the shell breathes, the whole body turns, the ring stays flat
  vec3 s0 = aP0;
  if (length(s0) < 1.2) {
    s0 *= 1.0 + sin(s0.x * 3.0 + t) * sin(s0.y * 4.0 - t * 0.8) * sin(s0.z * 3.0 + t * 0.6) * 0.09;
  }
  s0 = rotX(rotY(s0, t * 0.12), 0.32);

  // work: stacked traces, each with its own phase, and a burst that walks
  // along every channel the way an event shows up in a recording
  vec3 s1 = aP1;
  float ch = s1.y;
  float walk = mod(t * 0.32 + ch * 0.9 + 1.3, 2.6) - 1.3;
  float burst = exp(-pow((s1.x - walk) * 5.0, 2.0));
  s1.y += sin(s1.x * 5.0 + t * 1.6 + ch * 7.0) * 0.045
        + sin(s1.x * 17.0 + t * 3.1 + ch * 3.0) * 0.014
        + sin(s1.x * 40.0 + t * 6.0) * 0.07 * burst;

  // range: a spiral disc whose inner arms turn faster than the outer ones
  vec3 s2 = aP2;
  s2 = rotX(rotY(s2, t * 0.22 / (0.35 + length(s2.xz))), 0.95);

  // connect: a horizon, swell travelling across it, seen from just above
  vec3 s3 = aP3;
  s3.y = sin(s3.x * 1.5 + t * 0.7) * 0.16 + sin(s3.z * 3.2 + t * 1.1) * 0.06;
  s3 = rotX(s3, 0.38);

  // each particle leaves a little later than the one before it, so the cloud
  // pours from one shape into the next instead of cross-fading
  float lm = clamp(uMorph * 1.6 - aSeed * 0.6, 0.0, 1.0);
  lm = lm * lm * (3.0 - 2.0 * lm);
  vec4 idx = vec4(0.0, 1.0, 2.0, 3.0);
  vec4 w = (1.0 - lm) * (1.0 - step(0.5, abs(idx - uSeg)))
         + lm * (1.0 - step(0.5, abs(idx - uSeg - 1.0)));
  vec3 p = s0 * w.x + s1 * w.y + s2 * w.z + s3 * w.w;

  // in flight, particles swing out on their own arcs
  float flight = sin(lm * 3.14159);
  p += vec3(sin(aSeed * 91.0 + t), cos(aSeed * 57.0 + t * 0.8), sin(aSeed * 23.0 + t * 0.5)) * 0.42 * flight;

  // the pointer parts the field
  vec2 d = p.xy - uMouse.xy;
  float dist = length(d);
  p.xy += (d / max(dist, 1e-3)) * smoothstep(0.42, 0.0, dist) * 0.22 * uMouse.z;

  // fast scrolling smears the cloud vertically
  p.y += uVel * (aSeed - 0.5) * 0.4;

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = uSize * (0.45 + aSeed * aSeed * 1.4) * (${CAM_DIST.toFixed(1)} / -mv.z);
  vSeed = aSeed;
  vDepth = clamp(p.z * 0.5 + 0.5, 0.0, 1.0);
  vAlpha = 0.9 + 0.3 * flight;
}
`;

const FRAG = /* glsl */ `
uniform vec4 uRect;
uniform float uFeather;
uniform vec3 uHot;
uniform vec3 uCore;
uniform vec3 uCool;
varying float vSeed;
varying float vDepth;
varying float vAlpha;

void main() {
  float r = length(gl_PointCoord - 0.5);
  float a = pow(smoothstep(0.5, 0.0, r), 1.7);

  // the window has no border: the field simply falls away towards its edges,
  // and is exactly zero outside it, so it can never sit under the type
  float edge = min(min(gl_FragCoord.x - uRect.x, uRect.z - gl_FragCoord.x),
                   min(gl_FragCoord.y - uRect.y, uRect.w - gl_FragCoord.y));
  a *= smoothstep(0.0, uFeather, edge);

  vec3 col = mix(uCool, uCore, smoothstep(0.1, 0.7, vDepth));
  col = mix(col, uHot, smoothstep(0.72, 1.0, vSeed));
  gl_FragColor = vec4(col, a * vAlpha);
}
`;

/**
 * One particle cloud in four formations. The rig decides where the window is
 * and which two formations the scroll sits between; this only draws.
 */
export default function Field({ liteMode, reducedMotion }) {
  const { size, viewport } = useThree();
  const count = liteMode ? 6000 : 18000;
  const points = useRef(null);

  const { geometry, material } = useMemo(() => {
    const { sets, seed } = buildFormations(count);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(sets[0], 3));
    sets.forEach((s, k) => g.setAttribute(`aP${k}`, new THREE.BufferAttribute(s, 3)));
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
    // the formations move in the shader, so the cpu-side bounds are meaningless
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e4);

    const m = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uSeg: { value: 0 },
        uMorph: { value: 0 },
        uVel: { value: 0 },
        uSize: { value: 3 },
        uMouse: { value: new THREE.Vector3(9, 9, 0) },
        uRect: { value: new THREE.Vector4() },
        uFeather: { value: 60 },
        uHot: { value: new THREE.Color('#fff1f3') },
        uCore: { value: new THREE.Color('#ff4d6d') },
        uCool: { value: new THREE.Color('#6b4dff') },
      },
    });
    return { geometry: g, material: m };
  }, [count]);

  useFrame((state, dt) => {
    const f = bus.field;
    const u = material.uniforms;
    if (!reducedMotion) u.uTime.value += Math.min(dt, 1 / 30);
    u.uSeg.value = f.seg;
    u.uMorph.value = f.morph;
    u.uVel.value = bus.velN;

    const dpr = viewport.dpr;
    u.uRect.value.set(f.rect[0] * dpr, f.rect[1] * dpr, f.rect[2] * dpr, f.rect[3] * dpr);
    u.uFeather.value = Math.min(70, (f.rect[3] - f.rect[1]) * 0.18) * dpr;
    // points are sized in device pixels; a small window gets finer grain
    u.uSize.value = (liteMode ? 3.4 : 3.6) * dpr * Math.min(Math.max(f.scale / 2.2, 0.75), 1.25);

    // pointer into the formation's own space, on the z = 0 plane
    const cam = state.camera;
    const halfH = Math.tan((cam.fov * Math.PI) / 360) * CAM_DIST;
    const wx = bus.mouse.x * halfH * (size.width / size.height);
    const wy = bus.mouse.y * halfH;
    const on = bus.mouseActive && !liteMode && !reducedMotion ? 1 : 0;
    u.uMouse.value.set((wx - f.x) / f.scale, (wy - f.y) / f.scale, lerp(u.uMouse.value.z, on, Math.min(dt * 6, 1)));

    const g = points.current;
    g.position.set(f.x, f.y, 0);
    g.scale.setScalar(f.scale);
  });

  return <points ref={points} geometry={geometry} material={material} frustumCulled={false} />;
}

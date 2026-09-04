import * as THREE from 'three';
import { EMPTY_MAP } from './deskDrawings';

// Two-tone posterised palette. The look is a shading model, not an
// illustration: light faces go to paper, everything the light misses drops
// straight to a saturated blue. Bands, never a gradient.
// Warm paper against saturated blue. The picture is deliberately warmer than
// the page it sits on, which is what makes the frame read as a window into
// somewhere else rather than as a hole in the layout.
export const PAL = {
  light: new THREE.Color('#efe9db'),
  // warm grey, not blue-grey: the half-lit band is most of the desk, and a
  // cool mid dragged the whole surface toward grey
  mid:   new THREE.Color('#cdc6b6'),
  shade: new THREE.Color('#2440c9'),
  deep:  new THREE.Color('#16278a'),
  ink:   new THREE.Color('#0b1230'),
};

// Raking, from a window behind and to the left. Overhead puts every upward
// face in the same band and kills the two-tone; pointing it back over the
// desk is what drops fronts and the wall to blue while tops stay paper.
export const LIGHT_DIR = new THREE.Vector3(-0.60, 0.62, -0.50).normalize();

const vertex = /* glsl */`
#include <common>
#include <shadowmap_pars_vertex>
varying vec3 vN;
varying vec2 vUv;
void main() {
  vUv = uv;
  // shadowmap_vertex reads transformedNormal, so the normal chunks have to run
  #include <beginnormal_vertex>
  #include <defaultnormal_vertex>
  vN = normalize(mat3(modelMatrix) * objectNormal);
  #include <begin_vertex>
  #include <project_vertex>
  #include <worldpos_vertex>
  #include <shadowmap_vertex>
}
`;

// getShadowMask() is what draws the hard blue shadow polygons across the
// desk. Banding the mask as well as the diffuse term keeps the shadow edge
// crisp instead of feathering it.
const fragment = /* glsl */`
#include <common>
#include <packing>
#include <lights_pars_begin>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
uniform vec3 uLight;
uniform vec3 uMid;
uniform vec3 uShade;
uniform vec3 uDeep;
uniform vec3 uDir;
uniform float uTint;
uniform sampler2D uMap;
uniform sampler2D uMap2;
uniform float uHasMap;
uniform float uMix;
varying vec3 vN;
varying vec2 vUv;
void main() {
  float ndl = dot(normalize(vN), normalize(uDir));
  float s = clamp(ndl * 0.5 + 0.5, 0.0, 1.0);
  s *= mix(0.44, 1.0, getShadowMask());
  // uTint is albedo, not a wash: paper is white, the laptop is dark, and both
  // drop to blue in shadow. Mixing toward light after the band flattened
  // everything to milk.
  vec3 col;
  if (s > 0.68) col = mix(uMid, uLight, uTint);
  else if (s > 0.52) col = mix(uShade, uMid, uTint);
  else if (s > 0.32) col = mix(uDeep, uShade, uTint);
  else col = uDeep;
  // the drawing sits on the sheet as ink, so it darkens with the paper
  // instead of floating at a fixed brightness over it
  float ink = mix(texture2D(uMap, vUv).a, texture2D(uMap2, vUv).a, uMix) * uHasMap;
  col = mix(col, mix(col, uDeep, 0.92), ink);
  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}
`;

/** `tint` is the piece's albedo: 0 is a dark object, 1 is white paper. */
export function makeToon(tint = 0) {
  return new THREE.ShaderMaterial({
    vertexShader: vertex,
    fragmentShader: fragment,
    lights: true,
    uniforms: {
      ...THREE.UniformsUtils.clone(THREE.UniformsLib.lights),
      uLight: { value: PAL.light },
      uMid: { value: PAL.mid },
      uShade: { value: PAL.shade },
      uDeep: { value: PAL.deep },
      uDir: { value: LIGHT_DIR.clone() },
      uTint: { value: tint },
      uMap: { value: EMPTY_MAP },
      uMap2: { value: EMPTY_MAP },
      uHasMap: { value: 0 },
      uMix: { value: 0 },
    },
  });
}

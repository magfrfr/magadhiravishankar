// One sphere, four lives. The fragment shader draws each identity
// procedurally and crossfades between the two adjacent ones.
// Identity codes match chapterMath.ID: 0 moon, 1 spotlight, 2 tennis ball, 3 wireframe globe.

export const orbVertex = /* glsl */ `
uniform vec3 uPokeDir;   // object-space direction toward the cursor
uniform float uPokeAmt;  // 0..1 cursor proximity — surface swells toward it
varying vec3 vN;
varying vec3 vP;
varying vec3 vView;
varying float vPoke;
void main() {
  vN = normalize(normalMatrix * normal);
  vP = position;
  float pk = pow(max(dot(normalize(position), uPokeDir), 0.0), 3.0) * uPokeAmt;
  vPoke = pk;
  vec3 pos = position + normal * pk * 0.16;
  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  vView = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}
`;

export const orbFragment = /* glsl */ `
uniform float uTime;
uniform float uIdA;
uniform float uIdB;
uniform float uBlend;
uniform vec3 uRim;

varying vec3 vN;
varying vec3 vP;
varying vec3 vView;
varying float vPoke;

float hash(vec3 p) {
  return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453);
}

float noise(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float n000 = hash(i);
  float n100 = hash(i + vec3(1.0, 0.0, 0.0));
  float n010 = hash(i + vec3(0.0, 1.0, 0.0));
  float n110 = hash(i + vec3(1.0, 1.0, 0.0));
  float n001 = hash(i + vec3(0.0, 0.0, 1.0));
  float n101 = hash(i + vec3(1.0, 0.0, 1.0));
  float n011 = hash(i + vec3(0.0, 1.0, 1.0));
  float n111 = hash(i + vec3(1.0, 1.0, 1.0));
  return mix(
    mix(mix(n000, n100, f.x), mix(n010, n110, f.x), f.y),
    mix(mix(n001, n101, f.x), mix(n011, n111, f.x), f.y),
    f.z
  );
}

float fbm(vec3 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 3; i++) {
    v += a * noise(p);
    p *= 2.1;
    a *= 0.5;
  }
  return v;
}

// id 0: liquid iridescent glass — deep tinted body, glow pooling where the
// sphere is thickest, currents drifting inside. The premium layers (reflection,
// iridescence, specular) land on top of this in main() via moonW.
vec3 moonCol(vec3 p, vec3 n, vec3 v) {
  float depth = fbm(p * 1.8 + vec3(0.0, uTime * 0.06, 0.0));
  vec3 body = mix(vec3(0.05, 0.06, 0.14), vec3(0.16, 0.15, 0.34), depth);
  float thick = max(dot(n, v), 0.0);
  body += vec3(0.32, 0.28, 0.60) * pow(thick, 2.2) * (0.5 + 0.5 * depth);
  return body;
}

// procedural studio the surface pretends to reflect: graded sky, a horizon
// band and two softbox hot spots — the look of a cube-map with none of the cost.
// Lit for the pale build: a bright room with a warm bounce off the floor, so
// the dark glass body reads as glass rather than as a hole in the page.
vec3 envCol(vec3 r) {
  float up = r.y * 0.5 + 0.5;
  vec3 sky = mix(vec3(0.58, 0.62, 0.78), vec3(0.94, 0.96, 1.0), pow(up, 1.3));
  sky += vec3(0.38, 0.26, 0.16) * exp(-abs(r.y) * 5.0) * 0.7;
  float s1 = pow(max(dot(r, normalize(vec3(-0.6, 0.75, 0.3))), 0.0), 22.0);
  float s2 = pow(max(dot(r, normalize(vec3(0.7, 0.35, -0.4))), 0.0), 34.0);
  sky += vec3(1.0, 0.97, 0.92) * s1 * 1.6 + vec3(0.75, 0.80, 1.0) * s2 * 1.1;
  return sky;
}

vec3 spotCol(vec3 n, vec3 v) {
  float face = pow(max(dot(n, v), 0.0), 1.4);
  vec3 col = mix(vec3(0.95, 0.62, 0.44), vec3(1.0, 0.98, 0.90), face);
  return col * (0.7 + 1.1 * face);
}

vec3 ballCol(vec3 p) {
  vec3 sp = normalize(p);
  float fuzz = noise(p * 22.0) * 0.10;
  vec3 base = vec3(0.72 + fuzz, 0.88 + fuzz, 0.25);
  float th = atan(sp.z, sp.x);
  float seam = abs(sp.y - 0.55 * sin(2.0 * th));
  float s = 1.0 - smoothstep(0.035, 0.085, seam);
  return mix(base, vec3(0.97, 0.98, 0.94), s);
}

// wireframe blueprint globe: thin glowing lat/long lines on a dark body
vec3 gridCol(vec3 p) {
  vec3 sp = normalize(p);
  float lon = atan(sp.z, sp.x) / 6.2831853 + 0.5;
  float lat = asin(clamp(sp.y, -1.0, 1.0)) / 3.1415927 + 0.5;
  float gm = abs(fract(lon * 10.0) - 0.5) * 2.0;
  float gp = abs(fract(lat * 6.0) - 0.5) * 2.0;
  float mer = smoothstep(0.88, 0.985, gm) * (1.0 - pow(abs(sp.y), 6.0));
  float par = smoothstep(0.86, 0.98, gp);
  float lines = clamp(mer + par, 0.0, 1.0);
  vec3 body = vec3(0.05, 0.065, 0.135);
  // brighter than the dark build allowed: bloom no longer catches these lines
  // at its raised threshold, so they have to carry themselves
  return body + vec3(0.42, 0.88, 0.84) * lines * 0.8;
}

vec3 colorFor(float id, vec3 p, vec3 n, vec3 v) {
  if (id < 0.5) return moonCol(p, n, v);
  if (id < 1.5) return spotCol(n, v);
  if (id < 2.5) return ballCol(p);
  return gridCol(p);
}

void main() {
  vec3 n0 = normalize(vN);
  vec3 v = normalize(vView);

  // how much of the glass identity (id 0) is on screen this frame:
  // 1 at hero/connect, 0 on globe/ball — the hybrid dial for every layer below
  float moonW = (uIdA < 0.5 ? (1.0 - uBlend) : 0.0) + (uIdB < 0.5 ? uBlend : 0.0);

  // liquid surface: ripple the normal for the glass orb only, others stay crisp
  vec3 n = n0;
  if (moonW > 0.001) {
    float e = 0.35;
    vec3 pp = vP * 2.2 + vec3(0.0, uTime * 0.12, 0.0);
    vec3 grad = vec3(
      fbm(pp + vec3(e, 0.0, 0.0)) - fbm(pp - vec3(e, 0.0, 0.0)),
      fbm(pp + vec3(0.0, e, 0.0)) - fbm(pp - vec3(0.0, e, 0.0)),
      fbm(pp + vec3(0.0, 0.0, e)) - fbm(pp - vec3(0.0, 0.0, e))
    );
    n = normalize(n0 + grad * (0.22 * moonW));
  }

  vec3 a = colorFor(uIdA, vP, n, v);
  vec3 b = colorFor(uIdB, vP, n, v);
  vec3 col = mix(a, b, uBlend);

  float fresnel = pow(1.0 - max(dot(n, v), 0.0), 2.4);

  // faked studio reflection. Less grazing-biased than the dark build: a bright
  // rim against bright paper eats the silhouette, so the reflection is spread
  // across the body instead of piled onto the edge.
  vec3 R = reflect(-v, n);
  col += envCol(R) * mix(0.14, 0.60, moonW) * (0.55 + 0.25 * fresnel);

  // thin-film iridescence: rainbow interference sliding with the view angle
  vec3 irid = 0.5 + 0.5 * cos(6.2831853 * (vec3(0.0, 0.33, 0.67) + fresnel * 3.0 + uTime * 0.05));
  col += irid * fresnel * mix(0.08, 0.32, moonW);

  // wet-glass key light — the hotspot bloom finally has something to catch
  vec3 L = normalize(vec3(-0.45, 0.7, 0.55));
  float spec = pow(max(dot(n, normalize(L + v)), 0.0), mix(80.0, 110.0, moonW));
  col += vec3(1.0, 0.98, 0.95) * spec * mix(0.25, 1.6, moonW);

  // restrained rim on the pale build: a bright edge against bright paper just
  // dissolves the silhouette, which is the one thing the object needs
  col += uRim * fresnel * 0.18;
  col += uRim * vPoke * 0.3; // the poked patch glows toward the cursor

  // night-side shading so the sphere reads as a body, not a flat disc
  float shade = 0.72 + 0.28 * max(dot(n, normalize(vec3(-0.4, 0.5, 1.0))), 0.0);
  gl_FragColor = vec4(col * shade, 1.0);
}
`;

export const glowVertex = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const glowFragment = /* glsl */ `
uniform vec3 uColor;
uniform float uIntensity;
varying vec2 vUv;
void main() {
  float d = length(vUv - 0.5) * 2.0;
  float a = exp(-d * 3.8) * smoothstep(1.0, 0.55, d) * uIntensity;
  gl_FragColor = vec4(uColor, a);
}
`;

export const coneVertex = /* glsl */ `
varying vec2 vUv;
varying vec3 vN;
varying vec3 vView;
void main() {
  vUv = uv;
  vN = normalize(normalMatrix * normal);
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vView = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}
`;

export const coneFragment = /* glsl */ `
uniform float uOpacity;
varying vec2 vUv;
varying vec3 vN;
varying vec3 vView;
void main() {
  float body = pow(vUv.y, 1.8);                       // bright at the lamp, fades to the floor
  float edge = pow(abs(dot(normalize(vN), normalize(vView))), 1.4);
  float a = body * (0.25 + 0.75 * edge) * uOpacity;
  gl_FragColor = vec4(1.0, 0.88, 0.72, a);
}
`;

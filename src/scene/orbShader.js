// One sphere, four lives. The fragment shader draws each identity
// procedurally and crossfades between the two adjacent ones.
// Identity codes match chapterMath.ID: 0 moon, 1 spotlight, 2 tennis ball, 3 wireframe globe.

export const orbVertex = /* glsl */ `
varying vec3 vN;
varying vec3 vP;
varying vec3 vView;
void main() {
  vN = normalize(normalMatrix * normal);
  vP = position;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
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

vec3 moonCol(vec3 p) {
  float n = fbm(p * 2.4);
  float maria = smoothstep(0.5, 0.72, fbm(p * 1.6 + 5.2));
  float craters = smoothstep(0.62, 0.78, fbm(p * 5.0 + 11.0));
  vec3 base = mix(vec3(0.88, 0.86, 0.95), vec3(0.62, 0.60, 0.74), n);
  base = mix(base, vec3(0.46, 0.45, 0.60), maria * 0.55);
  base = mix(base, vec3(0.38, 0.37, 0.52), craters * 0.5);
  return base;
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
  vec3 body = vec3(0.055, 0.075, 0.155);
  return body + vec3(0.50, 0.91, 0.87) * lines * 1.15;
}

vec3 colorFor(float id, vec3 p, vec3 n, vec3 v) {
  if (id < 0.5) return moonCol(p);
  if (id < 1.5) return spotCol(n, v);
  if (id < 2.5) return ballCol(p);
  return gridCol(p);
}

void main() {
  vec3 n = normalize(vN);
  vec3 v = normalize(vView);
  vec3 a = colorFor(uIdA, vP, n, v);
  vec3 b = colorFor(uIdB, vP, n, v);
  vec3 col = mix(a, b, uBlend);

  float fresnel = pow(1.0 - max(dot(n, v), 0.0), 2.4);
  col += uRim * fresnel * 0.85;

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

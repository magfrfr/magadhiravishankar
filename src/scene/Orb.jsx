import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { bus, readChapterCoord } from './scrollBus';
import { orbStateAt, ID, RIM_OF, lerp, smoothstep } from './chapterMath';
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
          uPokeDir: { value: new THREE.Vector3(0, 0, 1) },
          uPokeAmt: { value: 0 },
        },
      }),
    []
  );

  // scratch vectors for the cursor-poke math (no per-frame allocation)
  const poke = useMemo(
    () => ({
      ndc: new THREE.Vector3(),
      ray: new THREE.Vector3(),
      hit: new THREE.Vector3(),
      dir: new THREE.Vector3(),
      q: new THREE.Quaternion(),
      amt: 0,
    }),
    []
  );

  // spring state for the cursor gravitation (offset from the path position)
  const grav = useMemo(
    () => ({
      off: new THREE.Vector3(),
      vel: new THREE.Vector3(),
      tgt: new THREE.Vector3(),
      d: new THREE.Vector3(),
    }),
    []
  );

  // On the pale build this plane is a contact shadow, not a halo: additive
  // light over light paper only washes to milk. It paints a soft cool aura
  // behind the sphere, so the object reads as sitting in a lit room.
  const glowMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: glowVertex,
        fragmentShader: glowFragment,
        uniforms: {
          uColor: { value: new THREE.Color('#6d7ba3') },
          uIntensity: { value: 0.55 },
        },
        transparent: true,
        depthWrite: false,
      }),
    []
  );

  // Runs before every environment (priority -1): computes the frame's truth
  // (chapter coord + orb state) and publishes it on the bus.
  useFrame((state, dt) => {
    bus.sceneReady = true; // the loader waits for a real rendered frame
    const t = performance.now() / 1000;
    bus.u = lerp(bus.u, readChapterCoord(), Math.min(dt * 5, 1)); // eased, no snap
    const s = orbStateAt(bus.u);

    // anchors are designed for a ~16:9 frustum (half-width 4.4); on narrow
    // screens the orb shrinks, hugs the frame edge instead of sliding under the
    // text, and rides higher where there is no free column at all
    const halfW = state.viewport.width / 2;
    const xf = Math.min(1, halfW / 4.4);
    const sizeF = 0.34 + 0.66 * xf;
    const r = s.scale * sizeF;
    const edge = Math.max(halfW - r * 1.15, 0);

    // Between the work chapter and the heap the path sweeps straight across the
    // frame, over the experience panels. Two corrections, because the rule that
    // nothing from the scene sits behind body copy has to hold mid-flight and
    // not only at the chapter centres:
    // 1. lift the path while it crosses
    // 2. pen the orb into the left margin for as long as the panels are on
    //    screen — they own the right of the frame for that whole stretch, not
    //    just at the chapter's centre line
    const cross = Math.min(Math.max(bus.u - 1, 0), 1);
    const lift = 0.95 * Math.sin(Math.PI * cross);
    const penned = smoothstep(0.72, 1.0, bus.u) * (1 - smoothstep(1.62, 1.98, bus.u));

    let x = Math.sign(s.pos.x) * Math.min(Math.abs(s.pos.x), edge);
    if (penned > 0) x = lerp(x, Math.min(x, -Math.min(2.5, edge)), penned);

    const m = mesh.current;
    // narrow screens have no free column, so the orb rides high in the frame
    // where only the display type is — the copy below it stays clear
    m.position.set(x, s.pos.y + lift + (1 - xf) * 1.9, s.pos.z);
    m.scale.setScalar(r);

    // scroll speed squashes the orb a touch, like it has mass
    if (!reducedMotion && bus.velN) {
      m.scale.y *= 1 - Math.abs(bus.velN) * 0.13;
      m.position.y -= bus.velN * 0.16;
    }

    // spin: barely for the moon, lively for the ball
    if (!reducedMotion) {
      m.rotation.y = t * 0.05;
      m.rotation.z -= dt * 4.5 * s.w[ID.BALL];
    }

    // cursor: the orb leans toward the pointer and its surface swells there.
    // Both targets come off the path position, so the lean can't chase itself.
    const fdt = Math.min(dt, 1 / 30); // a tab-switch spike must not launch the spring
    let pokeTarget = 0;
    grav.tgt.set(0, 0, 0);
    if (!reducedMotion && bus.mouseActive) {
      const cam = state.camera;
      poke.ndc.set(bus.mouse.x, bus.mouse.y, 0.5).unproject(cam);
      poke.ray.copy(poke.ndc).sub(cam.position).normalize();
      const tp = (m.position.z - cam.position.z) / poke.ray.z;
      poke.hit.copy(cam.position).addScaledVector(poke.ray, tp);
      poke.dir.copy(poke.hit).sub(m.position);
      const dist = poke.dir.length();
      pokeTarget = 1 - Math.min(Math.max((dist - r * 0.5) / (r * 1.9), 0), 1);
      if (dist > 1e-4) {
        poke.dir.normalize();
        // pull dies off past ~3 radii, squared so the far field is nearly still
        const reach = 1 - Math.min(Math.max((dist - r) / (r * 3.2), 0), 1);
        grav.tgt.copy(poke.dir).multiplyScalar(Math.min(dist * 0.5, r * 0.5) * reach * reach);
        poke.q.copy(m.quaternion).invert();
        poke.dir.applyQuaternion(poke.q);
        orbMat.uniforms.uPokeDir.value.copy(poke.dir);
      }
    }

    // heavy going out, tight coming back: it gathers slowly toward the cursor
    // and releases the moment the cursor leaves its field
    const pulled = grav.tgt.lengthSq() > 1e-6;
    grav.d.copy(grav.tgt).sub(grav.off);
    grav.vel.addScaledVector(grav.d, (pulled ? 24 : 105) * fdt);
    grav.vel.multiplyScalar(Math.exp(-(pulled ? 7 : 17) * fdt));
    grav.off.addScaledVector(grav.vel, fdt);
    m.position.add(grav.off);

    poke.amt += (pokeTarget - poke.amt) * Math.min(fdt * (pokeTarget > poke.amt ? 4.5 : 13), 1);
    orbMat.uniforms.uPokeAmt.value = poke.amt;

    orbMat.uniforms.uTime.value = t;
    orbMat.uniforms.uIdA.value = s.idA;
    orbMat.uniforms.uIdB.value = s.idB;
    orbMat.uniforms.uBlend.value = s.blend;
    rim.copy(RIM_OF[s.idA]).lerp(RIM_OF[s.idB], s.blend);
    orbMat.uniforms.uRim.value.copy(rim);

    // the shadow sits behind the sphere and a touch below it, so depth testing
    // clips it to a soft skirt around the silhouette instead of tinting the body
    const g = glow.current;
    g.position.set(m.position.x, m.position.y - r * 0.18, m.position.z - r - 0.05);
    g.scale.setScalar(r * 2.6);
    glowMat.uniforms.uIntensity.value =
      0.3 + 0.08 * s.w[ID.MOON] + 0.12 * s.w[ID.BALL] - 0.06 * s.w[ID.GRID];

    bus.orb.x = m.position.x;
    bus.orb.y = m.position.y;
    bus.orb.z = m.position.z;
    bus.orb.scale = r;
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

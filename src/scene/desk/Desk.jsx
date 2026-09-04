import { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { bus } from '../scrollBus';
import { PIECES } from './deskPieces';
import { makeToon, PAL, LIGHT_DIR } from './deskMaterial';
import { drawingTexture, stageTextures, STAGE_COUNT } from './deskDrawings';

function geometryFor(piece) {
  if (piece.k === 'cyl') return new THREE.CylinderGeometry(...piece.a);
  if (piece.k === 'cone') return new THREE.ConeGeometry(...piece.a);
  return new THREE.BoxGeometry(...piece.a);
}

// The ink lines are real edge geometry rather than a post pass: every piece is
// a primitive, so EdgesGeometry lands a line exactly where the drawing would.
export default function Desk() {
  // one memo returns both the scene graph and a handle on the developing
  // sheet's material — a ref written during render trips react-hooks/refs
  const { group, dev } = useMemo(() => {
    const g = new THREE.Group();
    let devHandle = null;
    const mats = new Map();
    const edgeMat = new THREE.LineBasicMaterial({ color: PAL.ink, transparent: true, opacity: 0.55 });

    for (const [i, piece] of PIECES.entries()) {
      const geo = geometryFor(piece);
      const tint = piece.t ?? 0;
      let mat;
      if (piece.dev) {
        mat = makeToon(tint);
        mat.uniforms.uHasMap.value = 1;
        devHandle = { mat, stages: stageTextures(piece.d, i * 9973 + 17) };
      } else if (piece.d) {
        mat = makeToon(tint);
        mat.uniforms.uMap.value = drawingTexture(piece.d, i * 9973 + 17);
        mat.uniforms.uHasMap.value = 1;
      } else {
        if (!mats.has(tint)) mats.set(tint, makeToon(tint));
        mat = mats.get(tint);
      }

      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(...piece.p);
      if (piece.r) mesh.rotation.set(...piece.r);
      mesh.castShadow = piece.s !== false;
      mesh.receiveShadow = true;
      g.add(mesh);

      if (piece.e !== false) {
        const lines = new THREE.LineSegments(new THREE.EdgesGeometry(geo, 25), edgeMat);
        lines.position.copy(mesh.position);
        lines.rotation.copy(mesh.rotation);
        g.add(lines);
      }
    }
    return { group: g, dev: devHandle };
  }, []);

  // The one sheet the camera pushes onto is not a fixed image: it steps
  // through the passes of its own drawing as the page scrolls, so the scroll
  // is making something rather than just moving past it. It starts part-drawn
  // so the establishing shot is not a blank sheet.
  useFrame(() => {
    if (!dev) return;
    const t = Math.min(Math.max(bus.u / 2.2, 0), 1);
    const s = (0.25 + 0.75 * t) * (STAGE_COUNT - 1);
    const i = Math.min(Math.floor(s), STAGE_COUNT - 2);
    dev.mat.uniforms.uMap.value = dev.stages[i];
    dev.mat.uniforms.uMap2.value = dev.stages[i + 1];
    dev.mat.uniforms.uMix.value = s - i;
  });

  return (
    <>
      {/* the only light that matters is the one casting shadows — the shader
          does its own shading off a fixed direction */}
      <directionalLight
        position={LIGHT_DIR.clone().multiplyScalar(24).toArray()}
        intensity={1}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0012}
        shadow-camera-left={-16}
        shadow-camera-right={16}
        shadow-camera-top={14}
        shadow-camera-bottom={-14}
        shadow-camera-near={1}
        shadow-camera-far={48}
      />
      <primitive object={group} />
    </>
  );
}

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { bus } from '../scrollBus';
import { ID } from '../chapterMath';

const EEG_POINTS = 140;
const EEG_SPAN = 4.6;

// The builder chapter: the orb lands as an electrode on a wireframe scalp,
// and a live EEG trace unspools from it across the screen.
export default function Scalp() {
  const group = useRef();
  const eeg = useRef();
  const domeRef = useRef();

  const domeGeom = useMemo(() => {
    const curve = new THREE.EllipseCurve(0, 0, 1.55, 1.55, Math.PI * 0.08, Math.PI * 0.92);
    const pts = curve.getPoints(60).map(p => new THREE.Vector3(p.x, p.y, 0));
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, []);

  const lineMat = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: '#7fe9de',
        transparent: true,
        opacity: 0,
        depthWrite: false,
      }),
    []
  );
  const eegMat = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: '#7fe9de',
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    []
  );
  const dotMat = useMemo(
    () => new THREE.MeshBasicMaterial({ color: '#7fe9de', transparent: true, opacity: 0 }),
    []
  );

  // C3 / C4 sit on the dome either side of Cz (the orb itself)
  const dots = useMemo(() => {
    const a1 = Math.PI * 0.5 - 0.55;
    const a2 = Math.PI * 0.5 + 0.55;
    return [
      [Math.cos(a1) * 1.55, Math.sin(a1) * 1.55],
      [Math.cos(a2) * 1.55, Math.sin(a2) * 1.55],
    ];
  }, []);

  useFrame(() => {
    const w = bus.orb.w[ID.ELEC];
    const visible = w > 0.02;
    group.current.visible = visible;
    if (!visible) return;

    const t = performance.now() / 1000;
    // dome sits under the electrode: orb = Cz at the top of the head
    group.current.position.set(bus.orb.x, bus.orb.y - 1.55, bus.orb.z);
    lineMat.opacity = w * 0.55;
    dotMat.opacity = w * 0.9;

    // trace unspools leftward from the electrode; mu-rhythm bursts ride on it
    const arr = eeg.current.geometry.attributes.position.array;
    for (let i = 0; i < EEG_POINTS; i++) {
      const k = i / (EEG_POINTS - 1);
      const x = -0.25 - k * EEG_SPAN;
      const burst = 0.5 + 0.5 * Math.sin(k * 5.0 - t * 0.9);
      const y =
        (Math.sin(k * 46.0 - t * 7.0) * 0.5 * burst +
          Math.sin(k * 21.0 - t * 3.6) * 0.3 +
          Math.sin(k * 90.0 - t * 11.0) * 0.12) *
        0.22 *
        (1 - k * 0.55); // trace calms as it leaves the electrode
      arr[i * 3] = x;
      arr[i * 3 + 1] = 1.55 + y; // group-local: level with the electrode
      arr[i * 3 + 2] = 0;
    }
    eeg.current.geometry.attributes.position.needsUpdate = true;
    eegMat.opacity = w * 0.8;
  });

  return (
    <group ref={group}>
      <line ref={domeRef} geometry={domeGeom} material={lineMat} />
      {dots.map(([x, y], i) => (
        <mesh key={i} position={[x, y, 0]} material={dotMat}>
          <circleGeometry args={[0.06, 16]} />
        </mesh>
      ))}
      <line ref={eeg} material={eegMat}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[new Float32Array(EEG_POINTS * 3), 3]} />
        </bufferGeometry>
      </line>
    </group>
  );
}

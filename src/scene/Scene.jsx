import { useEffect, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { bus } from './scrollBus';
import Orb from './Orb';
import Stars from './environments/Stars';

// Gentle camera parallax toward the cursor; also decays the sea's ripple energy.
function Rig({ enabled }) {
  const { camera } = useThree();
  useFrame((_, dt) => {
    bus.mouseEnergy *= Math.pow(0.35, dt); // ~gone in a second of stillness
    if (!enabled) return;
    const k = Math.min(dt * 3, 1);
    camera.position.x += (bus.mouse.x * 0.22 - camera.position.x) * k;
    camera.position.y += (bus.mouse.y * 0.14 - camera.position.y) * k;
    camera.lookAt(0, 0, 0);
  });
  return null;
}

export default function Scene({ liteMode, reducedMotion }) {
  const wrap = useRef(null);

  useEffect(() => {
    if (liteMode) return undefined;
    const move = (e) => {
      bus.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      bus.mouse.y = -((e.clientY / window.innerHeight) * 2 - 1);
      bus.mouseEnergy = Math.min(bus.mouseEnergy + 0.06, 1);
    };
    window.addEventListener('pointermove', move, { passive: true });
    return () => window.removeEventListener('pointermove', move);
  }, [liteMode]);

  return (
    <div ref={wrap} className="scene-canvas" aria-hidden="true">
      <Canvas
        camera={{ position: [0, 0, 8], fov: 38 }}
        dpr={liteMode ? 1 : [1, 1.75]}
        gl={{ antialias: !liteMode, alpha: true, powerPreference: 'high-performance' }}
      >
        <Rig enabled={!liteMode && !reducedMotion} />
        <Stars liteMode={liteMode} />
        <Orb reducedMotion={reducedMotion} />
      </Canvas>
    </div>
  );
}

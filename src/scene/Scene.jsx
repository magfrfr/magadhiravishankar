import { useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { bus } from './scrollBus';
import Field from './field/Field';
import FieldRig from './field/FieldRig';

export default function Scene({ liteMode, reducedMotion, wide }) {
  const wrap = useRef(null);

  useEffect(() => {
    if (liteMode) return undefined;
    const move = (e) => {
      bus.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      bus.mouse.y = -((e.clientY / window.innerHeight) * 2 - 1);
      bus.mouseActive = true;
      bus.mouseEnergy = Math.min(bus.mouseEnergy + 0.06, 1);
    };
    const leave = (e) => { if (!e.relatedTarget) bus.mouseActive = false; };
    const blur = () => { bus.mouseActive = false; };
    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('pointerout', leave, { passive: true });
    window.addEventListener('blur', blur);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerout', leave);
      window.removeEventListener('blur', blur);
    };
  }, [liteMode]);

  return (
    <div ref={wrap} className="scene-canvas" aria-hidden="true">
      <Canvas
        camera={{ position: [0, 0, 10], fov: 35 }}
        dpr={liteMode ? 1 : [1, 1.75]}
        gl={{ antialias: !liteMode, alpha: true, powerPreference: 'high-performance' }}
      >
        <FieldRig liteMode={liteMode} reducedMotion={reducedMotion} wide={wide} />
        <Field liteMode={liteMode} reducedMotion={reducedMotion} />
      </Canvas>
    </div>
  );
}

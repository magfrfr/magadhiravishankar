// The site's water: one ferrofluid layer (her chosen params) that sits as a
// wave band at the bottom during hero/beach/connect and rises to fill the
// screen behind the jack-of-all-trades chapter. Envelopes come from bus.u.
import { useEffect, useRef } from 'react';
import Ferrofluid from './Ferrofluid';
import { bus, seaWeight, riseWeight, lerp } from '../scene/scrollBus';

const COLORS = ['#2b2eba', '#6366F1', '#6366F1'];

export default function FluidSea({ liteMode }) {
  const wrapRef = useRef(null);
  const runningRef = useRef(true);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return undefined;
    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const seaW = seaWeight(bus.u);
      const riseW = riseWeight(bus.u);
      const on = Math.max(seaW, riseW);
      runningRef.current = on > 0.01;
      if (!runningRef.current) {
        el.style.opacity = '0';
        return;
      }
      el.style.opacity = String(Math.max(seaW * 0.9, riseW * 0.8));
      // waves band: transparent sky → fluid low; the rise pulls the edge to the top
      const from = lerp(52, -30, riseW);
      const to = lerp(78, 0, riseW);
      const grad = `linear-gradient(to bottom, rgba(0,0,0,0) ${from}%, #000 ${to}%)`;
      el.style.maskImage = grad;
      el.style.webkitMaskImage = grad;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div ref={wrapRef} className="fluid-sea" aria-hidden="true">
      <Ferrofluid
        colors={COLORS}
        flowDirection="up"
        shimmer={2}
        speed={0.3}
        glow={1.3}
        turbulence={0.25}
        mouseRadius={0.3}
        mouseInteraction={!liteMode}
        dpr={liteMode ? 1 : undefined}
        runningRef={runningRef}
      />
    </div>
  );
}

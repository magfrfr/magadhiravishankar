// The site's water: one ferrofluid layer (her chosen params) that sits as a
// wave band at the bottom during hero/beach/connect and rises to fill the
// screen behind the jack-of-all-trades chapter. Envelopes come from bus.u.
import { useEffect, useRef } from 'react';
import Ferrofluid from './Ferrofluid';
import { bus, seaWeight, riseWeight, lerp } from '../scene/scrollBus';

// deepened for the pale build: her original indigos were tuned to glow against
// midnight, and at that lightness they composite over paper as grey smears
const COLORS = ['#1b1d8f', '#3538c9', '#4f46e5'];

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
      // the rise used to fill the frame behind this chapter; at full strength it
      // reads as smoke over the copy, which is the opposite of polished
      el.style.opacity = String(Math.max(seaW * 0.85, riseW * 0.18));
      // waves band: transparent sky → fluid low; the rise pulls the edge up, but
      // both edges stay under the type — the fluid is never behind the words
      // the band sits lower than it did on the dark build: deepened for paper,
      // the fluid is opaque enough to crowd the hero tagline at the old edge
      const from = lerp(74, 22, riseW);
      const to = lerp(92, 54, riseW);
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

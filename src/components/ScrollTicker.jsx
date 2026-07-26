// Marquee band that reads the scroll. It always drifts at a base speed; the
// smoothed scroll velocity on the bus is added on top, so it surges when you
// move fast and reverses when you scroll back up. Two identical runs sit side
// by side and the offset wraps on one run's width, so the loop has no seam.
import { useEffect, useRef } from 'react';
import { bus } from '../scene/scrollBus';
import { TICKER } from '../content';

const BASE = 42;   // px/s at rest
const PULL = 0.25; // how much of the scroll velocity the band picks up

export default function ScrollTicker({ reducedMotion }) {
  const trackRef = useRef(null);

  useEffect(() => {
    if (reducedMotion) return undefined;
    const track = trackRef.current;
    let raf = 0;
    let last = performance.now();
    let offset = 0;
    let width = track.scrollWidth / 2;

    const measure = () => { width = track.scrollWidth / 2; };
    window.addEventListener('resize', measure);

    const tick = (now) => {
      const dt = Math.min(Math.max((now - last) / 1000, 0), 0.05);
      last = now;
      if (width > 0) {
        offset -= (BASE + bus.vel * PULL) * dt;
        if (offset <= -width) offset += width;
        if (offset > 0) offset -= width;
        track.style.transform = `translate3d(${offset}px, 0, 0)`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', measure);
    };
  }, [reducedMotion]);

  return (
    <div className="ticker" aria-hidden="true">
      <div className="ticker-viewport">
        <div ref={trackRef} className="ticker-track">
          {[0, 1].map(run => (
            <div className="ticker-run" key={run}>
              {TICKER.map(line => (
                <span className="ticker-item" key={line}>{line}</span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

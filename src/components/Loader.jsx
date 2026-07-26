// Boot overlay: a mono counter "tunes in" while the 3D scene actually loads
// (bus.sceneReady), with a floor on speed so it never flashes by. First visit
// gets the full sequence; repeat visits (quick) just fade the curtain.
import { useEffect, useRef, useState } from 'react';
import { bus } from '../scene/scrollBus';
import { LOADER, META } from '../content';

const HOLD_AT = 88;        // % where the counter waits for the scene
const CRAWL = 55;          // %/s before the scene is ready
const SPRINT = 150;        // %/s once it is
const SCENE_TIMEOUT = 6000; // ms — if WebGL never reports in, finish anyway

const ARC_R = 46;
const ARC_C = 2 * Math.PI * ARC_R;

export default function Loader({ quick, onDone }) {
  const [phase, setPhase] = useState(quick ? 'done' : 'count');
  const pctRef = useRef(null);
  const arcRef = useRef(null);

  useEffect(() => {
    if (quick) {
      const t1 = setTimeout(() => setPhase('fade'), 90);
      const t2 = setTimeout(onDone, 780);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }

    const started = performance.now();
    let disp = 0;
    let last = started;
    let raf = 0;
    let t1 = 0;
    let t2 = 0;

    const tick = (now) => {
      // rAF timestamps can trail performance.now(); never let the counter run backwards
      const dt = Math.min(Math.max((now - last) / 1000, 0), 0.05);
      last = now;
      const ready = bus.sceneReady || performance.now() - started > SCENE_TIMEOUT;
      disp = Math.min(disp + (ready ? SPRINT : CRAWL) * dt, ready ? 100 : HOLD_AT);
      if (pctRef.current) {
        pctRef.current.textContent = String(Math.floor(disp)).padStart(3, '0');
      }
      if (arcRef.current) {
        arcRef.current.style.strokeDashoffset = String(ARC_C * (1 - disp / 100));
      }
      if (disp >= 100) {
        setPhase('done');
        t1 = setTimeout(() => setPhase('fade'), 450);
        t2 = setTimeout(onDone, 1150);
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [quick, onDone]);

  return (
    <div className={`loader${phase === 'fade' ? ' loader--fade' : ''}`} aria-hidden="true">
      {!quick && (
        <>
          <div className={`loader-dial${phase !== 'count' ? ' loader-dial--done' : ''}`}>
            <svg className="loader-arc" viewBox="0 0 100 100">
              <circle className="loader-arc-track" cx="50" cy="50" r={ARC_R} />
              <circle
                ref={arcRef}
                className="loader-arc-fill"
                cx="50"
                cy="50"
                r={ARC_R}
                style={{ strokeDasharray: ARC_C, strokeDashoffset: ARC_C }}
              />
            </svg>
            <span className="loader-sweep" />
            <span className="loader-pct">
              <span ref={pctRef}>000</span>
            </span>
          </div>
          <p className={`loader-line${phase !== 'count' ? ' loader-line--done' : ''}`}>
            {phase === 'count' ? LOADER.line : LOADER.done}
          </p>
          <p className="loader-est">{META.name} {META.est}</p>
        </>
      )}
    </div>
  );
}

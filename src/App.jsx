import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import Lenis from 'lenis';
import './App.css';
import { CHAPTERS } from './content';

// three.js is the heaviest thing we ship — let the story render first
const Scene = lazy(() => import('./scene/Scene'));
import Hero from './chapters/Hero';
import Chapter from './chapters/Chapter';
import Connect from './chapters/Connect';
import PetsLayer from './pets/PetsLayer';
import AnnotationRail from './components/AnnotationRail';
import FluidSea from './components/FluidSea';
import Magnetic from './components/Magnetic';
import { isSoundOn, setSound } from './audio/sfx';

const MIDDLE_CHAPTERS = CHAPTERS.slice(1, -1);

function useLiteMode() {
  const [lite, setLite] = useState(
    () => window.matchMedia('(pointer: coarse), (max-width: 768px)').matches
  );
  useEffect(() => {
    const mq = window.matchMedia('(pointer: coarse), (max-width: 768px)');
    const fn = (e) => setLite(e.matches);
    mq.addEventListener('change', fn);
    return () => mq.removeEventListener('change', fn);
  }, []);
  return lite;
}

export default function App() {
  const liteMode = useLiteMode();
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const [soundOn, setSoundOn] = useState(isSoundOn);
  const glowRef = useRef(null);

  // day/night tint: deeper night hours get a deeper wash
  const hour = new Date().getHours();
  const nightDepth = hour >= 22 || hour < 5 ? 0.35 : hour >= 18 ? 0.2 : 0.08;

  // inertia-smoothed scrolling — the page floats instead of jumping
  useEffect(() => {
    if (liteMode || reducedMotion) return undefined;
    const lenis = new Lenis({ autoRaf: true, lerp: 0.075 });
    return () => lenis.destroy();
  }, [liteMode, reducedMotion]);

  // cursor glow (fine pointers only)
  useEffect(() => {
    if (liteMode) return undefined;
    const el = glowRef.current;
    const move = (e) => {
      if (el) el.style.transform = `translate(${e.clientX - 90}px, ${e.clientY - 90}px)`;
    };
    window.addEventListener('pointermove', move, { passive: true });
    return () => window.removeEventListener('pointermove', move);
  }, [liteMode]);

  function toggleSound() {
    const next = !soundOn;
    setSound(next);
    setSoundOn(next);
  }

  return (
    <>
      <Suspense fallback={null}>
        <Scene liteMode={liteMode} reducedMotion={reducedMotion} />
      </Suspense>
      <FluidSea liteMode={liteMode} />
      <div className="grain" aria-hidden="true" />
      <div className="night-tint" style={{ opacity: nightDepth }} aria-hidden="true" />
      {!liteMode && <div ref={glowRef} className="cursor-glow" aria-hidden="true" />}

      {liteMode ? (
        <button
          className="sound-toggle"
          onClick={toggleSound}
          aria-pressed={soundOn}
          title={soundOn ? 'sound on' : 'sound off'}
        >
          {soundOn ? '♪ on' : '♪ off'}
        </button>
      ) : (
        <Magnetic className="sound-toggle-magnet">
          <button
            className="sound-toggle"
            onClick={toggleSound}
            aria-pressed={soundOn}
            title={soundOn ? 'sound on' : 'sound off'}
          >
            {soundOn ? '♪ on' : '♪ off'}
          </button>
        </Magnetic>
      )}

      {!liteMode && <AnnotationRail />}

      <main className={liteMode ? '' : 'rail-on'}>
        <Hero reducedMotion={reducedMotion} liteMode={liteMode} />
        {MIDDLE_CHAPTERS.map(c => (
          <Chapter key={c.id} data={c} reducedMotion={reducedMotion} liteMode={liteMode} />
        ))}
        <Connect reducedMotion={reducedMotion} liteMode={liteMode} />
      </main>

      <PetsLayer liteMode={liteMode} />
    </>
  );
}

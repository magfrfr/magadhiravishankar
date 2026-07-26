import { Fragment, lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import Lenis from 'lenis';
import './App.css';
import { CHAPTERS } from './content';
import { bus } from './scene/scrollBus';

// three.js is the heaviest thing we ship — let the story render first
const Scene = lazy(() => import('./scene/Scene'));
import Hero from './chapters/Hero';
import Chapter from './chapters/Chapter';
import Connect from './chapters/Connect';
import PetsLayer from './pets/PetsLayer';
import AnnotationRail from './components/AnnotationRail';
import FluidSea from './components/FluidSea';
import Magnetic from './components/Magnetic';
import Loader from './components/Loader';
import Cursor from './components/Cursor';
import ScrollTicker from './components/ScrollTicker';
import CDPlayer from './components/CDPlayer';
import { isSoundOn, setSound } from './audio/sfx';

const INTRO_KEY = 'mg-intro';

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

  // boot sequence: full counter on first visit, quick curtain fade after
  const [seenIntro] = useState(() => {
    try { return localStorage.getItem(INTRO_KEY) === '1'; } catch { return false; }
  });
  const [introDone, setIntroDone] = useState(reducedMotion);
  const onIntroDone = useCallback(() => {
    setIntroDone(true);
    try { localStorage.setItem(INTRO_KEY, '1'); } catch { /* private mode */ }
  }, []);

  // hold the page at the top while the loader is up
  useEffect(() => {
    if (introDone) return undefined;
    window.scrollTo(0, 0);
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [introDone]);

  // scroll velocity → bus.velN + CSS vars: titles skew, stars streak, orb squashes
  useEffect(() => {
    if (liteMode || reducedMotion) return undefined;
    const root = document.documentElement;
    let raf;
    let lastY = window.scrollY;
    let last = performance.now();
    const tick = (now) => {
      const dt = Math.max((now - last) / 1000, 1e-4);
      last = now;
      const y = window.scrollY;
      const v = (y - lastY) / dt;
      lastY = y;
      bus.vel += (v - bus.vel) * Math.min(dt * 8, 1);
      const n = Math.max(-1, Math.min(1, bus.vel / 2600));
      bus.velN = n;
      root.style.setProperty('--skew', `${(n * 5.2).toFixed(3)}deg`);
      root.style.setProperty('--stretch', (1 + Math.abs(n) * 0.09).toFixed(4));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      bus.vel = 0;
      bus.velN = 0;
      root.style.removeProperty('--skew');
      root.style.removeProperty('--stretch');
    };
  }, [liteMode, reducedMotion]);

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
      <div className="vignette" aria-hidden="true" />
      {!liteMode && <div ref={glowRef} className="cursor-glow" aria-hidden="true" />}
      {!liteMode && <Cursor />}
      {!introDone && <Loader quick={seenIntro} onDone={onIntroDone} />}

      {liteMode ? (
        <button
          className="sound-toggle glass"
          onClick={toggleSound}
          aria-pressed={soundOn}
          title={soundOn ? 'sound on' : 'sound off'}
        >
          {soundOn ? '♪ on' : '♪ off'}
        </button>
      ) : (
        <Magnetic className="sound-toggle-magnet">
          <button
            className="sound-toggle glass"
            onClick={toggleSound}
            aria-pressed={soundOn}
            title={soundOn ? 'sound on' : 'sound off'}
          >
            {soundOn ? '♪ on' : '♪ off'}
          </button>
        </Magnetic>
      )}

      <CDPlayer />

      {!liteMode && <AnnotationRail />}

      <main className={liteMode ? '' : 'rail-on'}>
        <Hero reducedMotion={reducedMotion} liteMode={liteMode} play={introDone} />
        {MIDDLE_CHAPTERS.map(c => (
          <Fragment key={c.id}>
            <Chapter data={c} reducedMotion={reducedMotion} liteMode={liteMode} />
            {c.id === 'builder' && <ScrollTicker reducedMotion={reducedMotion} />}
          </Fragment>
        ))}
        <Connect reducedMotion={reducedMotion} liteMode={liteMode} />
      </main>

      <PetsLayer liteMode={liteMode} />
    </>
  );
}

import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import Lenis from 'lenis';
import './App.css';
import { CHAPTERS, CONTACT } from './content';
import { bus } from './scene/scrollBus';

// three.js is the heaviest thing we ship — let the story render first
const Scene = lazy(() => import('./scene/Scene'));
import Hero from './chapters/Hero';
import Chapter from './chapters/Chapter';
import Connect from './chapters/Connect';
import PetsLayer from './pets/PetsLayer';
import AnnotationRail from './components/AnnotationRail';
import Magnetic from './components/Magnetic';
import Loader from './components/Loader';
import Cursor from './components/Cursor';

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

  // inertia-smoothed scrolling — the page floats instead of jumping
  useEffect(() => {
    if (liteMode || reducedMotion) return undefined;
    const lenis = new Lenis({ autoRaf: true, lerp: 0.075 });
    return () => lenis.destroy();
  }, [liteMode, reducedMotion]);

  return (
    <>
      <Suspense fallback={null}>
        <Scene liteMode={liteMode} reducedMotion={reducedMotion} />
      </Suspense>
      {/* the ferrofluid band was tuned to sit under an orb on paper; it fights
          the desk. Parked while the scene direction is being judged:
          <FluidSea liteMode={liteMode} /> */}
      <div className="scene-frame" aria-hidden="true" />
      <div className="grain" aria-hidden="true" />
      {!liteMode && <Cursor />}
      {!introDone && <Loader quick={seenIntro} onDone={onIntroDone} />}

      {/* the corner the sound toggle used to hold: on a portfolio it should
          carry the one thing a visitor might actually want */}
      {liteMode ? (
        <a className="corner-cta glass" href={CONTACT.href}>{CONTACT.label}</a>
      ) : (
        <Magnetic className="corner-cta-magnet">
          <a className="corner-cta glass" href={CONTACT.href}>{CONTACT.label}</a>
        </Magnetic>
      )}

      {!liteMode && <AnnotationRail />}

      <main className={liteMode ? '' : 'rail-on'}>
        <Hero reducedMotion={reducedMotion} liteMode={liteMode} play={introDone} />
        {MIDDLE_CHAPTERS.map(c => (
          <Chapter key={c.id} data={c} reducedMotion={reducedMotion} liteMode={liteMode} />
        ))}
        <Connect reducedMotion={reducedMotion} liteMode={liteMode} />
      </main>

      <PetsLayer liteMode={liteMode} />
    </>
  );
}

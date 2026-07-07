import { useEffect, useRef, useState } from 'react';
import { CHAPTERS } from '../content';
import { bus } from '../scene/scrollBus';

const GLYPHS = '·:／＼|_-<>#';

// The persistent mono annotation: one fixed line whose text rewrites itself
// as the chapters pass — the thread the eye never loses.
export default function AnnotationRail() {
  const [idx, setIdx] = useState(0);
  const [text, setText] = useState(CHAPTERS[0].eyebrow);
  const timer = useRef(null);

  // watch the scene's chapter coordinate; no scroll listener needed
  useEffect(() => {
    let raf;
    const tick = () => {
      const next = Math.min(Math.max(Math.round(bus.u), 0), CHAPTERS.length - 1);
      setIdx((i) => (i === next ? i : next));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // scramble-resolve into the new chapter's annotation
  useEffect(() => {
    const target = CHAPTERS[idx].eyebrow;
    let frame = 0;
    clearInterval(timer.current);
    timer.current = setInterval(() => {
      frame += 1;
      const reveal = Math.floor(frame * 1.6);
      let out = '';
      for (let i = 0; i < target.length; i++) {
        out += i < reveal || target[i] === ' '
          ? target[i]
          : GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
      }
      setText(out);
      if (reveal >= target.length) clearInterval(timer.current);
    }, 28);
    return () => clearInterval(timer.current);
  }, [idx]);

  return (
    <div className="annotation-rail" aria-hidden="true">
      <span className="rail-index">{String(idx).padStart(2, '0')}</span>
      <span className="rail-text">{text}</span>
    </div>
  );
}

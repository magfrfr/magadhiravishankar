// Custom cursor: a precise dot plus a soft ring that trails a beat behind and
// grows over anything interactive. Desktop only — App mounts it when !liteMode.
// Elements can opt into a labelled state with data-cursor="drag" etc.
import { useEffect, useRef } from 'react';

const INTERACTIVE = 'a, button, [data-cursor], .inv-cell, .tag';

export default function Cursor() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);

  useEffect(() => {
    const dot = dotRef.current;
    const ring = ringRef.current;
    document.documentElement.classList.add('has-cursor');

    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    let rx = x;
    let ry = y;
    let scale = 1;
    let targetScale = 1;
    let shown = false;
    let pressed = false;

    const show = (on) => {
      if (shown === on) return;
      shown = on;
      dot.style.opacity = on ? '1' : '0';
      ring.style.opacity = on ? '1' : '0';
    };

    const onMove = (e) => {
      x = e.clientX;
      y = e.clientY;
      show(true);
    };
    const onOver = (e) => {
      const t = e.target.closest?.(INTERACTIVE);
      const label = t?.dataset?.cursor || '';
      targetScale = t ? (label ? 1.9 : 1.55) : 1;
      ring.classList.toggle('cursor-ring--label', !!label);
      ring.firstChild.textContent = label;
    };
    const onDown = () => { pressed = true; };
    const onUp = () => { pressed = false; };
    const onLeave = () => show(false);

    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerover', onOver, { passive: true });
    window.addEventListener('pointerdown', onDown, { passive: true });
    window.addEventListener('pointerup', onUp, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);

    let raf = 0;
    let lastT = performance.now();
    const tick = (now) => {
      const dt = Math.min(Math.max((now - lastT) / 1000, 0), 0.05);
      lastT = now;
      const k = Math.min(dt * 11, 1);
      rx += (x - rx) * k;
      ry += (y - ry) * k;
      scale += ((pressed ? targetScale * 0.82 : targetScale) - scale) * k;
      dot.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      ring.style.transform = `translate3d(${rx}px, ${ry}px, 0) scale(${scale})`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      document.documentElement.classList.remove('has-cursor');
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerover', onOver);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      document.documentElement.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  return (
    <>
      <div ref={dotRef} className="cursor-dot" aria-hidden="true" />
      <div ref={ringRef} className="cursor-ring" aria-hidden="true">
        <span className="cursor-ring-label" />
      </div>
    </>
  );
}

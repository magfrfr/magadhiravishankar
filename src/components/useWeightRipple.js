// Variable-font ripple: letters thin out under the cursor and spring back as
// it passes (Bricolage's wght axis, loaded as a 200..800 range). Reads all
// letter rects first, then writes, so weight-induced reflow happens once.
import { useEffect } from 'react';

export default function useWeightRipple(ref, {
  enabled = true,
  selector = 'span span',
  base = 800,
  min = 520,
  radius = 150,
} = {}) {
  useEffect(() => {
    if (!enabled) return undefined;
    const el = ref.current;
    if (!el) return undefined;

    let raf = 0;
    let px = 0;
    let py = 0;
    let wasNear = false;

    const apply = () => {
      raf = 0;
      const spans = el.querySelectorAll(selector);
      const rects = [];
      spans.forEach(s => rects.push(s.getBoundingClientRect()));
      spans.forEach((s, i) => {
        const b = rects[i];
        const d = Math.hypot(px - (b.left + b.width / 2), py - (b.top + b.height / 2));
        const t = Math.max(0, 1 - d / radius);
        const w = Math.round(base + (min - base) * t * t);
        s.style.fontVariationSettings = w === base ? '' : `'wght' ${w}`;
      });
    };

    const clear = () => {
      el.querySelectorAll(selector).forEach(s => {
        s.style.fontVariationSettings = '';
      });
    };

    const onMove = (e) => {
      px = e.clientX;
      py = e.clientY;
      const r = el.getBoundingClientRect();
      const near =
        px > r.left - radius && px < r.right + radius &&
        py > r.top - radius && py < r.bottom + radius;
      if (near) {
        if (!raf) raf = requestAnimationFrame(apply);
      } else if (wasNear) {
        clear();
      }
      wasNear = near;
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      if (raf) cancelAnimationFrame(raf);
      clear();
    };
  }, [ref, enabled, selector, base, min, radius]);
}

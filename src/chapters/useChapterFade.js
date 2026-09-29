import {
  useScroll, useTransform, useMotionTemplate, useMotionValue, useAnimationFrame,
} from 'framer-motion';
import { bus, readChapterCoord, smoothstep, swapWindows, SWAP_FADE } from '../scene/scrollBus';

/**
 * How lit chapter `index` is allowed to be at chapter coordinate `u`: full
 * between the swap that brings its picture in and the swap that takes it away,
 * nothing outside. Above the split breakpoint the window sweeps clear across
 * the screen to change sides, and this is the only thing standing between that
 * sweep and the type it would otherwise run straight through.
 */
function gateAt(u, index) {
  const w = swapWindows();
  let on = 1;
  if (index > 0) {
    const a = index - 1 + w[index - 1][1];
    on = smoothstep(a, a + SWAP_FADE, u);
  }
  if (index < w.length) {
    const b = index + w[index][0];
    on *= 1 - smoothstep(b - SWAP_FADE, b, u);
  }
  return on;
}

// Scroll-linked dissolve: content condenses in as the chapter arrives and
// evaporates as it leaves, with long overlaps — no slide boundaries.
export default function useChapterFade(
  ref, reducedMotion, { fadeOut = true, lite = false, wide = false, index = 0 } = {},
) {
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });
  // asymmetric: arrive with travel, leave gently
  const opacity = useTransform(
    scrollYProgress,
    fadeOut ? [0.08, 0.28, 0.7, 0.94] : [0.08, 0.28, 1, 1],
    fadeOut ? [0, 1, 1, 0] : [0, 1, 1, 1]
  );
  const y = useTransform(scrollYProgress, [0, 0.28, 0.7, 1], [170, 0, 0, -110]);
  const scale = useTransform(scrollYProgress, [0, 0.28, 0.7, 1], [0.94, 1, 1, 0.97]);
  const blurPx = useTransform(scrollYProgress, [0, 0.24, 0.7, 1], [14, 0, 0, 10]);
  const filter = useMotionTemplate`blur(${blurPx}px)`;

  // The gate rides the same coordinate the camera rig does, so the type and
  // the window it must not touch are on one clock. Below the breakpoint the
  // picture is a box in the flow and cannot cross anything, so it stays open.
  const gate = useMotionValue(1);
  useAnimationFrame(() => {
    if (!wide) return;
    gate.set(gateAt(bus.sceneReady ? bus.u : readChapterCoord(), index));
  });
  const gated = useTransform([opacity, gate], ([o, g]) => o * g);

  if (reducedMotion) return {};
  if (lite) return { opacity, y, scale, willChange: 'opacity, transform' }; // blur is too costly on phones
  if (!wide) return { opacity, y, scale, filter, willChange: 'opacity, transform, filter' };
  return { opacity: gated, y, scale, filter, willChange: 'opacity, transform, filter' };
}

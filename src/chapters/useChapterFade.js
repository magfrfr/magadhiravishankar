import { useScroll, useTransform, useMotionTemplate } from 'framer-motion';

// Scroll-linked dissolve: content condenses in as the chapter arrives and
// evaporates as it leaves, with long overlaps — no slide boundaries.
export default function useChapterFade(ref, reducedMotion, { fadeOut = true, lite = false } = {}) {
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
  const y = useTransform(scrollYProgress, [0, 0.28, 0.7, 1], [90, 0, 0, -55]);
  const blurPx = useTransform(scrollYProgress, [0, 0.24, 0.7, 1], [8, 0, 0, 6]);
  const filter = useMotionTemplate`blur(${blurPx}px)`;
  if (reducedMotion) return {};
  if (lite) return { opacity, y, willChange: 'opacity, transform' }; // blur is too costly on phones
  return { opacity, y, filter, willChange: 'opacity, transform, filter' };
}

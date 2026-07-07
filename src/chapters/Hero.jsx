import { useRef } from 'react';
import { motion } from 'framer-motion';
import { META, CHAPTERS } from '../content';
import useChapterFade from './useChapterFade';

const hero = CHAPTERS[0];
const EASE = [0.22, 0.61, 0.36, 1];

export default function Hero({ reducedMotion, liteMode }) {
  const ref = useRef(null);
  const style = useChapterFade(ref, reducedMotion, { lite: liteMode });

  return (
    <section ref={ref} id={`ch-${hero.id}`} className="chapter chapter--hero">
      <motion.div className="hero-inner" style={style}>
        <p className="eyebrow">{hero.eyebrow}</p>
        <h1 className="hero-name" aria-label={META.name}>
          {reducedMotion
            ? META.name
            : META.name.split('').map((ch, i) => (
                <motion.span
                  key={i}
                  className="hero-letter"
                  initial={{ opacity: 0, y: '0.55em', rotate: -7 }}
                  animate={{ opacity: 1, y: 0, rotate: 0 }}
                  transition={{ delay: 0.12 + i * 0.05, duration: 0.75, ease: EASE }}
                >
                  {ch}
                </motion.span>
              ))}
        </h1>
        <motion.p
          className="hero-tagline"
          initial={reducedMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 1 }}
        >
          {META.tagline}
        </motion.p>
        <motion.div
          className="hero-scroll-hint"
          initial={reducedMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.7, duration: 1 }}
          aria-hidden="true"
        >
          scroll ↓
        </motion.div>
      </motion.div>
    </section>
  );
}

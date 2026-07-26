import { useRef } from 'react';
import { motion } from 'framer-motion';
import { META, CHAPTERS } from '../content';
import useChapterFade from './useChapterFade';
import useWeightRipple from '../components/useWeightRipple';

const hero = CHAPTERS[0];
const EASE = [0.22, 0.61, 0.36, 1];
const LETTER_HIDDEN = { opacity: 0, y: '0.55em', rotate: -7 };
const LETTER_SHOWN = { opacity: 1, y: 0, rotate: 0 };

export default function Hero({ reducedMotion, liteMode, play }) {
  const ref = useRef(null);
  const nameRef = useRef(null);
  const style = useChapterFade(ref, reducedMotion, { lite: liteMode });
  useWeightRipple(nameRef, {
    enabled: !liteMode && !reducedMotion,
    selector: '.hero-letter',
  });

  return (
    <section ref={ref} id={`ch-${hero.id}`} className="chapter chapter--hero">
      <motion.div className="hero-inner" style={style}>
        <p className="eyebrow">{hero.eyebrow}</p>
        <h1 ref={nameRef} className="hero-name" aria-label={META.name}>
          {reducedMotion
            ? META.name
            : META.name.split('').map((ch, i) => (
                <motion.span
                  key={i}
                  className="hero-letter"
                  initial={LETTER_HIDDEN}
                  animate={play ? LETTER_SHOWN : LETTER_HIDDEN}
                  transition={{ delay: 0.12 + i * 0.05, duration: 0.75, ease: EASE }}
                >
                  {ch}
                </motion.span>
              ))}
        </h1>
        <motion.p
          className="hero-tagline"
          initial={reducedMotion ? false : { opacity: 0 }}
          animate={play ? { opacity: 1 } : { opacity: 0 }}
          transition={{ delay: 0.8, duration: 1 }}
        >
          {META.tagline}
        </motion.p>
        <motion.div
          className="hero-scroll-hint"
          initial={reducedMotion ? false : { opacity: 0 }}
          animate={play ? { opacity: 1 } : { opacity: 0 }}
          transition={{ delay: 1.7, duration: 1 }}
          aria-hidden="true"
        >
          scroll ↓
        </motion.div>
      </motion.div>
    </section>
  );
}

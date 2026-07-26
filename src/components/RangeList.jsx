import { useState } from 'react';
import { motion } from 'framer-motion';
import { CATEGORIES, ITEMS } from '../content';

// The thirteen things, set as type instead of as toys. Grouped the way she
// groups them, revealed in sequence on scroll, and hovering one lifts its fact
// into a single caption line rather than scattering thirteen tooltips.
const WORD = {
  hidden: { opacity: 0, y: 26 },
  shown: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 0.61, 0.36, 1] } },
};

const byId = Object.fromEntries(ITEMS.map(i => [i.id, i]));

export default function RangeList({ reducedMotion }) {
  const [hover, setHover] = useState(null);

  const anim = reducedMotion
    ? {}
    : { initial: 'hidden', whileInView: 'shown', viewport: { once: true, margin: '-10% 0px' } };

  return (
    <div className="range">
      {CATEGORIES.map((group, g) => (
        <div className="range-group" key={group.id}>
          <span className="range-label">{group.label}</span>
          <div className="range-words">
            {group.items.map((id, i) => {
              const item = byId[id];
              if (!item) return null;
              return (
                <motion.span
                  className={`range-word${hover === id ? ' range-word--on' : ''}`}
                  key={id}
                  variants={WORD}
                  {...anim}
                  transition={{ delay: g * 0.08 + i * 0.045 }}
                  onMouseEnter={() => setHover(id)}
                  onMouseLeave={() => setHover(null)}
                  data-cursor=""
                >
                  {item.name}
                </motion.span>
              );
            })}
          </div>
        </div>
      ))}

      <p className={`range-fact${hover ? ' range-fact--on' : ''}`} aria-hidden="true">
        {hover ? byId[hover].fact : 'thirteen of them, and counting'}
      </p>
    </div>
  );
}

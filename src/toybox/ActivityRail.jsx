// "all of it" — the activities as a pinned rail: the section holds the screen
// while the glass cards travel sideways under the scroll. Desktop only; lite
// and reduced-motion keep the static Inventory grid.
import { useLayoutEffect, useRef, useState } from 'react';
import { motion, useScroll, useSpring, useTransform } from 'framer-motion';
import { ITEMS, CATEGORIES } from '../content';
import { buildItemSprite } from './itemSprites';

const SPRITE_PX = 96;

const CATEGORY_OF = {};
CATEGORIES.forEach(c => c.items.forEach(id => { CATEGORY_OF[id] = c.label; }));

export default function ActivityRail({ sectionRef }) {
  const trackRef = useRef(null);
  const [span, setSpan] = useState(0); // how far the track has to travel

  const [cards] = useState(() =>
    ITEMS.map(it => ({ ...it, url: buildItemSprite(it.id).toDataURL(), cat: CATEGORY_OF[it.id] }))
  );

  useLayoutEffect(() => {
    const measure = () => {
      const el = trackRef.current;
      if (el) setSpan(Math.max(el.scrollWidth - window.innerWidth, 0));
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  // 'start start' → 'end end' is exactly the window the section stays pinned
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end end'] });
  const x = useTransform(scrollYProgress, [0.02, 0.98], [0, -span]);
  const glide = useSpring(x, { stiffness: 140, damping: 32, mass: 0.7 });

  return (
    <div className="rail-viewport">
      <motion.div ref={trackRef} className="rail-track" style={{ x: glide }}>
        <article className="rail-card rail-card--pass glass" data-cursor="">
          <img src="/idcard.webp" alt="the performer pass" draggable={false} />
        </article>

        {cards.map((it, i) => (
          <article className="rail-card glass" key={it.id} data-cursor="">
            <span className="rail-num">{String(i + 1).padStart(2, '0')}</span>
            <img
              className="rail-sprite"
              src={it.url}
              alt=""
              width={SPRITE_PX}
              height={SPRITE_PX}
              draggable={false}
            />
            <h3 className="rail-name">{it.name}</h3>
            <p className="rail-fact">{it.fact}</p>
            <span className="rail-cat">{it.cat}</span>
          </article>
        ))}
      </motion.div>
    </div>
  );
}

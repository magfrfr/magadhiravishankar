// "all of it" — the jack-of-all-trades inventory: the performer card beside
// the 13 activities grouped into categories, pixel sprites with hover facts.
import { useState } from 'react';
import { motion } from 'framer-motion';
import PhotoFrame from '../components/PhotoFrame';
import { ITEMS, CATEGORIES } from '../content';
import { buildItemSprite } from './itemSprites';

const SPRITE_PX = 64; // 24px art at ~2.7x, crisp via image-rendering: pixelated

function useSpriteUrls() {
  const [sprites] = useState(() => {
    const byId = {};
    ITEMS.forEach(it => {
      byId[it.id] = { ...it, url: buildItemSprite(it.id).toDataURL() };
    });
    return byId;
  });
  return sprites;
}

export default function Inventory({ reducedMotion }) {
  const sprites = useSpriteUrls();
  const [selected, setSelected] = useState(null);

  return (
    <div className="inventory">
      <div className="inventory-card">
        <PhotoFrame src="/idcard.webp" caption="" />
      </div>

      <div className="inventory-groups">
        {CATEGORIES.map(cat => (
          <div className="inv-group" key={cat.id}>
            <p className="inv-label">
              {cat.label} · {String(cat.items.length).padStart(2, '0')}
            </p>
            <div className="inv-row">
              {cat.items.map((id, i) => {
                const it = sprites[id];
                if (!it) return null;
                const open = selected === id;
                return (
                  <motion.button
                    key={id}
                    type="button"
                    className={`inv-cell glass${open ? ' inv-cell--open' : ''}`}
                    onClick={() => setSelected(open ? null : id)}
                    onPointerEnter={() => setSelected(id)}
                    onPointerLeave={() => setSelected(s => (s === id ? null : s))}
                    initial={reducedMotion ? false : { opacity: 0, y: 18, scale: 0.7 }}
                    whileInView={{ opacity: 1, y: 0, scale: 1 }}
                    viewport={{ once: true, margin: '-40px' }}
                    transition={{ delay: i * 0.05, type: 'spring', stiffness: 260, damping: 20 }}
                  >
                    <img src={it.url} alt="" width={SPRITE_PX} height={SPRITE_PX} draggable={false} />
                    <span className="inv-name">{it.name}</span>
                  </motion.button>
                );
              })}
            </div>
            <p className="inv-fact">
              {cat.items.includes(selected) ? sprites[selected].fact : ' '}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

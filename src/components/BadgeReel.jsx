import { useEffect, useRef } from 'react';
import { play } from '../audio/sfx';

// Her ID card on a retractable badge reel, latched to the top-right corner.
// Pull it anywhere; let go and it zips home with a wobble.
// Cord: verlet rope pinned at the clip and at the card. Card: underdamped spring.

const SEGS = 11;          // cord points
const SLACK = 150;        // cord rest length in px — sags when the card is home
const REST_DROP = 118;    // how far below the clip the card hangs at rest
const SPRING_K = 120;     // 1/s² — pull toward home
const SPRING_C = 7;       // 1/s — damping (underdamped: visible overshoot)
const GRAVITY = 1400;     // px/s² on the cord
const CARD_W = 118;

function anchor() {
  return { x: window.innerWidth - 96, y: 6 };
}

export default function BadgeReel() {
  const cardRef = useRef(null);
  const lineRef = useRef(null);
  const clipRef = useRef(null);

  useEffect(() => {
    const card = cardRef.current;
    const line = lineRef.current;
    const clip = clipRef.current;

    const a = anchor();
    // card state: position of the cord's card-end (the punched hole)
    const pos = { x: a.x, y: a.y + REST_DROP };
    const vel = { x: 0, y: 0 };
    const drag = { on: false, dx: 0, dy: 0, moved: 0 };

    // verlet cord
    const pts = Array.from({ length: SEGS }, (_, i) => ({
      x: a.x,
      y: a.y + (REST_DROP * i) / (SEGS - 1),
      px: a.x,
      py: a.y + (REST_DROP * i) / (SEGS - 1),
    }));

    function onDown(e) {
      drag.on = true;
      drag.dx = e.clientX - pos.x;
      drag.dy = e.clientY - pos.y;
      drag.moved = 0;
      card.setPointerCapture(e.pointerId);
      card.style.cursor = 'grabbing';
    }
    function onMove(e) {
      if (!drag.on) return;
      const nx = e.clientX - drag.dx;
      const ny = e.clientY - drag.dy;
      drag.moved = Math.max(drag.moved, Math.hypot(nx - (anchor().x), ny - (anchor().y + REST_DROP)));
      vel.x = (nx - pos.x) * 60;
      vel.y = (ny - pos.y) * 60;
      pos.x = nx;
      pos.y = ny;
    }
    function onUp() {
      if (!drag.on) return;
      drag.on = false;
      card.style.cursor = 'grab';
      if (drag.moved > 70) play('zip');
    }
    card.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);

    let raf;
    let last = performance.now();

    function tick(now) {
      const dt = Math.min((now - last) / 1000, 1 / 30);
      last = now;
      const t = now / 1000;
      const A = anchor();
      clip.style.transform = `translate(${A.x - 9}px, ${A.y - 4}px)`;

      // card home position, with a slow idle pendulum sway
      const homeX = A.x + Math.sin(t * 1.05) * 7;
      const homeY = A.y + REST_DROP + Math.abs(Math.sin(t * 0.5)) * 2;

      if (!drag.on) {
        vel.x += ((homeX - pos.x) * SPRING_K - vel.x * SPRING_C) * dt;
        vel.y += ((homeY - pos.y) * SPRING_K - vel.y * SPRING_C) * dt;
        pos.x += vel.x * dt;
        pos.y += vel.y * dt;
      }

      // cord: verlet integrate + pin ends + distance constraints
      const dist = Math.hypot(pos.x - A.x, pos.y - A.y);
      const seg = Math.max(SLACK, dist) / (SEGS - 1);
      for (let i = 1; i < SEGS - 1; i++) {
        const p = pts[i];
        const vx = (p.x - p.px) * 0.97;
        const vy = (p.y - p.py) * 0.97;
        p.px = p.x;
        p.py = p.y;
        p.x += vx;
        p.y += vy + GRAVITY * dt * dt;
      }
      pts[0].x = A.x;
      pts[0].y = A.y;
      pts[SEGS - 1].x = pos.x;
      pts[SEGS - 1].y = pos.y;
      for (let iter = 0; iter < 3; iter++) {
        for (let i = 0; i < SEGS - 1; i++) {
          const p1 = pts[i];
          const p2 = pts[i + 1];
          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;
          const d = Math.hypot(dx, dy) || 1e-4;
          const diff = (d - seg) / d;
          const pin1 = i === 0;
          const pin2 = i + 1 === SEGS - 1;
          if (!pin1 && !pin2) {
            p1.x += dx * diff * 0.5;
            p1.y += dy * diff * 0.5;
            p2.x -= dx * diff * 0.5;
            p2.y -= dy * diff * 0.5;
          } else if (pin1 && !pin2) {
            p2.x -= dx * diff;
            p2.y -= dy * diff;
          } else if (!pin1 && pin2) {
            p1.x += dx * diff;
            p1.y += dy * diff;
          }
        }
      }

      line.setAttribute('points', pts.map(p => `${p.x},${p.y}`).join(' '));

      // card hangs from the cord's last segment
      const tail = pts[SEGS - 2];
      const angle = Math.atan2(pos.x - tail.x, -(pos.y - tail.y)) * (180 / Math.PI);
      card.style.transform =
        `translate(${pos.x - CARD_W / 2}px, ${pos.y - 8}px) rotate(${Math.max(-28, Math.min(28, angle))}deg)`;

      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      card.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, []);

  return (
    <div className="badge-reel">
      <svg className="badge-cord" aria-hidden="true">
        <polyline ref={lineRef} />
      </svg>
      <div ref={clipRef} className="badge-clip" aria-hidden="true" />
      <div ref={cardRef} className="badge-card" title="pull me">
        <div className="badge-hole" />
        <img src="/idcard.webp" alt="Magadhi's ID card — THE PERFORMER" draggable="false" />
      </div>
    </div>
  );
}

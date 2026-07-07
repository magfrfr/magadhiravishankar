import { useEffect, useRef, useState } from 'react';
import { buildSheet, FRAMES, FRAME_W, FRAME_H } from './sprites';
import { play } from '../audio/sfx';

const SCALE = 4.5; // 16x20 art → 72x90 on screen
const PET_W = FRAME_W * SCALE;
const PET_H = FRAME_H * SCALE;
const SLEEP_AFTER = 45000; // ms of no interaction

function makeBunny(name, palette, xFrac, speed) {
  return {
    name,
    sheet: buildSheet(palette),
    x: window.innerWidth * xFrac,
    dir: 1,
    frame: FRAMES.idleA,
    state: 'idle',
    stateT: 0,
    nextHopAt: 2000 + Math.random() * 4000,
    speed,
    yOff: 0,
  };
}

export default function PetsLayer({ liteMode }) {
  const ashRef = useRef(null);
  const kikoRef = useRef(null);
  const bunnies = useRef(null);
  const [hearts, setHearts] = useState([]);
  const [tag, setTag] = useState(null); // {name, x}
  const lastInteraction = useRef(0);

  useEffect(() => {
    lastInteraction.current = Date.now();
    bunnies.current = [
      makeBunny('ash', 'brown', 0.12, 1),
      makeBunny('kiko', 'lavender', 0.82, 1.15),
    ];
    const els = [ashRef.current, kikoRef.current];
    els.forEach(el => {
      const ctx = el.getContext('2d');
      ctx.imageSmoothingEnabled = false;
    });

    let raf;
    let last = performance.now();

    const bump = () => { lastInteraction.current = Date.now(); };
    window.addEventListener('pointermove', bump, { passive: true });
    window.addEventListener('scroll', bump, { passive: true });

    function setFrame(b, f) { b.frame = f; }

    function startHop(b) {
      const maxX = window.innerWidth - PET_W - 8;
      const dist = (40 + Math.random() * 90) * b.speed;
      // occasionally hop toward the other bunny (chase)
      const other = bunnies.current.find(o => o !== b);
      const toward = Math.random() < 0.18 ? Math.sign(other.x - b.x) : (Math.random() < 0.5 ? 1 : -1);
      b.dir = toward || 1;
      b.target = Math.max(8, Math.min(maxX, b.x + b.dir * dist));
      b.dir = Math.sign(b.target - b.x) || 1;
      b.state = 'hop';
      b.stateT = 0;
      play('hop');
    }

    function tick(now) {
      const dt = now - last;
      last = now;
      const idleFor = Date.now() - lastInteraction.current;

      bunnies.current.forEach((b, i) => {
        b.stateT += dt;

        switch (b.state) {
          case 'idle': {
            setFrame(b, Math.floor(now / 700) % 5 === 0 ? FRAMES.idleB : FRAMES.idleA);
            if (idleFor > SLEEP_AFTER) { b.state = 'sleep'; b.stateT = 0; break; }
            if (b.stateT > b.nextHopAt) startHop(b);
            break;
          }
          case 'hop': {
            const DUR = 460 / b.speed;
            const k = Math.min(b.stateT / DUR, 1);
            if (k < 0.18) setFrame(b, FRAMES.crouch);
            else if (k < 0.55) setFrame(b, FRAMES.airUp);
            else if (k < 0.85) setFrame(b, FRAMES.airDown);
            else setFrame(b, FRAMES.crouch);
            // arc
            const air = Math.max(0, Math.min((k - 0.18) / 0.67, 1));
            b.yOff = -Math.sin(air * Math.PI) * 26;
            b.x = b.x + (b.target - b.x) * Math.min(dt / (DUR * (1 - k) + 1), 1);
            if (k >= 1) {
              b.x = b.target;
              b.yOff = 0;
              b.state = 'idle';
              b.stateT = 0;
              b.nextHopAt = 1800 + Math.random() * 4500;
            }
            break;
          }
          case 'sleep': {
            setFrame(b, FRAMES.sleep);
            if (idleFor < 1500) { b.state = 'idle'; b.stateT = 0; } // woke up
            break;
          }
          case 'happy': {
            setFrame(b, FRAMES.happy);
            b.yOff = -Math.abs(Math.sin(b.stateT / 90)) * 14;
            if (b.stateT > 700) { b.state = 'idle'; b.stateT = 0; b.yOff = 0; }
            break;
          }
          default:
            b.state = 'idle';
        }

        // draw
        const el = els[i];
        const ctx = el.getContext('2d');
        ctx.clearRect(0, 0, PET_W, PET_H);
        ctx.save();
        if (b.dir < 0) {
          ctx.translate(PET_W, 0);
          ctx.scale(-1, 1);
        }
        ctx.drawImage(b.sheet, b.frame * FRAME_W, 0, FRAME_W, FRAME_H, 0, 0, PET_W, PET_H);
        ctx.restore();
        el.style.transform = `translate(${b.x}px, ${b.yOff}px)`;
      });

      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', bump);
      window.removeEventListener('scroll', bump);
    };
  }, []);

  function pet(name, e) {
    const b = bunnies.current.find(x => x.name === name);
    if (!b) return;
    lastInteraction.current = Date.now();
    b.state = 'happy';
    b.stateT = 0;
    play('pet');
    const id = Math.random();
    setHearts(h => [...h, { id, x: e.clientX, y: e.clientY }]);
    setTimeout(() => setHearts(h => h.filter(x => x.id !== id)), 1100);
  }

  return (
    <div className="pets-layer" aria-hidden="true">
      <canvas
        ref={ashRef} width={PET_W} height={PET_H} className="pet"
        onClick={(e) => pet('ash', e)}
        onMouseEnter={() => setTag({ name: 'ash · pet me', x: bunnies.current?.[0].x ?? 0 })}
        onMouseLeave={() => setTag(null)}
      />
      <canvas
        ref={kikoRef} width={PET_W} height={PET_H} className="pet"
        onClick={(e) => pet('kiko', e)}
        onMouseEnter={() => setTag({ name: 'kiko · pet me', x: bunnies.current?.[1].x ?? 0 })}
        onMouseLeave={() => setTag(null)}
      />
      {tag && !liteMode && (
        <div className="pet-tag" style={{ transform: `translateX(${tag.x}px)` }}>{tag.name}</div>
      )}
      {hearts.map(h => (
        <span key={h.id} className="pet-heart" style={{ left: h.x, top: h.y }}>♥</span>
      ))}
    </div>
  );
}

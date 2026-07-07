import { useRef } from 'react';
import { motion, useSpring } from 'framer-motion';

// Wraps anything interactive: it leans toward the cursor and springs home.
export default function Magnetic({ children, strength = 0.32, className }) {
  const ref = useRef(null);
  const x = useSpring(0, { stiffness: 300, damping: 20, mass: 0.6 });
  const y = useSpring(0, { stiffness: 300, damping: 20, mass: 0.6 });

  function move(e) {
    const r = ref.current.getBoundingClientRect();
    x.set((e.clientX - (r.left + r.width / 2)) * strength);
    y.set((e.clientY - (r.top + r.height / 2)) * strength);
  }
  function leave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div
      ref={ref}
      className={`magnetic ${className || ''}`}
      style={{ x, y }}
      onPointerMove={move}
      onPointerLeave={leave}
    >
      {children}
    </motion.div>
  );
}

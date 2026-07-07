import { useRef, useState } from 'react';
import { motion, useSpring } from 'framer-motion';

// Shows /photos/<file> (or a direct `src`) if it exists; otherwise a stylized
// placeholder frame so the site ships before Magadhi drops her photos in.
// The frame tilts toward the cursor like a print you're picking up.
export default function PhotoFrame({ file, src, caption }) {
  const [missing, setMissing] = useState(false);
  const ref = useRef(null);
  const rx = useSpring(0, { stiffness: 220, damping: 18 });
  const ry = useSpring(0, { stiffness: 220, damping: 18 });

  function move(e) {
    const r = ref.current.getBoundingClientRect();
    ry.set(((e.clientX - (r.left + r.width / 2)) / r.width) * 12);
    rx.set(-((e.clientY - (r.top + r.height / 2)) / r.height) * 12);
  }
  function leave() {
    rx.set(0);
    ry.set(0);
  }

  return (
    <motion.figure
      ref={ref}
      className="photo-frame"
      style={{ rotateX: rx, rotateY: ry, transformPerspective: 700 }}
      onPointerMove={move}
      onPointerLeave={leave}
    >
      {missing ? (
        <div className="photo-placeholder">
          <span className="photo-placeholder-mark">✳</span>
          <span className="photo-placeholder-text">photo incoming</span>
        </div>
      ) : (
        <img
          src={src ?? `/photos/${file}`}
          alt={caption}
          loading="lazy"
          onError={() => setMissing(true)}
        />
      )}
      <figcaption>{caption}</figcaption>
    </motion.figure>
  );
}

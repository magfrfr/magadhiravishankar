import { useRef } from 'react';
import { motion } from 'framer-motion';
import { META, SOCIALS, CHAPTERS } from '../content';
import useChapterFade from './useChapterFade';
import Magnetic from '../components/Magnetic';

const data = CHAPTERS[CHAPTERS.length - 1];

export default function Connect({ reducedMotion, liteMode }) {
  const ref = useRef(null);
  const style = useChapterFade(ref, reducedMotion, { fadeOut: false, lite: liteMode });

  return (
    <section ref={ref} id={`ch-${data.id}`} className="chapter chapter--connect">
      <motion.div className="chapter-inner" style={style}>
        <p className="eyebrow">{data.eyebrow}</p>
        <h2 className="chapter-title">{data.title}</h2>
        <p className="story-line">{data.lines[0]}</p>

        <ul className="socials">
          {SOCIALS.map(s => (
            <li key={s.kind}>
              {liteMode ? (
                <a className="glass" href={s.href} target="_blank" rel="noreferrer">
                  <span className="social-kind">{s.kind}</span>
                  <span className="social-label">{s.label}</span>
                </a>
              ) : (
                <Magnetic strength={0.18} className="social-magnet">
                  <a className="glass" href={s.href} target="_blank" rel="noreferrer">
                    <span className="social-kind">{s.kind}</span>
                    <span className="social-label">{s.label}</span>
                  </a>
                </Magnetic>
              )}
            </li>
          ))}
        </ul>

        <footer className="site-footer">
          <span>{META.est}</span>
          <span>{META.version} // {META.fullName.split(' ')[0].toLowerCase()}.rs</span>
        </footer>
      </motion.div>
    </section>
  );
}

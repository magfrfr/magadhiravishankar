import { useRef } from 'react';
import { motion } from 'framer-motion';
import { META, SOCIALS, CHAPTERS, PROFILE, CV } from '../content';
import useChapterFade from './useChapterFade';
import { CHAPTER_IDS } from '../scene/scrollBus';
import Magnetic from '../components/Magnetic';

const data = CHAPTERS[CHAPTERS.length - 1];

export default function Connect({ reducedMotion, liteMode, wide }) {
  const ref = useRef(null);
  const style = useChapterFade(ref, reducedMotion, {
    fadeOut: false, lite: liteMode, wide, index: CHAPTER_IDS.length - 1,
  });

  return (
    <section ref={ref} id={`ch-${data.id}`} className="chapter chapter--connect">
      <motion.div className="chapter-inner" style={style}>
        <p className="eyebrow">{data.eyebrow}</p>
        <h2 className="chapter-title">{data.title}</h2>
        {!wide && <div className="chapter-slot" aria-hidden="true" />}
        <p className="story-line">{data.lines[0]}</p>

        <dl className="profile">
          <div className="profile-row">
            <dt className="profile-key">study</dt>
            <dd className="profile-value">{PROFILE.degree}, {PROFILE.school}</dd>
          </div>
          <div className="profile-row">
            <dt className="profile-key">finishing</dt>
            <dd className="profile-value">{PROFILE.graduating}</dd>
          </div>
          <div className="profile-row">
            <dt className="profile-key">free</dt>
            <dd className="profile-value">{PROFILE.availability}</dd>
          </div>
        </dl>

        <a className="cv glass" href={CV.href} download={CV.file} data-cursor="">
          <span className="cv-label">{CV.label}</span>
          <span className="cv-note">{CV.note}</span>
        </a>

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

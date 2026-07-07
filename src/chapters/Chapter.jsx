import { useRef } from 'react';
import { motion } from 'framer-motion';
import PhotoFrame from '../components/PhotoFrame';
import BlurText from '../components/BlurText';
import Inventory from '../toybox/Inventory';
import useChapterFade from './useChapterFade';

export default function Chapter({ data, reducedMotion, liteMode }) {
  const ref = useRef(null);
  const style = useChapterFade(ref, reducedMotion, { lite: liteMode });

  return (
    <section ref={ref} id={`ch-${data.id}`} className={`chapter chapter--${data.id}`}>
      <motion.div className="chapter-inner" style={style}>
        <p className="eyebrow">{data.eyebrow}</p>
        {data.title && (
          <h2 className="chapter-title">
            {reducedMotion ? data.title : <BlurText text={data.title} animateBy="words" delay={90} />}
          </h2>
        )}

        <div className="chapter-body">
          <div className="chapter-lines">
            {data.lines?.map((line, i) => (
              <p className="story-line" key={i}>{line}</p>
            ))}
            {data.experience && (
              <ul className="xp">
                {data.experience.map(x => (
                  <li key={x.role}>
                    <span className="xp-when">{x.when}</span>
                    <span className="xp-role">{x.role} — {x.org}</span>
                    {x.points.map(p => (
                      <span className="xp-point" key={p}>{p}</span>
                    ))}
                  </li>
                ))}
              </ul>
            )}
            {data.tags?.length > 0 && (
              <div className="tags">
                {data.tags.map(t => <span className="tag" key={t}>{t}</span>)}
              </div>
            )}
          </div>

          {data.photos?.length > 0 && (
            <div className="chapter-media">
              {data.photos?.map(p => (
                <PhotoFrame key={p.file} file={p.file} caption={p.caption} />
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {data.toybox && <Inventory reducedMotion={reducedMotion} />}
    </section>
  );
}

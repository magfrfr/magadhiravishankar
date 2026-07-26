import { useRef } from 'react';
import { motion } from 'framer-motion';
import PhotoFrame from '../components/PhotoFrame';
import BlurText from '../components/BlurText';
import WorkList from '../components/WorkList';
import RangeList from '../components/RangeList';
import useChapterFade from './useChapterFade';
import useWeightRipple from '../components/useWeightRipple';

export default function Chapter({ data, reducedMotion, liteMode }) {
  const ref = useRef(null);
  const titleRef = useRef(null);

  const style = useChapterFade(ref, reducedMotion, { lite: liteMode });
  useWeightRipple(titleRef, { enabled: !liteMode && !reducedMotion });

  return (
    <section ref={ref} id={`ch-${data.id}`} className={`chapter chapter--${data.id}`}>
      <motion.div className="chapter-inner" style={style}>
        <p className="eyebrow">{data.eyebrow}</p>
        {data.title && (
          <h2 ref={titleRef} className="chapter-title">
            {reducedMotion ? data.title : <BlurText text={data.title} animateBy="letters" delay={35} />}
          </h2>
        )}

        <div className="chapter-body">
          <div className="chapter-lines">
            {data.lines?.map((line, i) => (
              <p className="story-line" key={i}>{line}</p>
            ))}
            {data.experience && (
              <WorkList entries={data.experience} reducedMotion={reducedMotion} />
            )}
            {data.range && <RangeList reducedMotion={reducedMotion} />}
            {data.tags?.length > 0 && (
              <div className="tags">
                {data.tags.map(t => <span className="tag glass" key={t}>{t}</span>)}
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
    </section>
  );
}

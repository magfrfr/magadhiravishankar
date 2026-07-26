import { useRef } from 'react';
import { motion } from 'framer-motion';
import PhotoFrame from '../components/PhotoFrame';
import BlurText from '../components/BlurText';
import Inventory from '../toybox/Inventory';
import ActivityRail from '../toybox/ActivityRail';
import useChapterFade from './useChapterFade';
import useWeightRipple from '../components/useWeightRipple';

export default function Chapter({ data, reducedMotion, liteMode }) {
  const ref = useRef(null);
  const titleRef = useRef(null);
  // the rail needs room to be pinned in; phones keep the static grid
  const rail = data.toybox && !liteMode && !reducedMotion;

  // a pinned header needs no dissolve — the sticky frame carries it in and out
  const style = useChapterFade(ref, reducedMotion || rail, { lite: liteMode });
  useWeightRipple(titleRef, { enabled: !liteMode && !reducedMotion });

  const inner = (
    <>
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
              <ul className="xp">
                {data.experience.map(x => (
                  <li className="glass" key={x.role}>
                    <span className="xp-when">{x.when}</span>
                    <span className="xp-role">{x.role}</span>
                    <span className="xp-org">{x.org}</span>
                    {x.points.map(p => (
                      <span className="xp-point" key={p}>{p}</span>
                    ))}
                  </li>
                ))}
              </ul>
            )}
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

      {rail
        ? <ActivityRail sectionRef={ref} />
        : data.toybox && <Inventory reducedMotion={reducedMotion} />}
    </>
  );

  return (
    <section
      ref={ref}
      id={`ch-${data.id}`}
      className={`chapter chapter--${data.id}${rail ? ' chapter--rail' : ''}`}
    >
      {rail ? <div className="rail-sticky">{inner}</div> : inner}
    </section>
  );
}

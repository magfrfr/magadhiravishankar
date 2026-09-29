import { motion } from 'framer-motion';

// Selected work as an editorial list: a hairline rule, the year, the role, and
// the one number a reader actually keeps. Every number here is real — if an
// entry has no honest metric it does not get one.
//
// Motion is scroll-triggered and runs once: rows rise and unblur in sequence,
// and each rule draws itself in from the left. Reduced motion gets the same
// layout with nothing moving.
const ROW = {
  hidden: { opacity: 0, y: 42, filter: 'blur(8px)' },
  shown: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.75, ease: [0.22, 0.61, 0.36, 1] },
  },
};

const RULE = {
  hidden: { scaleX: 0 },
  shown: { scaleX: 1, transition: { duration: 0.9, ease: [0.22, 0.61, 0.36, 1] } },
};

export default function WorkList({ entries, reducedMotion }) {
  const anim = reducedMotion
    ? {}
    : { initial: 'hidden', whileInView: 'shown', viewport: { once: true, margin: '-12% 0px' } };

  return (
    <ol className="work">
      {entries.map((x, i) => {
        const Row = x.href ? motion.a : motion.div;
        const rowProps = x.href
          ? { href: x.href, target: '_blank', rel: 'noreferrer', 'data-cursor': '' }
          : {};
        return (
          <li className="work-row" key={x.role}>
            <motion.span
              className="work-rule"
              variants={RULE}
              {...anim}
              transition={{ delay: i * 0.06 }}
            />
            <Row
              className="work-body"
              variants={ROW}
              {...anim}
              transition={{ delay: i * 0.08 }}
              {...rowProps}
            >
              <span className="work-when">{x.when}</span>

              <span className="work-main">
                <span className="work-role">
                  {x.role}
                  {x.href && <span className="work-arrow" aria-hidden="true">↗</span>}
                </span>
                <span className="work-org">{x.org}</span>
                {x.points.map(p => (
                  <span className="work-point" key={p}>{p}</span>
                ))}
                {x.stack?.length > 0 && (
                  <span className="work-stack">
                    {x.stack.map(s => <span className="work-chip" key={s}>{s}</span>)}
                  </span>
                )}
              </span>

              {/* an entry with no honest number does not get one — the column
                  stays empty rather than being filled with something invented */}
              <span className="work-metric">
                {x.metric && <span className="work-metric-value">{x.metric}</span>}
                {x.metricLabel && <span className="work-metric-label">{x.metricLabel}</span>}
              </span>
            </Row>

            {/* the lead entry carries a case study. It sits OUTSIDE the row,
                because the row is an anchor to the repo and this block holds
                its own prose. */}
            {x.study && (
              <motion.div
                className="study"
                variants={ROW}
                {...anim}
                transition={{ delay: i * 0.08 + 0.1 }}
              >
                <span className="study-label">{x.study.label}</span>
                <dl className="study-rows">
                  {x.study.rows.map(r => (
                    <div className="study-row" key={r.k}>
                      <dt className="study-key">{r.k}</dt>
                      <dd className="study-value">{r.v}</dd>
                    </div>
                  ))}
                </dl>
              </motion.div>
            )}
          </li>
        );
      })}
    </ol>
  );
}

import { motion } from 'framer-motion';
import { TOOLS } from '../content';

// The tools band at the foot of the work chapter. It borrows the skeleton of
// RangeList — mono label left, wrapped items right, one hairline per group —
// but sets the items small instead of as display type, so it reads as the spec
// under the work rather than as a second headline list.
const GROUP = {
  hidden: { opacity: 0, y: 22 },
  shown: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 0.61, 0.36, 1] } },
};

export default function ToolBand({ reducedMotion }) {
  const anim = reducedMotion
    ? {}
    : { initial: 'hidden', whileInView: 'shown', viewport: { once: true, margin: '-10% 0px' } };

  return (
    <div className="tools">
      {TOOLS.map((group, g) => (
        <motion.div
          className="tools-group"
          key={group.id}
          variants={GROUP}
          {...anim}
          transition={{ delay: g * 0.08 }}
        >
          <span className="tools-label">{group.label}</span>
          <div className="tools-items">
            {group.items.map(item => (
              <span className="tools-item" key={item}>{item}</span>
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

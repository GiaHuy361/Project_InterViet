import React from 'react';
import { motion } from 'motion/react';

const orbs = [
  { size: 8, left: '10%', top: '15%', delay: 0, duration: 10, color: 'bg-blue-400/20' },
  { size: 5, left: '85%', top: '20%', delay: 1.5, duration: 12, color: 'bg-violet-400/25' },
  { size: 10, left: '70%', top: '75%', delay: 0.8, duration: 14, color: 'bg-cyan-400/15' },
  { size: 6, left: '18%', top: '70%', delay: 2.2, duration: 11, color: 'bg-indigo-400/20' },
  { size: 4, left: '92%', top: '50%', delay: 1, duration: 9, color: 'bg-white/10' },
];

export const FloatingOrbs: React.FC = () => {
  return (
    <motion.div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2, duration: 1.2 }}
    >
      {orbs.map((orb, i) => (
        <motion.span
          key={i}
          className={`absolute rounded-full blur-[2px] ${orb.color}`}
          style={{
            width: orb.size,
            height: orb.size,
            left: orb.left,
            top: orb.top,
          }}
          animate={{
            y: [0, -28, 0],
            x: [0, 14, 0],
            opacity: [0.15, 0.55, 0.15],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: orb.duration,
            repeat: Infinity,
            delay: orb.delay,
            ease: 'easeInOut',
          }}
        />
      ))}
    </motion.div>
  );
};

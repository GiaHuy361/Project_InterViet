import React from 'react';
import { motion } from 'motion/react';
import { cn } from '../ui/utils';

export const GradientProgress: React.FC<{
  value: number;
  className?: string;
}> = ({ value, className }) => {
  const pct = Math.min(100, Math.max(0, value));

  return (
    <div
      className={cn(
        'relative h-2.5 w-full overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-800',
        className
      )}
    >
      <motion.div
        className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-blue-500 via-blue-600 to-violet-600"
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  );
};

import React from 'react';
import { motion } from 'motion/react';
import { cn } from '../ui/utils';

type AmbientVariant = 'app' | 'public' | 'subtle';

const variantStyles: Record<AmbientVariant, string> = {
  app: 'from-slate-50 via-white to-indigo-50/50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/30',
  public: 'from-slate-50/90 via-white to-violet-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-violet-950/20',
  subtle: 'from-transparent via-transparent to-transparent',
};

export const PageAmbient: React.FC<{
  variant?: AmbientVariant;
  className?: string;
}> = ({ variant = 'app', className }) => (
  <motion.div
    className={cn('pointer-events-none absolute inset-0 z-0 overflow-hidden', className)}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.8 }}
    aria-hidden
  >
    <motion.div
      className={cn('absolute inset-0 bg-gradient-to-br', variantStyles[variant])}
    />
    {variant !== 'subtle' && (
      <>
        <motion.div
          className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-violet-400/20 blur-3xl"
          animate={{ opacity: [0.2, 0.45, 0.2], scale: [1, 1.08, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute top-1/3 -left-24 h-72 w-72 rounded-full bg-blue-400/15 blur-3xl"
          animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-0 right-1/4 h-80 w-80 rounded-full bg-cyan-400/12 blur-3xl"
          animate={{ x: [0, -25, 0], y: [0, 15, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        />
      </>
    )}
  </motion.div>
);

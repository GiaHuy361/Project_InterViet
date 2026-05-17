import React from 'react';
import { motion } from 'motion/react';
import { FadeInImmediate } from './motion';
import { cn } from '../ui/utils';

export const PublicPageHero: React.FC<{
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  className?: string;
}> = ({ title, subtitle, children, className }) => (
  <section
    className={cn(
      'relative overflow-hidden py-20 text-white',
      className
    )}
  >
    <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-violet-600 to-indigo-800" />
    <motion.div
      className="pointer-events-none absolute -right-20 top-0 h-64 w-64 rounded-full bg-white/10 blur-3xl"
      animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.5, 0.3] }}
      transition={{ duration: 6, repeat: Infinity }}
    />
    <motion.div
      className="pointer-events-none absolute -left-16 bottom-0 h-48 w-48 rounded-full bg-cyan-400/20 blur-3xl"
      animate={{ x: [0, 20, 0] }}
      transition={{ duration: 10, repeat: Infinity }}
    />
    <div className="relative z-10 mx-auto max-w-7xl px-6 text-center">
      <FadeInImmediate>
        <motion.h1
          className="mb-4 text-4xl font-extrabold tracking-tight md:text-5xl lg:text-6xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {title}
        </motion.h1>
        {subtitle && (
          <p className="mx-auto max-w-2xl text-lg text-blue-100 md:text-xl">{subtitle}</p>
        )}
        {children && <div className="mt-8">{children}</div>}
      </FadeInImmediate>
    </div>
  </section>
);

import React from 'react';
import { motion } from 'motion/react';

type MeshBackgroundProps = {
  variant?: 'light' | 'dark' | 'auth';
  className?: string;
};

export const MeshBackground: React.FC<MeshBackgroundProps> = ({
  variant = 'light',
  className = '',
}) => {
  const isDark = variant === 'dark' || variant === 'auth';

  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      <div
        className={`absolute inset-0 ${
          isDark
            ? 'bg-[var(--brand-dark,#0a0f1e)]'
            : 'bg-gradient-to-br from-slate-50 via-white to-blue-50/90'
        }`}
      />

      {variant === 'auth' && (
        <>
          <div
            className="absolute inset-0 opacity-[0.35]"
            style={{
              backgroundImage: `
                radial-gradient(ellipse 80% 50% at 20% 0%, rgba(59, 130, 246, 0.45), transparent 50%),
                radial-gradient(ellipse 60% 40% at 90% 20%, rgba(139, 92, 246, 0.35), transparent 45%),
                radial-gradient(ellipse 50% 50% at 50% 100%, rgba(6, 182, 212, 0.2), transparent 50%)
              `,
            }}
          />
          <motion.div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
              backgroundSize: '28px 28px',
            }}
            animate={{ opacity: [0.03, 0.06, 0.03] }}
            transition={{ duration: 10, repeat: Infinity }}
          />
        </>
      )}

      <motion.div
        className={`absolute -left-32 top-0 h-[480px] w-[480px] rounded-full blur-3xl ${
          isDark ? 'bg-blue-500/35' : 'bg-blue-400/20'
        }`}
        animate={{ x: [0, 50, 0], y: [0, 35, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className={`absolute -right-20 top-1/4 h-[420px] w-[420px] rounded-full blur-3xl ${
          isDark ? 'bg-violet-600/30' : 'bg-violet-400/18'
        }`}
        animate={{ x: [0, -40, 0], y: [0, 45, 0], scale: [1, 1.12, 1] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      />
      <motion.div
        className={`absolute bottom-0 left-1/3 h-[360px] w-[360px] rounded-full blur-3xl ${
          isDark ? 'bg-indigo-500/25' : 'bg-cyan-400/12'
        }`}
        animate={{ x: [0, 30, 0], y: [0, -25, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
      />

      {!isDark && (
        <motion.div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_transparent_0%,_white_75%)]" />
      )}

      {isDark && (
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f1e] via-transparent to-transparent opacity-60" />
      )}
    </div>
  );
};

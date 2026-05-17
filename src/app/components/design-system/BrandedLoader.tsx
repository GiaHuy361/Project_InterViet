import React from 'react';
import { motion } from 'motion/react';
import { MeshBackground } from './MeshBackground';
import { BrandIcon } from '../brand/BrandLogo';

type BrandedLoaderProps = {
  message?: string;
  fullScreen?: boolean;
};

export const BrandedLoader: React.FC<BrandedLoaderProps> = ({
  message = 'Đang tải...',
  fullScreen = true,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={
        fullScreen
          ? 'fixed inset-0 z-[100] flex items-center justify-center'
          : 'flex min-h-[40vh] items-center justify-center py-16'
      }
    >
      <MeshBackground variant="auth" className="opacity-90" />
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/95 via-indigo-950/90 to-violet-950/95" />

      <div className="relative z-10 flex flex-col items-center gap-6 px-6 text-center">
        <div className="relative">
          <motion.div
            className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 blur-xl"
            animate={{ opacity: [0.4, 0.8, 0.4], scale: [1, 1.15, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            animate={{ rotate: [0, 3, -3, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          >
            <BrandIcon size={64} />
          </motion.div>
          <motion.span
            className="absolute -inset-3 rounded-3xl border-2 border-white/20"
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          />
        </div>

        <div className="space-y-2">
          <p className="text-lg font-semibold text-white">{message}</p>
          <motion.div
            className="mx-auto flex gap-1.5"
            initial="hidden"
            animate="show"
          >
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="h-2 w-2 rounded-full bg-gradient-to-r from-cyan-300 to-violet-300"
                animate={{ y: [0, -8, 0], opacity: [0.5, 1, 0.5] }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  delay: i * 0.15,
                  ease: 'easeInOut',
                }}
              />
            ))}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

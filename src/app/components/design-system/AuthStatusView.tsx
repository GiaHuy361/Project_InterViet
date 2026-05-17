import React from 'react';
import { motion } from 'motion/react';
import type { LucideIcon } from 'lucide-react';
import { AuthFormCard } from './AuthFormCard';
import { AuthAlert } from '../auth/AuthAlert';
import { Loader2 } from 'lucide-react';

type StatusTone = 'loading' | 'success' | 'error' | 'pending';

const toneStyles: Record<
  StatusTone,
  { ring: string; bg: string; icon: string }
> = {
  loading: {
    ring: 'border-blue-200',
    bg: 'bg-blue-50',
    icon: 'text-blue-600',
  },
  success: {
    ring: 'border-emerald-200',
    bg: 'bg-emerald-50',
    icon: 'text-emerald-600',
  },
  error: {
    ring: 'border-red-200',
    bg: 'bg-red-50',
    icon: 'text-red-600',
  },
  pending: {
    ring: 'border-violet-200',
    bg: 'bg-violet-50',
    icon: 'text-violet-600',
  },
};

type AuthStatusViewProps = {
  badge?: string;
  title: string;
  subtitle?: string;
  tone: StatusTone;
  icon: LucideIcon;
  loading?: boolean;
  alertMessage?: string;
  alertVariant?: 'error' | 'success' | 'info';
  children?: React.ReactNode;
};

export const AuthStatusView: React.FC<AuthStatusViewProps> = ({
  badge,
  title,
  subtitle,
  tone,
  icon: Icon,
  loading = false,
  alertMessage,
  alertVariant = 'error',
  children,
}) => {
  const styles = toneStyles[tone];

  return (
    <AuthFormCard badge={badge} title={title} subtitle={subtitle}>
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
        className="mb-6 flex flex-col items-center text-center"
      >
        <motion.div
          className={`relative flex h-20 w-20 items-center justify-center rounded-full border-2 ${styles.ring} ${styles.bg}`}
          animate={
            tone === 'loading'
              ? { scale: [1, 1.05, 1] }
              : tone === 'pending'
                ? { y: [0, -4, 0] }
                : {}
          }
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          {tone === 'loading' && (
            <motion.span
              className="absolute inset-0 rounded-full border-2 border-blue-400/30 border-t-blue-600"
              animate={{ rotate: 360 }}
              transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
            />
          )}
          {loading ? (
            <Loader2 className={`h-9 w-9 animate-spin ${styles.icon}`} />
          ) : (
            <Icon className={`h-9 w-9 ${styles.icon}`} />
          )}
        </motion.div>
      </motion.div>

      {alertMessage && <AuthAlert message={alertMessage} variant={alertVariant} />}
      {children}
    </AuthFormCard>
  );
};

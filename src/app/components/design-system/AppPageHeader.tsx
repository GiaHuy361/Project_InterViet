import React from 'react';
import { FadeInImmediate } from './motion';
import { cn } from '../ui/utils';
import type { LucideIcon } from 'lucide-react';

export const AppPageHeader: React.FC<{
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  iconGradient?: string;
  actions?: React.ReactNode;
  badge?: React.ReactNode;
  className?: string;
}> = ({
  title,
  subtitle,
  icon: Icon,
  iconGradient: _iconGradient = 'from-blue-500 to-violet-600',
  actions,
  badge,
  className,
}) => (
  <FadeInImmediate className={cn('mb-6', className)}>
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        {Icon && (
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 text-white shadow-md shadow-blue-500/20">
            <Icon className="h-5 w-5" />
          </span>
        )}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white lg:text-3xl">
              {title}
            </h1>
            {badge}
          </div>
          {subtitle && (
            <p className="mt-1.5 max-w-2xl text-sm text-slate-600 dark:text-slate-400 lg:text-base">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  </FadeInImmediate>
);

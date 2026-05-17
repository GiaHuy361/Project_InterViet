import React from 'react';
import { cn } from '../ui/utils';
import { getPlanAvatarClass } from '../../../utils/planAvatar';

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

type AvatarInitialsProps = {
  name: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  /** Gói đăng ký — đổi gradient giống khung “Gói hiện tại”. */
  plan?: string | null;
};

const sizeClasses = {
  sm: 'h-10 w-10 text-xs',
  md: 'h-14 w-14 text-sm',
  lg: 'h-16 w-16 text-base',
};

export const AvatarInitials: React.FC<AvatarInitialsProps> = ({
  name,
  className,
  size = 'md',
  plan,
}) => (
  <div
    className={cn(
      'flex shrink-0 items-center justify-center rounded-2xl font-bold ring-2 ring-white dark:ring-slate-800',
      getPlanAvatarClass(plan),
      sizeClasses[size],
      className,
    )}
    aria-hidden
  >
    {getInitials(name)}
  </div>
);

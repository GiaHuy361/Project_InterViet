import React from 'react';
import { cn } from '../ui/utils';

const PALETTES = [
  'from-blue-500 to-indigo-600',
  'from-violet-500 to-purple-600',
  'from-cyan-500 to-blue-600',
  'from-indigo-500 to-violet-600',
] as const;

function hashName(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h + name.charCodeAt(i)) | 0;
  return Math.abs(h);
}

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
}) => {
  const palette = PALETTES[hashName(name) % PALETTES.length];
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br font-bold text-white shadow-md ring-2 ring-white',
        palette,
        sizeClasses[size],
        className,
      )}
      aria-hidden
    >
      {getInitials(name)}
    </div>
  );
};

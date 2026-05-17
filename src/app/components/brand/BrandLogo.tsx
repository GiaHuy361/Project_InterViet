import React from 'react';
import { Link } from 'react-router';
import { cn } from '../ui/utils';
import { BRAND } from '../../config/branding';

type BrandLogoProps = {
  size?: 'sm' | 'md' | 'lg';
  showWordmark?: boolean;
  variant?: 'light' | 'dark' | 'color';
  href?: string;
  className?: string;
};

const iconSizes = { sm: 32, md: 40, lg: 48 };
const wordmarkHeights = { sm: 28, md: 36, lg: 44 };

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showWordmark = true,
  variant = 'color',
  href,
  className,
}) => {
  const iconPx = iconSizes[size];
  const logoSrc =
    showWordmark && variant === 'light' ? BRAND.assets.logoLight : BRAND.assets.logo;

  const content = showWordmark ? (
    <img
      src={logoSrc}
      alt={BRAND.name}
      height={wordmarkHeights[size]}
      className="h-auto w-auto object-contain"
      style={{ height: wordmarkHeights[size] }}
    />
  ) : (
    <img
      src={BRAND.assets.logoIcon}
      alt={BRAND.name}
      width={iconPx}
      height={iconPx}
      className="shrink-0"
    />
  );

  const wrapper = (
    <span className={cn('inline-flex items-center', className)}>{content}</span>
  );

  if (href) {
    return (
      <Link to={href} className="inline-flex items-center transition-opacity hover:opacity-90">
        {wrapper}
      </Link>
    );
  }

  return wrapper;
};

/** Avatar-style icon for headers when only icon fits */
export const BrandIcon: React.FC<{ className?: string; size?: number }> = ({
  className,
  size = 36,
}) => (
  <span
    className={cn(
      'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-xl shadow-lg shadow-blue-500/25 ring-1 ring-white/20',
      className,
    )}
    style={{ width: size, height: size }}
  >
    <img src={BRAND.assets.logoIcon} alt="" width={size} height={size} className="h-full w-full" />
  </span>
);

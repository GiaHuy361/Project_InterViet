import React from 'react';
import { FadeInImmediate } from './motion';

type AuthFormCardProps = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  badge?: string;
};

export const AuthFormCard: React.FC<AuthFormCardProps> = ({
  title,
  subtitle,
  children,
  footer,
  badge,
}) => {
  return (
    <FadeInImmediate className="w-full max-w-[440px]">
      <div className="card-aurora hover-lift shadow-2xl shadow-blue-900/10">
        <section className="card-aurora-inner relative overflow-hidden p-8 sm:p-10">
        <span className="pointer-events-none absolute -right-16 -top-16 block h-40 w-40 rounded-full bg-gradient-to-br from-blue-400/25 to-violet-400/25 blur-2xl animate-pulse-glow" />
        <span className="pointer-events-none absolute -bottom-20 -left-16 block h-36 w-36 rounded-full bg-gradient-to-tr from-cyan-400/15 to-blue-400/10 blur-2xl" />
        <section className="relative">
          {badge && (
            <span className="mb-4 inline-flex items-center rounded-full border border-blue-200/80 bg-blue-50/90 px-3 py-1 text-xs font-semibold text-blue-700">
              {badge}
            </span>
          )}
          <header className="mb-8 text-center sm:text-left">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{title}</h1>
            {subtitle && <p className="mt-2 text-sm text-slate-500 sm:text-base">{subtitle}</p>}
          </header>
          {children}
          {footer && <footer className="mt-6">{footer}</footer>}
        </section>
        </section>
      </div>
    </FadeInImmediate>
  );
};



import React from 'react';
import { Outlet } from 'react-router';
import { PublicHeader } from '../components/PublicHeader';
import { PublicFooter } from '../components/PublicFooter';
import { CookieBanner } from '../components/CookieBanner';
import { MeshBackground } from '../components/design-system/MeshBackground';

export const PublicLayout: React.FC = () => {
  return (
    <div className="relative min-h-screen flex flex-col">
      <MeshBackground variant="light" className="fixed inset-0 -z-10 opacity-60" />
      <PublicHeader />
      <main className="relative flex-1">
        <Outlet />
      </main>
      <PublicFooter />
      <CookieBanner />
    </div>
  );
};

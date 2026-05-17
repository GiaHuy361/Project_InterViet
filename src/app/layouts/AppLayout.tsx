import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router';
import { AppHeader } from '../components/AppHeader';
import { AppSidebar } from '../components/AppSidebar';
import { CommandPalette } from '../components/CommandPalette';
import { ProductTour } from '../components/ProductTour';
import { FeedbackModal } from '../components/FeedbackModal';
import { useApp } from '../contexts/AppContext';
import { EmailVerificationBanner } from '../components/auth/EmailVerificationBanner';
import { toast } from 'sonner';

export const AppLayout: React.FC = () => {
  const { state, startTrial } = useApp();
  const navigate = useNavigate();
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  // Note: Auth check is now handled by ProtectedRoute wrapper in routes.tsx

  // Cmd/Ctrl + K for command palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // ========================================
  // SAFETY GUARD LAYER - INTERCEPT EXTERNAL NAVIGATION
  // ========================================
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');
      
      if (!anchor) return;
      
      const href = anchor.getAttribute('href');
      if (!href) return;
      
      // Check if it's an external link (starts with http/https)
      const isExternal = href.startsWith('http://') || href.startsWith('https://');
      
      if (!isExternal) return;
      
      const text = anchor.textContent?.trim().toLowerCase() || '';
      
      // Intercept upgrade/trial CTAs
      if (
        text.includes('dùng thử 7 ngày') || 
        text.includes('dùng thử miễn phí') ||
        text.includes('start trial') ||
        text.includes('free trial')
      ) {
        e.preventDefault();
        e.stopPropagation();
        startTrial();
        console.log('[Safety Guard] Intercepted trial CTA, activated trial');
        return;
      }
      
      if (
        text.includes('nâng cấp') || 
        text.includes('upgrade now') ||
        text.includes('upgrade premium')
      ) {
        e.preventDefault();
        e.stopPropagation();
        navigate('/goi-dich-vu'); // Changed from '/thanh-toan' to '/goi-dich-vu'
        console.log('[Safety Guard] Intercepted upgrade CTA, navigate to /goi-dich-vu');
        return;
      }
      
      if (
        text.includes('xem bảng giá') ||
        text.includes('view pricing') ||
        text.includes('bảng giá')
      ) {
        e.preventDefault();
        e.stopPropagation();
        navigate('/goi-dich-vu'); // Changed from '/bang-gia' to '/goi-dich-vu'
        console.log('[Safety Guard] Intercepted pricing CTA, navigate to /goi-dich-vu');
        return;
      }
      
      // If external link is not a known CTA, warn and prevent
      console.warn('[Safety Guard] Blocked external navigation:', href);
      toast.error('Không thể mở liên kết bên ngoài từ ứng dụng');
      e.preventDefault();
    };
    
    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, [navigate, startTrial]);

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <AppSidebar />
      
      <div className="relative flex flex-1 flex-col">
        <AppHeader onOpenFeedback={() => setFeedbackOpen(true)} />
        
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            <EmailVerificationBanner />
            <Outlet />
          </div>
        </main>
      </div>

      <CommandPalette open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen} />
      <ProductTour />
      <FeedbackModal open={feedbackOpen} onOpenChange={setFeedbackOpen} />
    </div>
  );
};
import React from 'react';
import { Outlet } from 'react-router';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AppProvider } from '../contexts/AppContext';
import { Toaster } from '../components/ui/sonner';

// Get Google Client ID from environment
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

if (import.meta.env.DEV && GOOGLE_CLIENT_ID) {
  console.info(
    '[Google OAuth] Add this origin under Authorized JavaScript origins in Google Cloud Console:',
    typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
  );
}

export const RootLayout: React.FC = () => {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID} locale="vi">
      <AppProvider>
        <Outlet />
        <Toaster />
        {/* Global UI Layer for Portal-based dropdowns and modals */}
        <div id="ui-layer" style={{ position: 'relative', zIndex: 9999 }} />
      </AppProvider>
    </GoogleOAuthProvider>
  );
};

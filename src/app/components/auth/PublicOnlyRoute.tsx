/**
 * Public Only Route — redirect authenticated users to dashboard
 */

import React from 'react';
import { Navigate } from 'react-router';
import { useApp } from '../../contexts/AppContext';
import { BrandedLoader } from '../design-system/BrandedLoader';

interface PublicOnlyRouteProps {
  children: React.ReactNode;
}

export const PublicOnlyRoute: React.FC<PublicOnlyRouteProps> = ({ children }) => {
  const { state } = useApp();

  if (state.isLoading) {
    return <BrandedLoader message="Đang tải..." fullScreen={false} />;
  }

  if (state.isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

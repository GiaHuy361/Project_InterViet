/**
 * Protected Route Component
 *
 * Redirects to /login if user is not authenticated
 * Shows loading spinner while checking auth status
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router';
import { useApp } from '../../contexts/AppContext';
import { BrandedLoader } from '../design-system/BrandedLoader';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { state } = useApp();
  const location = useLocation();

  if (state.isLoading) {
    return <BrandedLoader message="Đang khởi tạo phiên làm việc..." />;
  }

  if (!state.isAuthenticated) {
    const returnUrl = location.pathname + location.search;
    return <Navigate to={`/dang-nhap?returnUrl=${encodeURIComponent(returnUrl)}`} replace />;
  }

  return <>{children}</>;
};

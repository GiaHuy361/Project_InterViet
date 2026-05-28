/**
 * Role Guard Component
 *
 * Protects routes based on system roles (user/support/admin).
 * Redirects to /forbidden if the user's role is not in the allowed list.
 *
 * Usage:
 *   <RoleGuard allowedRoles={['admin']}>
 *     <AdminDashboardPage />
 *   </RoleGuard>
 *
 *   <RoleGuard allowedRoles={['admin', 'support']}>
 *     <SupportTicketsPage />
 *   </RoleGuard>
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router';
import { useApp } from '../../contexts/AppContext';
import { BrandedLoader } from '../design-system/BrandedLoader';
import type { SystemRole } from '../../../lib/auth/jwtDecode';

interface RoleGuardProps {
  /** List of roles allowed to access this route */
  allowedRoles: SystemRole[];
  children: React.ReactNode;
  /** Path to redirect to when access is denied (default: '/forbidden') */
  fallbackPath?: string;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  allowedRoles,
  children,
  fallbackPath = '/forbidden',
}) => {
  const { state } = useApp();
  const location = useLocation();

  // Show loader while auth state is being determined
  if (state.isLoading) {
    return <BrandedLoader message="Đang kiểm tra quyền truy cập..." />;
  }

  // Not authenticated — redirect to login (ProtectedRoute should catch this,
  // but this is a safety fallback)
  if (!state.isAuthenticated || !state.user) {
    const returnUrl = location.pathname + location.search;
    return <Navigate to={`/dang-nhap?returnUrl=${encodeURIComponent(returnUrl)}`} replace />;
  }

  // Check if user's system role is in the allowed list
  const userRole = state.user.systemRole || 'candidate';
  if (!allowedRoles.includes(userRole)) {
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
};

/**
 * useAuth Hook
 *
 * Convenience hook for auth-related functionality
 * Wraps useApp and exposes only auth-related state and functions
 */

import { useApp } from '../app/contexts/AppContext';
import type { SystemRole } from '../lib/auth/jwtDecode';

export const useAuth = () => {
  const {
    state,
    login,
    logout,
    signup,
    googleLogin,
    verifyEmail,
    resendVerificationEmail,
  } = useApp();

  const systemRole: SystemRole = state.user?.systemRole || 'user';

  return {
    // Auth state
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    user: state.user,
    accessToken: state.accessToken,
    refreshToken: state.refreshToken,
    accessTokenExpiry: state.accessTokenExpiry,
    refreshTokenExpiry: state.refreshTokenExpiry,

    // System role (decoded from JWT)
    systemRole,
    /** True if user has 'admin' role */
    isAdmin: systemRole === 'admin',
    /** True if user has 'support' role */
    isSupport: systemRole === 'support',
    /** True if user has 'admin' or 'support' role (matches backend AdminOrSupport policy) */
    isAdminOrSupport: systemRole === 'admin' || systemRole === 'support',

    // Auth actions
    login,
    logout,
    signup,
    googleLogin,
    verifyEmail,
    resendVerificationEmail,
  };
};

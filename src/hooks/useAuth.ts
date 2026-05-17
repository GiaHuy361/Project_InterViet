/**
 * useAuth Hook
 *
 * Convenience hook for auth-related functionality
 * Wraps useApp and exposes only auth-related state and functions
 */

import { useApp } from '../app/contexts/AppContext';

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

  return {
    // Auth state
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    user: state.user,
    accessToken: state.accessToken,
    refreshToken: state.refreshToken,
    accessTokenExpiry: state.accessTokenExpiry,
    refreshTokenExpiry: state.refreshTokenExpiry,

    // Auth actions
    login,
    logout,
    signup,
    googleLogin,
    verifyEmail,
    resendVerificationEmail,
  };
};

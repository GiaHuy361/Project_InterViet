import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { eventTracker } from '../utils/eventTracker';
import { getSubscriptionLimits } from '../utils/subscriptionLimits';
import { apiClient } from '../../lib/api/apiClient';
import * as authService from '../../services/authService';
import type { AuthResponse } from '../../lib/api/apiTypes';
import {
  loadAuthFromStorage,
  saveAuthFromResponse,
  updateEmailVerified,
} from '../../lib/auth/tokenStorage';

export type UserRole = 'visitor' | 'free' | 'trial' | 'premium' | 'expired' | 'cancelled' | 'suspended';
export type SubscriptionPlan = 'free' | 'monthly' | 'quarterly' | 'yearly';
export type PaymentMethod = 'vnpay' | 'momo' | 'credit_card' | 'bank_transfer';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  subscriptionPlan: SubscriptionPlan;
  trialEndsAt?: Date;
  subscriptionEndsAt?: Date;
  cvOptimizations: number;
  cvOptimizationsDaily: number;
  lastCVResetDate?: Date;
  interviewsUsed: number;
  interviewsDaily: number;
  lastInterviewResetDate?: Date;
  mentorSessionsUsed: number;
  mentorSessionsMonthly: number;
  lastMentorResetDate?: Date;
  createdAt: Date;
  verified: boolean;
  paymentMethod?: PaymentMethod;
  ownershipTransfersRemaining?: number; // For yearly plan only
  hasUsedTrial?: boolean; // Track if user has used the 7-day trial (only for yearly plan)
}

export interface AppState {
  // Auth state
  isAuthenticated: boolean;
  isLoading: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  accessTokenExpiry: string | null;
  refreshTokenExpiry: string | null;

  // User data
  user: User | null;

  // App state
  theme: 'light' | 'dark';
  cookiesAccepted: boolean;
  notifications: Notification[];
  cvVersions: CVVersion[];
  interviewReports: InterviewReport[];
}

export interface CVVersion {
  id: string;
  name: string;
  score: number;
  createdAt: Date;
  content: string;
}

export interface InterviewReport {
  id: string;
  position: string;
  level: string;
  type: string;
  score: number;
  createdAt: Date;
  duration: number;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: Date;
}

interface AppContextType {
  state: AppState;
  login: (email: string, password: string, deviceName?: string) => Promise<void>;
  logout: () => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<AuthResponse>;
  googleLogin: (idToken: string, deviceName?: string) => Promise<void>;
  verifyEmail: (token: string) => Promise<void>;
  resendVerificationEmail: (email: string) => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
  toggleTheme: () => void;
  acceptCookies: () => void;
  upgradeToPremium: (plan: SubscriptionPlan, paymentMethod: PaymentMethod) => void;
  startTrial: () => void;
  cancelSubscription: () => void;
  downgradePlan: (newPlan: SubscriptionPlan) => void;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  addCVVersion: (version: Omit<CVVersion, 'id' | 'createdAt'>) => void;
  addInterviewReport: (report: Omit<InterviewReport, 'id' | 'createdAt'>) => void;
  useCVOptimization: () => boolean;
  useInterview: () => boolean;
  useMentorSession: () => boolean;
  canUseMentorSession: () => boolean;
  resetDailyLimits: () => void;
  watchAdForCredit: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY = 'interviet_app_state';

function buildUserFromAuthResponse(response: AuthResponse): User {
  return {
    id: response.userId,
    email: response.email,
    name: response.fullName || response.email.split('@')[0],
    role: response.status as UserRole,
    subscriptionPlan: 'free',
    cvOptimizations: 0,
    cvOptimizationsDaily: 0,
    interviewsUsed: 0,
    interviewsDaily: 0,
    mentorSessionsUsed: 0,
    mentorSessionsMonthly: 0,
    createdAt: new Date(),
    verified: response.emailVerified,
    hasUsedTrial: false,
  };
}

function applyAuthResponseToState(
  response: AuthResponse
): Pick<
  AppState,
  | 'isAuthenticated'
  | 'accessToken'
  | 'refreshToken'
  | 'accessTokenExpiry'
  | 'refreshTokenExpiry'
  | 'user'
> {
  return {
    isAuthenticated: true,
    accessToken: response.accessToken,
    refreshToken: response.refreshToken,
    accessTokenExpiry: response.accessTokenExpiry,
    refreshTokenExpiry: response.refreshTokenExpiry,
    user: buildUserFromAuthResponse(response),
  };
}

const defaultState: AppState = {
  // Auth state
  isAuthenticated: false,
  isLoading: true, // Start with loading to check stored tokens
  accessToken: null,
  refreshToken: null,
  accessTokenExpiry: null,
  refreshTokenExpiry: null,

  // User data
  user: null,

  // App state
  theme: 'light',
  cookiesAccepted: false,
  notifications: [],
  cvVersions: [],
  interviewReports: [],
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Convert date strings back to Date objects
      if (parsed.user) {
        if (parsed.user.trialEndsAt) parsed.user.trialEndsAt = new Date(parsed.user.trialEndsAt);
        if (parsed.user.subscriptionEndsAt) parsed.user.subscriptionEndsAt = new Date(parsed.user.subscriptionEndsAt);
        if (parsed.user.createdAt) parsed.user.createdAt = new Date(parsed.user.createdAt);
        if (parsed.user.lastCVResetDate) parsed.user.lastCVResetDate = new Date(parsed.user.lastCVResetDate);
        if (parsed.user.lastInterviewResetDate) parsed.user.lastInterviewResetDate = new Date(parsed.user.lastInterviewResetDate);
        if (parsed.user.lastMentorResetDate) parsed.user.lastMentorResetDate = new Date(parsed.user.lastMentorResetDate);
      }
      if (parsed.notifications) {
        parsed.notifications = parsed.notifications.map((n: any) => ({
          ...n,
          createdAt: new Date(n.createdAt)
        }));
      }
      if (parsed.cvVersions) {
        parsed.cvVersions = parsed.cvVersions.map((v: any) => ({
          ...v,
          createdAt: new Date(v.createdAt)
        }));
      }
      if (parsed.interviewReports) {
        parsed.interviewReports = parsed.interviewReports.map((r: any) => ({
          ...r,
          createdAt: new Date(r.createdAt)
        }));
      }
      return parsed;
    }
    return defaultState;
  });

  // Persist state to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  // Restore auth from token storage on mount
  useEffect(() => {
    const stored = loadAuthFromStorage();
    const accessToken = apiClient.getAccessToken() || stored.accessToken;
    const refreshToken = apiClient.getRefreshToken() || stored.refreshToken;

    if (accessToken) {
      apiClient.setAuthToken(accessToken, refreshToken || undefined);

      setState(prev => ({
        ...prev,
        isAuthenticated: true,
        isLoading: false,
        accessToken,
        refreshToken,
        accessTokenExpiry: stored.accessTokenExpiry ?? prev.accessTokenExpiry,
        refreshTokenExpiry: stored.refreshTokenExpiry ?? prev.refreshTokenExpiry,
        user:
          stored.authUser && !prev.user
            ? {
                id: stored.authUser.userId,
                email: stored.authUser.email,
                name: stored.authUser.fullName || stored.authUser.email.split('@')[0],
                role: stored.authUser.status as UserRole,
                subscriptionPlan: 'free',
                cvOptimizations: 0,
                cvOptimizationsDaily: 0,
                interviewsUsed: 0,
                interviewsDaily: 0,
                mentorSessionsUsed: 0,
                mentorSessionsMonthly: 0,
                createdAt: new Date(),
                verified: stored.authUser.emailVerified,
                hasUsedTrial: false,
              }
            : prev.user,
      }));
    } else {
      setState(prev => ({
        ...prev,
        isAuthenticated: false,
        isLoading: false,
      }));
    }
  }, []);

  // Redirect to login when refresh fails
  useEffect(() => {
    apiClient.setAuthFailureHandler(() => {
      setState(prev => ({
        ...prev,
        isAuthenticated: false,
        isLoading: false,
        accessToken: null,
        refreshToken: null,
        accessTokenExpiry: null,
        refreshTokenExpiry: null,
        user: null,
      }));

      const loginPath = '/dang-nhap';
      if (!window.location.pathname.startsWith(loginPath) &&
          !window.location.pathname.startsWith('/login')) {
        const returnUrl = encodeURIComponent(
          window.location.pathname + window.location.search
        );
        window.location.href = `${loginPath}?returnUrl=${returnUrl}`;
      }
    });

    return () => apiClient.setAuthFailureHandler(null);
  }, []);

  // Check subscription expiry
  useEffect(() => {
    if (state.user && state.user.role === 'trial' && state.user.trialEndsAt) {
      if (new Date() > state.user.trialEndsAt) {
        setState(prev => ({
          ...prev,
          user: prev.user ? {
            ...prev.user,
            role: 'free',
            // Keep hasUsedTrial flag to prevent re-using trial
          } : null
        }));
      }
    }
    if (state.user && state.user.role === 'cancelled' && state.user.subscriptionEndsAt) {
      if (new Date() > state.user.subscriptionEndsAt) {
        setState(prev => ({
          ...prev,
          user: prev.user ? { ...prev.user, role: 'expired' } : null
        }));
      }
    }
  }, [state.user]);

  const login = async (email: string, password: string, deviceName?: string): Promise<void> => {
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const response: AuthResponse = await authService.login({ email, password, deviceName });

      apiClient.setAuthToken(response.accessToken, response.refreshToken);
      saveAuthFromResponse(response);

      setState(prev => ({
        ...prev,
        isLoading: false,
        ...applyAuthResponseToState(response),
      }));

      eventTracker.track('login', { email });
    } catch (error) {
      // Reset loading state on error
      setState(prev => ({ ...prev, isLoading: false }));

      // Re-throw error for UI to handle
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    const refreshToken = state.refreshToken;

    try {
      // Call logout API
      if (refreshToken) {
        await authService.logout({ refreshToken });
      }
    } catch (error) {
      // Ignore logout errors - clear local state anyway
      console.warn('Logout API failed:', error);
    } finally {
      // Clear tokens from apiClient
      apiClient.clearAuthToken();

      // Clear auth state
      setState(prev => ({
        ...prev,
        isAuthenticated: false,
        isLoading: false,
        accessToken: null,
        refreshToken: null,
        accessTokenExpiry: null,
        refreshTokenExpiry: null,
        user: null,
      }));

      eventTracker.track('logout');
    }
  };

  const googleLogin = async (idToken: string, deviceName?: string): Promise<void> => {
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const response: AuthResponse = await authService.googleLogin({ idToken, deviceName });

      apiClient.setAuthToken(response.accessToken, response.refreshToken);
      saveAuthFromResponse(response);

      setState(prev => ({
        ...prev,
        isLoading: false,
        ...applyAuthResponseToState(response),
      }));

      eventTracker.track('google_login', { email: response.email });
    } catch (error) {
      // Reset loading state on error
      setState(prev => ({ ...prev, isLoading: false }));

      // Re-throw error for UI to handle
      throw error;
    }
  };

  const signup = async (email: string, password: string, name: string): Promise<AuthResponse> => {
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const response: AuthResponse = await authService.register({
        fullName: name,
        email,
        password,
      });

      apiClient.setAuthToken(response.accessToken, response.refreshToken);
      saveAuthFromResponse(response);

      setState(prev => ({
        ...prev,
        isLoading: false,
        ...applyAuthResponseToState(response),
      }));

      eventTracker.track('signup_complete', { email, name });

      // Return response for caller to check emailVerified
      return response;
    } catch (error) {
      // Reset loading state on error
      setState(prev => ({ ...prev, isLoading: false }));

      // Re-throw error for UI to handle
      throw error;
    }
  };

  const verifyEmail = async (token: string): Promise<void> => {
    await authService.verifyEmail({ token });

    updateEmailVerified(true);

    setState(prev => ({
      ...prev,
      user: prev.user ? { ...prev.user, verified: true } : null,
    }));

    eventTracker.track('email_verified');
  };

  const resendVerificationEmail = async (email: string): Promise<void> => {
    await authService.resendVerificationEmail({ email });
  };

  const updateUser = (updates: Partial<User>) => {
    setState(prev => ({
      ...prev,
      user: prev.user ? { ...prev.user, ...updates } : null
    }));
  };

  const toggleTheme = () => {
    setState(prev => ({
      ...prev,
      theme: prev.theme === 'light' ? 'dark' : 'light'
    }));
  };

  const acceptCookies = () => {
    setState(prev => ({ ...prev, cookiesAccepted: true }));
  };

  const upgradeToPremium = (plan: SubscriptionPlan, paymentMethod: PaymentMethod) => {
    setState(prev => ({
      ...prev,
      user: prev.user ? { 
        ...prev.user, 
        role: 'premium',
        subscriptionPlan: plan,
        paymentMethod: paymentMethod,
        subscriptionEndsAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
      } : null
    }));
    eventTracker.track('upgrade_success', { plan: 'premium' });
  };

  const startTrial = () => {
    const trialEndDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    setState(prev => ({
      ...prev,
      user: prev.user ? {
        ...prev.user,
        role: 'trial',
        trialEndsAt: trialEndDate,
        hasUsedTrial: true
      } : null
    }));

    eventTracker.track('trial_started');

    // Show toast notification
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('toast', {
        detail: {
          type: 'success',
          message: 'Bắt đầu dùng thử Gói Năm 7 ngày!'
        }
      });
      window.dispatchEvent(event);
    }
  };

  const cancelSubscription = () => {
    setState(prev => ({
      ...prev,
      user: prev.user ? { 
        ...prev.user, 
        role: 'cancelled'
      } : null
    }));
  };

  const downgradePlan = (newPlan: SubscriptionPlan) => {
    setState(prev => ({
      ...prev,
      user: prev.user ? { 
        ...prev.user, 
        role: 'free',
        subscriptionPlan: newPlan,
        subscriptionEndsAt: null
      } : null
    }));
  };

  const addNotification = (notification: Omit<Notification, 'id' | 'createdAt'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
    };
    setState(prev => ({
      ...prev,
      notifications: [newNotification, ...prev.notifications]
    }));
  };

  const markNotificationRead = (id: string) => {
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.map(n => 
        n.id === id ? { ...n, read: true } : n
      )
    }));
  };

  const markAllNotificationsRead = () => {
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.map(n => ({ ...n, read: true }))
    }));
  };

  const addCVVersion = (version: Omit<CVVersion, 'id' | 'createdAt'>) => {
    const newVersion: CVVersion = {
      ...version,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
    };
    setState(prev => ({
      ...prev,
      cvVersions: [newVersion, ...prev.cvVersions]
    }));
    eventTracker.track('cv_upload', { score: version.score });
  };

  const addInterviewReport = (report: Omit<InterviewReport, 'id' | 'createdAt'>) => {
    const newReport: InterviewReport = {
      ...report,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
    };
    setState(prev => ({
      ...prev,
      interviewReports: [newReport, ...prev.interviewReports]
    }));
    eventTracker.track('interview_end', { position: report.position, score: report.score });
  };

  const useCVOptimization = (): boolean => {
    if (!state.user) return false;
    
    const limits = getSubscriptionLimits(state.user.subscriptionPlan);
    
    // Unlimited plans
    if (limits.cvOptimizationsDaily === 'unlimited') {
      setState(prev => ({
        ...prev,
        user: prev.user ? { 
          ...prev.user, 
          cvOptimizations: prev.user.cvOptimizations + 1
        } : null
      }));
      eventTracker.track('cv_optimize', { role: state.user.role, plan: state.user.subscriptionPlan });
      return true;
    }
    
    // Check if user has reached daily limit
    if (state.user.cvOptimizationsDaily >= limits.cvOptimizationsDaily) {
      return false;
    }
    
    setState(prev => ({
      ...prev,
      user: prev.user ? { 
        ...prev.user, 
        cvOptimizations: prev.user.cvOptimizations + 1,
        cvOptimizationsDaily: prev.user.cvOptimizationsDaily + 1
      } : null
    }));
    eventTracker.track('cv_optimize', { count: state.user.cvOptimizations + 1, plan: state.user.subscriptionPlan });
    return true;
  };

  const useInterview = (): boolean => {
    if (!state.user) return false;
    
    const limits = getSubscriptionLimits(state.user.subscriptionPlan);
    
    // Unlimited plans
    if (limits.interviewsDaily === 'unlimited') {
      setState(prev => ({
        ...prev,
        user: prev.user ? { 
          ...prev.user, 
          interviewsUsed: prev.user.interviewsUsed + 1
        } : null
      }));
      eventTracker.track('interview_start', { role: state.user.role, plan: state.user.subscriptionPlan });
      return true;
    }
    
    // Check if user has reached daily limit
    if (state.user.interviewsDaily >= limits.interviewsDaily) {
      return false;
    }
    
    setState(prev => ({
      ...prev,
      user: prev.user ? { 
        ...prev.user, 
        interviewsUsed: prev.user.interviewsUsed + 1,
        interviewsDaily: prev.user.interviewsDaily + 1
      } : null
    }));
    eventTracker.track('interview_start', { count: state.user.interviewsUsed + 1, plan: state.user.subscriptionPlan });
    return true;
  };

  const useMentorSession = (): boolean => {
    if (!state.user) return false;
    
    const limits = getSubscriptionLimits(state.user.subscriptionPlan);
    
    // Check if user has reached monthly limit
    if (state.user.mentorSessionsMonthly >= limits.mentorSessionsMonthly) {
      return false;
    }
    
    setState(prev => ({
      ...prev,
      user: prev.user ? { 
        ...prev.user, 
        mentorSessionsUsed: prev.user.mentorSessionsUsed + 1,
        mentorSessionsMonthly: prev.user.mentorSessionsMonthly + 1
      } : null
    }));
    eventTracker.track('mentor_session_start', { count: state.user.mentorSessionsUsed + 1, plan: state.user.subscriptionPlan });
    return true;
  };

  const canUseMentorSession = (): boolean => {
    if (!state.user) return false;
    
    const limits = getSubscriptionLimits(state.user.subscriptionPlan);
    
    return state.user.mentorSessionsMonthly < limits.mentorSessionsMonthly;
  };

  const resetDailyLimits = () => {
    if (!state.user) return;
    const now = new Date();
    const lastCVResetDate = state.user.lastCVResetDate || new Date(0);
    const lastInterviewResetDate = state.user.lastInterviewResetDate || new Date(0);
    const lastMentorResetDate = state.user.lastMentorResetDate || new Date(0);

    const isCVResetNeeded = now.getDate() !== lastCVResetDate.getDate() || now.getMonth() !== lastCVResetDate.getMonth() || now.getFullYear() !== lastCVResetDate.getFullYear();
    const isInterviewResetNeeded = now.getDate() !== lastInterviewResetDate.getDate() || now.getMonth() !== lastInterviewResetDate.getMonth() || now.getFullYear() !== lastInterviewResetDate.getFullYear();
    // Mentor sessions reset monthly, not daily
    const isMentorResetNeeded = now.getMonth() !== lastMentorResetDate.getMonth() || now.getFullYear() !== lastMentorResetDate.getFullYear();

    if (isCVResetNeeded || isInterviewResetNeeded || isMentorResetNeeded) {
      setState(prev => ({
        ...prev,
        user: prev.user ? { 
          ...prev.user, 
          cvOptimizationsDaily: isCVResetNeeded ? 0 : prev.user.cvOptimizationsDaily,
          interviewsDaily: isInterviewResetNeeded ? 0 : prev.user.interviewsDaily,
          mentorSessionsMonthly: isMentorResetNeeded ? 0 : prev.user.mentorSessionsMonthly,
          lastCVResetDate: isCVResetNeeded ? now : prev.user.lastCVResetDate,
          lastInterviewResetDate: isInterviewResetNeeded ? now : prev.user.lastInterviewResetDate,
          lastMentorResetDate: isMentorResetNeeded ? now : prev.user.lastMentorResetDate,
        } : null
      }));
    }
  };

  const watchAdForCredit = () => {
    if (!state.user) return;
    
    // Only free users can watch ads for credits
    if (state.user.role !== 'free') return;
    
    const limits = getSubscriptionLimits(state.user.subscriptionPlan);
    if (limits.cvOptimizationsDaily === 'unlimited') return;
    
    // Add 1 more CV optimization to their quota
    // Note: cvOptimizationsDaily is the count of optimizations used today
    // We decrease the counter by 1 to give them 1 more optimization attempt
    setState(prev => ({
      ...prev,
      user: prev.user ? { 
        ...prev.user, 
        // Decrease the daily count by 1 to give them 1 more optimization attempt
        cvOptimizationsDaily: Math.max(0, prev.user.cvOptimizationsDaily - 1)
      } : null
    }));
    
    eventTracker.track('ad_watched_for_credit', { 
      plan: state.user.subscriptionPlan,
      previousCount: state.user.cvOptimizationsDaily 
    });
    
    // Add notification
    addNotification({
      title: 'Đã nhận thưởng!',
      message: 'Bạn đã nhận thêm 1 lượt tối ưu CV từ việc xem quảng cáo',
      type: 'success',
      read: false,
    });
  };

  return (
    <AppContext.Provider value={{
      state,
      login,
      logout,
      signup,
      googleLogin,
      verifyEmail,
      resendVerificationEmail,
      updateUser,
      toggleTheme,
      acceptCookies,
      upgradeToPremium,
      startTrial,
      cancelSubscription,
      downgradePlan,
      addNotification,
      markNotificationRead,
      markAllNotificationsRead,
      addCVVersion,
      addInterviewReport,
      useCVOptimization,
      useInterview,
      useMentorSession,
      canUseMentorSession,
      resetDailyLimits,
      watchAdForCredit,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};
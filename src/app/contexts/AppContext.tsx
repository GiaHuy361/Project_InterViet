import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { eventTracker } from '../utils/eventTracker';
import { getSubscriptionLimits } from '../utils/subscriptionLimits';
import { apiClient } from '../../lib/api/apiClient';
import { ApiError } from '../../lib/api/apiError';
import * as authService from '../../services/authService';
import { notificationService } from '../../services/notificationService';
import type { AuthResponse } from '../../lib/api/apiTypes';
import {
  loadAuthFromStorage,
  saveAuthFromResponse,
  updateEmailVerified,
} from '../../lib/auth/tokenStorage';
import { getRoleFromToken } from '../../lib/auth/jwtDecode';
import type { SystemRole } from '../../lib/auth/jwtDecode';

export type UserRole = 'visitor' | 'free' | 'trial' | 'premium' | 'expired' | 'cancelled' | 'suspended';
export type SubscriptionPlan = 'free' | 'monthly' | 'quarterly' | 'yearly';
export type PaymentMethod = 'vnpay' | 'momo' | 'credit_card' | 'bank_transfer';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  /** System role decoded from JWT: 'user' | 'support' | 'admin' */
  systemRole: SystemRole;
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
  unreadCount: number;
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
  actionUrl?: string;
  metadata?: Record<string, unknown>;
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
  syncNotifications: () => Promise<void>;
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
  // Decode JWT to extract system role (user/support/admin)
  const systemRole = getRoleFromToken(response.accessToken);

  return {
    id: response.userId,
    email: response.email,
    name: response.fullName || response.email.split('@')[0],
    role: response.status as UserRole,
    systemRole,
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

function mapBackendNotificationType(type?: string): Notification['type'] {
  const normalized = (type || '').toLowerCase();

  if (normalized.includes('success') || normalized.includes('completed') || normalized.includes('ready')) {
    return 'success';
  }

  if (normalized.includes('warning') || normalized.includes('expired') || normalized.includes('limit')) {
    return 'warning';
  }

  if (normalized.includes('error') || normalized.includes('failed')) {
    return 'error';
  }

  return 'info';
}

function mergeNotifications(existing: Notification[], incoming: Notification[]): Notification[] {
  // Do not merge local and incoming notifications. Treat backend as source of truth
  // and replace the local list with the incoming list (sorted newest first).
  return [...(incoming || [])].sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime());
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
  unreadCount: 0,
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
        parsed.unreadCount = parsed.notifications.filter((n: any) => !n.read).length;
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
  const notificationPollTimerRef = useRef<number | null>(null);

  const setNotificationsInState = (notifications: Notification[]) => {
    setState(prev => ({
      ...prev,
      notifications,
      // compute unread count
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      unreadCount: notifications.filter(n => !n.read).length,
    }));
  };

  // Persist state to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);


  useEffect(() => {
    if (!state.isAuthenticated || !state.accessToken) {
      if (notificationPollTimerRef.current) {
        window.clearInterval(notificationPollTimerRef.current);
        notificationPollTimerRef.current = null;
      }
      return;
    }

    let cancelled = false;

    const syncNotificationSnapshot = async () => {
      try {
        const [listResponse, unreadResponse] = await Promise.all([
          notificationService.listNotifications({ page: 1, pageSize: 50 }),
          notificationService.getUnreadCount(),
        ]);
        if (cancelled) return;

        const backendNotifications: Notification[] = (listResponse.items || []).map((item) => ({
          id: item.id,
          title: item.title,
          message: item.message,
          type: mapBackendNotificationType(item.type || item.priority),
          read: Boolean(item.isRead),
          createdAt: new Date(item.createdAt),
          actionUrl: item.actionUrl ?? undefined,
          metadata: item.data ?? undefined,
        }));

        setNotificationsInState(mergeNotifications(state.notifications, backendNotifications));
        setState((prev) => ({
          ...prev,
          unreadCount: unreadResponse.unreadCount ?? backendNotifications.filter((notification) => !notification.read).length,
        }));
      } catch (error) {
        if (cancelled) return;
        if (error instanceof ApiError) return;
      }
    };

    const pollUnreadCount = async () => {
      try {
        const unreadResponse = await notificationService.getUnreadCount();
        if (cancelled) return;
        setState((prev) => ({ ...prev, unreadCount: unreadResponse.unreadCount ?? 0 }));
      } catch (error) {
        if (cancelled) return;
        if (error instanceof ApiError && error.status === 401) {
          if (notificationPollTimerRef.current) {
            window.clearInterval(notificationPollTimerRef.current);
            notificationPollTimerRef.current = null;
          }
          apiClient.clearAuthToken();
          setState((prev) => ({
            ...prev,
            isAuthenticated: false,
            accessToken: null,
            refreshToken: null,
            accessTokenExpiry: null,
            refreshTokenExpiry: null,
            user: null,
            unreadCount: 0,
            notifications: [],
          }));
          window.location.href = '/login';
        }
      }
    };

    const schedulePolling = () => {
      if (notificationPollTimerRef.current) {
        window.clearInterval(notificationPollTimerRef.current);
      }
      const intervalMs = document.visibilityState === 'hidden' ? 120000 : 45000;
      notificationPollTimerRef.current = window.setInterval(() => {
        void pollUnreadCount();
      }, intervalMs);
    };

    void syncNotificationSnapshot();
    void pollUnreadCount();
    schedulePolling();

    const handleVisibilityChange = () => {
      schedulePolling();
      if (document.visibilityState === 'visible') {
        void pollUnreadCount();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (notificationPollTimerRef.current) {
        window.clearInterval(notificationPollTimerRef.current);
        notificationPollTimerRef.current = null;
      }
    };
  }, [state.isAuthenticated, state.accessToken]);

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
                systemRole: stored.authUser.systemRole || (accessToken ? getRoleFromToken(accessToken) : 'user'),
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
        subscriptionEndsAt: undefined
      } : null
    }));
  };

  const addNotification = (notification: Omit<Notification, 'id' | 'createdAt'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
    };
    setState(prev => {
      const newNotifications = [newNotification, ...prev.notifications];
      return {
        ...prev,
        notifications: newNotifications,
        unreadCount: newNotifications.filter(n => !n.read).length,
      };
    });
  };

  const syncNotifications = async () => {
    if (!state.isAuthenticated || !state.accessToken) return;
    try {
      const response = await notificationService.listNotifications({ page: 1, pageSize: 50 });
      const backendNotifications: Notification[] = (response.items || []).map((item) => ({
        id: item.id,
        title: item.title,
        message: item.message,
        type: mapBackendNotificationType(item.type || item.priority),
        read: Boolean(item.isRead),
        createdAt: new Date(item.createdAt),
        actionUrl: item.actionUrl ?? undefined,
        metadata: item.data ?? undefined,
      }));

      setNotificationsInState(backendNotifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
    } catch (err) {
      // ignore sync errors
    }
  };

  

  const markNotificationRead = (id: string) => {
    setState(prev => {
      const newNotifications = prev.notifications.map(n => n.id === id ? { ...n, read: true } : n);
      return {
        ...prev,
        notifications: newNotifications,
        unreadCount: newNotifications.filter(n => !n.read).length,
      };
    });
  };

  const markAllNotificationsRead = () => {
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.map(n => ({ ...n, read: true })),
      unreadCount: 0,
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
      syncNotifications,
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
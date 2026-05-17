import { createBrowserRouter } from 'react-router';

// Layouts
import { RootLayout } from './layouts/RootLayout';
import { PublicLayout } from './layouts/PublicLayout';
import { AuthLayout } from './layouts/AuthLayout';
import { AppLayout } from './layouts/AppLayout';

// Route guards
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { PublicOnlyRoute } from './components/auth/PublicOnlyRoute';

// Import all pages from index
import * as Pages from './pages';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: RootLayout,
    children: [
      {
        path: '/',
        Component: PublicLayout,
        children: [
          { index: true, Component: Pages.HomePage },
          { path: 'tinh-nang', Component: Pages.FeaturesPage },
          { path: 'giai-phap', Component: Pages.SolutionsPage },
          { path: 'bang-gia', Component: Pages.PricingPage },
          { path: 'blog', Component: Pages.BlogPage },
          { path: 'blog/:slug', Component: Pages.BlogPostPage },
          { path: 'faq', Component: Pages.FAQPage },
          { path: 've-chung-toi', Component: Pages.AboutPage },
          { path: 'lien-he', Component: Pages.ContactPage },
          { path: 'ho-tro', Component: Pages.SupportPage },
          { path: 'bao-mat', Component: Pages.SecurityPage },
          { path: 'dieu-khoan', Component: Pages.TermsPage },
          { path: 'chinh-sach-bao-mat', Component: Pages.PrivacyPage },
          { path: 'he-thong', Component: Pages.StatusPage },
          { path: 'bao-tri', Component: Pages.MaintenancePage },
        ],
      },
      {
        path: '/',
        Component: AuthLayout,
        children: [
          {
            path: 'dang-nhap',
            element: (
              <PublicOnlyRoute>
                <Pages.LoginPage />
              </PublicOnlyRoute>
            ),
          },
          {
            path: 'login',
            element: (
              <PublicOnlyRoute>
                <Pages.LoginPage />
              </PublicOnlyRoute>
            ),
          },
          {
            path: 'dang-ky',
            element: (
              <PublicOnlyRoute>
                <Pages.SignupPage />
              </PublicOnlyRoute>
            ),
          },
          {
            path: 'register',
            element: (
              <PublicOnlyRoute>
                <Pages.SignupPage />
              </PublicOnlyRoute>
            ),
          },
          { path: 'xac-minh-email', Component: Pages.VerifyEmailPage },
          { path: 'quen-mat-khau', Component: Pages.ForgotPasswordPage },
          { path: 'dat-lai-mat-khau', Component: Pages.ResetPasswordPage },
          { path: 'tai-khoan-bi-khoa', Component: Pages.AccountLockedPage },
          // English aliases for consistency
          { path: 'verify-email', Component: Pages.VerifyEmailPage },
          { path: 'forgot-password', Component: Pages.ForgotPasswordPage },
          { path: 'reset-password', Component: Pages.ResetPasswordPage },
        ],
      },
      {
        path: '/',
        element: (
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        ),
        children: [
          { path: 'onboarding', Component: Pages.OnboardingPage },
          { path: 'dashboard', Component: Pages.DashboardPage },
          { path: 'cv-matching', Component: Pages.CVMatchingPage },
          { path: 'cv-history', Component: Pages.CVHistoryPage },
          { path: 'multi-jd-matching', Component: Pages.MultiJDMatchingPage },
          { path: 'network', Component: Pages.NetworkPage },
          { path: 'network/:id', Component: Pages.NetworkProfilePage },
          { path: 'phong-van-setup', Component: Pages.InterviewSetupPage },
          { path: 'phong-van-pre-call', Component: Pages.InterviewPreCallPage },
          { path: 'phong-van-live', Component: Pages.InterviewLivePage },
          { path: 'phong-van-report/:id', Component: Pages.InterviewReportPage },
          { path: 'bao-cao', Component: Pages.ReportsPage },
          { path: 'thong-bao', Component: Pages.NotificationsPage },
          { path: 'tro-giup', Component: Pages.HelpCenterPage },
          { path: 'cai-dat', Component: Pages.ProfilePage },
          { path: 'goi-dich-vu', Component: Pages.CandidateSubscriptionPage },
          { path: 'thanh-toan', Component: Pages.BillingPage },
          { path: 'hoa-don', Component: Pages.InvoicesPage },
          { path: 'email', Component: Pages.EmailCenterPage },
          { path: 'hoat-dong', Component: Pages.ActivityLogPage },
          { path: 'het-han', Component: Pages.SubscriptionExpiredPage },
          { path: 'huy-goi', Component: Pages.CancelSubscriptionPage },

          // System management
          { path: 'system/data', Component: Pages.DataManagementPage },
        ],
      },
      {
        path: '*',
        Component: Pages.NotFoundPage,
      },
    ],
  },
]);
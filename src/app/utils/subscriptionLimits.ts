import type { SubscriptionPlan } from '../contexts/AppContext';

export interface SubscriptionLimits {
  cvOptimizationsDaily: number | 'unlimited';
  interviewsDaily: number | 'unlimited';
  mentorSessionsMonthly: number;
  canExportPDF: boolean;
  canShareReport: boolean;
  canAccessAdvancedAnalytics: boolean;
  canAccessCareerAdvancement: boolean;
  aiModel: 'basic' | 'stable' | 'premium';
  supportLevel: 'email' | 'priority' | 'priority_24_7';
}

export const getSubscriptionLimits = (plan: SubscriptionPlan): SubscriptionLimits => {
  switch (plan) {
    case 'free':
      return {
        cvOptimizationsDaily: 3,
        interviewsDaily: 1,
        mentorSessionsMonthly: 0,
        canExportPDF: false,
        canShareReport: false,
        canAccessAdvancedAnalytics: false,
        canAccessCareerAdvancement: false,
        aiModel: 'basic',
        supportLevel: 'email',
      };

    case 'monthly':
      return {
        cvOptimizationsDaily: 3,
        interviewsDaily: 1,
        mentorSessionsMonthly: 0,
        canExportPDF: true,
        canShareReport: true,
        canAccessAdvancedAnalytics: true,
        canAccessCareerAdvancement: false,
        aiModel: 'stable',
        supportLevel: 'email',
      };

    case 'quarterly':
      return {
        cvOptimizationsDaily: 5,
        interviewsDaily: 3,
        mentorSessionsMonthly: 3,
        canExportPDF: true,
        canShareReport: true,
        canAccessAdvancedAnalytics: true,
        canAccessCareerAdvancement: false,
        aiModel: 'premium',
        supportLevel: 'priority',
      };

    case 'yearly':
      return {
        cvOptimizationsDaily: 'unlimited',
        interviewsDaily: 'unlimited',
        mentorSessionsMonthly: 4, // ~1 per week
        canExportPDF: true,
        canShareReport: true,
        canAccessAdvancedAnalytics: true,
        canAccessCareerAdvancement: true,
        aiModel: 'premium',
        supportLevel: 'priority_24_7',
      };

    default:
      return getSubscriptionLimits('free');
  }
};

export const canPerformAction = (
  plan: SubscriptionPlan,
  action: 'cv' | 'interview' | 'mentor' | 'export_pdf' | 'share' | 'analytics' | 'career_advancement',
  currentUsage?: {
    cvOptimizationsDaily?: number;
    interviewsDaily?: number;
    mentorSessionsMonthly?: number;
  }
): boolean => {
  const limits = getSubscriptionLimits(plan);

  switch (action) {
    case 'cv':
      if (limits.cvOptimizationsDaily === 'unlimited') return true;
      return (currentUsage?.cvOptimizationsDaily || 0) < limits.cvOptimizationsDaily;

    case 'interview':
      if (limits.interviewsDaily === 'unlimited') return true;
      return (currentUsage?.interviewsDaily || 0) < limits.interviewsDaily;

    case 'mentor':
      return (currentUsage?.mentorSessionsMonthly || 0) < limits.mentorSessionsMonthly;

    case 'export_pdf':
      return limits.canExportPDF;

    case 'share':
      return limits.canShareReport;

    case 'analytics':
      return limits.canAccessAdvancedAnalytics;

    case 'career_advancement':
      return limits.canAccessCareerAdvancement;

    default:
      return false;
  }
};

export const getPlanPriceInfo = (plan: SubscriptionPlan) => {
  switch (plan) {
    case 'free':
      return {
        name: 'Miễn phí',
        priceMonthly: 0,
        totalPrice: 0,
        billingCycle: 'miễn phí',
        savings: 0,
      };
    case 'monthly':
      return {
        name: 'Gói Tháng',
        priceMonthly: 149000,
        totalPrice: 149000,
        billingCycle: '1 tháng',
        savings: 0,
      };
    case 'quarterly':
      return {
        name: 'Gói Quý',
        priceMonthly: 129000,
        totalPrice: 387000,
        billingCycle: '3 tháng',
        savings: 60000, // 149k*3 - 387k = 60k
      };
    case 'yearly':
      return {
        name: 'Gói Năm',
        priceMonthly: 109000,
        totalPrice: 1308000,
        billingCycle: '12 tháng',
        savings: 480000, // 149k*12 - 1308k = 480k
      };
    default:
      return getPlanPriceInfo('free');
  }
};

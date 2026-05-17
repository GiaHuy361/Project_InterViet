/**
 * INTER-VIET Candidate Pricing Configuration
 * 
 * This is the SINGLE SOURCE OF TRUTH for all pricing-related data.
 * All pages (PricingPage, SubscriptionPage, BillingPage, modals) must import from this file.
 * 
 * DO NOT duplicate pricing data elsewhere.
 */

export interface PlanFeature {
  text: string;
  highlighted?: boolean;
}

export interface PlanConfig {
  id: 'free' | 'monthly' | 'quarterly' | 'yearly';
  name: string;
  price: number;
  originalPrice?: number;
  totalPrice?: number;
  cycle: string;
  duration?: string;
  description: string;
  badge?: string;
  badgeColor?: string;
  features: string[];
  limitations?: string[];
  popular?: boolean;
  savings?: string;
  savingsAmount?: number;
}

export const CANDIDATE_PLANS: Record<string, PlanConfig> = {
  free: {
    id: 'free',
    name: 'Miễn phí',
    price: 0,
    cycle: 'tháng',
    description: 'Dùng thử các tính năng cơ bản',
    features: [
      '3 lần/tài khoản tối ưu CV miễn phí',
      'Xem quảng cáo để thêm lượt',
      '1 phiên/tài khoản phỏng vấn AI',
      'Model AI basic',
      'Báo cáo rút gọn',
      'Hỗ trợ qua email',
    ],
    limitations: [
      'Không xuất PDF',
      'Không phân tích kỹ năng giao tiếp',
      'Không so sánh benchmark ngành',
    ],
  },
  
  monthly: {
    id: 'monthly',
    name: 'Gói Tháng',
    price: 149000,
    totalPrice: 149000,
    cycle: 'tháng',
    duration: '1 tháng',
    description: 'Dành cho ứng viên cần luyện tập gấp rút trước kỳ phỏng vấn sắp tới',
    features: [
      '3 lần/ngày tối ưu CV',
      '1 lần/ngày phỏng vấn AI',
      'Đầy đủ 6 phong cách AI interviewer & stress-test',
      'Model AI ổn định',
      'Báo cáo phân tích toàn diện',
      'Phân tích kỹ năng giao tiếp',
      'Xuất PDF',
      'So sánh tiến bộ',
      'So sánh benchmark ngành',
    ],
    limitations: [
      'Không bao gồm phỏng vấn với người thật',
    ],
  },
  
  quarterly: {
    id: 'quarterly',
    name: 'Gói Quý',
    price: 129000,
    totalPrice: 387000,
    cycle: 'tháng',
    duration: '3 tháng',
    description: 'Dành cho sinh viên hoặc người đang trong giai đoạn tìm việc tích cực từ 1-3 tháng',
    badge: 'PHỔ BIẾN NHẤT',
    badgeColor: 'bg-gradient-to-r from-purple-600 to-blue-600',
    popular: true,
    savings: 'Thanh toán 387.000₫/3 tháng',
    savingsAmount: 60000,
    features: [
      '5 lần/ngày tối ưu CV',
      '3 lần/ngày phỏng vấn AI',
      'Đầy đủ 6 phong cách AI interviewer & stress-test',
      'Model AI cao cấp',
      'Báo cáo phân tích toàn diện',
      'Phân tích kỹ năng giao tiếp',
      'Xuất PDF',
      'So sánh tiến bộ',
      'So sánh benchmark ngành',
      'Phỏng vấn 1-1 với Mentor: 3 lần/tháng',
      'Nhận xét trực tiếp về phong thái và xử lý tình huống',
      'Hỗ trợ ưu tiên',
    ],
    limitations: [],
  },
  
  yearly: {
    id: 'yearly',
    name: 'Gói Năm',
    price: 109000,
    totalPrice: 1308000,
    cycle: 'tháng',
    duration: '12 tháng',
    description: 'Giải pháp đồng hành dài hạn, xây dựng kỹ năng phỏng vấn và nghề nghiệp chuyên sâu',
    badge: 'TIẾT KIỆM NHẤT',
    badgeColor: 'bg-gradient-to-r from-green-600 to-emerald-600',
    popular: false,
    savings: 'Thanh toán 1.308.000₫/năm',
    savingsAmount: 480000,
    features: [
      'Không giới hạn tối ưu CV',
      'Không giới hạn phỏng vấn AI',
      'Đầy đủ 6 phong cách AI interviewer & stress-test',
      'Model AI cao cấp',
      'Báo cáo phân tích toàn diện',
      'Phân tích kỹ năng giao tiếp',
      'Xuất PDF',
      'So sánh tiến bộ',
      'So sánh benchmark ngành',
      'Phỏng vấn 1-1 với Mentor: mỗi tuần 1 lần',
      'Lưu trữ lịch sử, video và tiến trình không giới hạn thời gian',
      'Đồng hành cùng bạn ngay cả sau khi đã nhận việc thành công (tự động update CV dựa theo thành tích, mô phỏng buổi deal lương)',
      'Hỗ trợ ưu tiên 24/7 cấp độ cao nhất',
    ],
    limitations: [],
  },
};

/**
 * Get a summary of key benefits for each plan (used in checkout/billing pages)
 */
export const getPlanBenefitsSummary = (planId: string): string[] => {
  switch (planId) {
    case 'monthly':
      return [
        '3/ngày tối ưu CV',
        '1/ngày phỏng vấn AI',
        'Đầy đủ 6 phong cách AI interviewer',
        'Báo cáo phân tích toàn diện',
      ];
    case 'quarterly':
      return [
        '5/ngày tối ưu CV',
        '3/ngày phỏng vấn AI',
        '3 lần/tháng phỏng vấn Mentor',
        'Hỗ trợ ưu tiên',
      ];
    case 'yearly':
      return [
        'Không giới hạn tất cả tính năng',
        '1 lần/tuần phỏng vấn Mentor',
        'Chọn mentor theo nhóm ngành',
        'Lưu trữ lịch sử không giới hạn thời gian',
        'Hỗ trợ ưu tiên 24/7 cao nhất',
      ];
    default:
      return [];
  }
};

/**
 * Get plan quota limits
 */
export const getPlanQuota = (planId: string): { cv: number | null; interview: number | null } => {
  switch (planId) {
    case 'free':
      return { cv: 3, interview: 1 };
    case 'monthly':
      return { cv: 3, interview: 1 };
    case 'quarterly':
      return { cv: 5, interview: 3 };
    case 'yearly':
      return { cv: null, interview: null }; // null means unlimited
    default:
      return { cv: 0, interview: 0 };
  }
};

/**
 * Get plan short description for dropdowns/cards
 */
export const getPlanShortDescription = (planId: string): string => {
  const plan = CANDIDATE_PLANS[planId];
  if (!plan) return '';
  
  switch (planId) {
    case 'monthly':
      return '3/ngày CV, 1/ngày phỏng vấn AI';
    case 'quarterly':
      return '5/ngày CV, 3/ngày phỏng vấn AI, 3 lần/tháng Mentor';
    case 'yearly':
      return 'Không giới hạn + Mentor 1/tuần + Hỗ trợ 24/7';
    default:
      return plan.description;
  }
};

/**
 * Plan hierarchy for upgrade/downgrade logic
 */
const PLAN_HIERARCHY = {
  free: 0,
  monthly: 1,
  quarterly: 2,
  yearly: 3,
};

export type PlanActionType = 'upgrade' | 'current' | 'downgrade' | 'select';

/**
 * Determine the action type between current plan and target plan
 */
export const getPlanActionType = (currentPlan: string, targetPlan: string): PlanActionType => {
  if (currentPlan === targetPlan) {
    return 'current';
  }
  
  const currentLevel = PLAN_HIERARCHY[currentPlan as keyof typeof PLAN_HIERARCHY] || 0;
  const targetLevel = PLAN_HIERARCHY[targetPlan as keyof typeof PLAN_HIERARCHY] || 0;
  
  if (currentPlan === 'free') {
    return 'select';
  }
  
  if (targetLevel > currentLevel) {
    return 'upgrade';
  }
  
  return 'downgrade';
};

/**
 * Get CTA text based on action type and target plan
 */
export const getPlanCTAText = (actionType: PlanActionType, targetPlanId: string): string => {
  const targetPlan = CANDIDATE_PLANS[targetPlanId];
  
  switch (actionType) {
    case 'current':
      return 'Gói hiện tại';
    case 'upgrade':
      return `Nâng cấp lên ${targetPlan.name}`;
    case 'downgrade':
      return `Chuyển xuống ${targetPlan.name} khi gia hạn`;
    case 'select':
      return `Chọn ${targetPlan.name}`;
    default:
      return 'Chọn gói';
  }
};

/**
 * Get button variant based on action type
 */
export const getPlanCTAVariant = (actionType: PlanActionType, isPopular: boolean): 'default' | 'outline' | 'secondary' => {
  switch (actionType) {
    case 'upgrade':
      return isPopular ? 'default' : 'outline';
    case 'current':
      return 'outline';
    case 'downgrade':
      return 'secondary';
    case 'select':
      return isPopular ? 'default' : 'outline';
    default:
      return 'outline';
  }
};
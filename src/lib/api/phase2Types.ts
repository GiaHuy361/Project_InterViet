/**
 * Phase 2 API types — Dashboard, Profile, Plans, Subscription, Billing
 */

// —— Dashboard ——

export interface DashboardSummaryResponse {
  resumes: {
    total: number;
    parsed: number;
    pending: number;
    failed: number;
    hasActiveResume: boolean;
  };
  jobDescriptions: { total: number };
  matches: {
    total: number;
    completed?: number;
    failed?: number;
    pending?: number;
    bestScore?: number | null;
    averageScore?: number | null;
  };
  profile: {
    hasProfile: boolean;
    hasAvatar: boolean;
    hasWorkExperience: boolean;
    hasEducation: boolean;
    hasSkills: boolean;
  };
  usageToday: {
    resumeActivityCount: number;
    interviewUsed: number;
    matchActivityCount: number;
    mentorBookingUsed: number;
  };
  onboardingSteps: OnboardingStep[];
}

export interface OnboardingStep {
  stepCode: string;
  status: string;
  completedAt?: string | null;
}

export interface ActivityItem {
  id?: string;
  activityType?: string;
  type?: string;
  title?: string;
  message?: string;
  description?: string;
  createdAt?: string;
  resourceType?: string;
  resourceId?: string;
}

export interface ActivityLogResponse {
  items?: ActivityItem[];
  activities?: ActivityItem[];
  totalCount?: number;
  page?: number;
  pageSize?: number;
}

export interface UsageDayEntry {
  date?: string;
  resumeActivityCount?: number;
  interviewUsed?: number;
  matchActivityCount?: number;
  mentorBookingUsed?: number;
}

export interface UsageSummaryResponse {
  items?: UsageDayEntry[];
  days?: UsageDayEntry[];
  from?: string;
  to?: string;
}

export interface QuotaCounter {
  featureKey: string;
  periodType: string;
  periodKey?: string;
  planKey?: string;
  usedValue: number;
  limitValue: number;
  remainingValue: number;
  lastConsumedAt?: string | null;
}

export interface QuotaSnapshotResponse {
  counters: QuotaCounter[];
}

export interface DashboardActivityParams {
  page?: number;
  pageSize?: number;
}

export interface DashboardUsageParams {
  from?: string;
  to?: string;
}

// —— Profile ——

export interface ProfileSkill {
  id: string;
  skillId?: string;
  name?: string;
  skillName?: string;
  category?: string;
  skillCategory?: string;
  level?: string;
  proficiency?: string;
  proficiencyLevel?: string;
}

export interface ProfileEducation {
  id: string;
  schoolName?: string;
  institution?: string;
  degree?: string;
  fieldOfStudy?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
}

export interface ProfileWorkExperience {
  id: string;
  experienceId?: string;
  companyName?: string;
  jobTitle?: string;
  employmentType?: string;
  industry?: string;
  startDate?: string;
  endDate?: string | null;
  isCurrent?: boolean;
  description?: string;
  metricsSummary?: string;
}

export interface ProfileExternalLink {
  id: string;
  platform?: string;
  linkType?: string;
  label?: string;
  title?: string;
  url?: string;
}

export interface ProfileResponse {
  fullName?: string;
  phoneNumber?: string;
  headline?: string;
  summary?: string;
  desiredRole?: string;
  yearsOfExperience?: number;
  currentLocation?: string;
  preferredLocation?: string;
  salaryExpectationMin?: number;
  salaryExpectationMax?: number;
  avatarUrl?: string;
  email?: string;
  skills?: ProfileSkill[];
  educations?: ProfileEducation[];
  experiences?: ProfileWorkExperience[];
  links?: ProfileExternalLink[];
}

export interface UpdateProfileRequest {
  fullName?: string;
  phoneNumber?: string;
  headline?: string;
  summary?: string;
  desiredRole?: string;
  yearsOfExperience?: number;
  currentLocation?: string;
  preferredLocation?: string;
  salaryExpectationMin?: number;
  salaryExpectationMax?: number;
  avatarUrl?: string;
}

export interface AddSkillRequest {
  name?: string;
  skillName: string;
  category?: string;
  skillCategory?: string;
  level?: string;
  proficiency?: string;
  proficiencyLevel?: string;
}

export type UpdateSkillRequest = AddSkillRequest;

export interface AddEducationRequest {
  schoolName?: string;
  institution?: string;
  degree?: string;
  fieldOfStudy?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
}

export type UpdateEducationRequest = AddEducationRequest;

export interface AddWorkExperienceRequest {
  companyName: string;
  jobTitle: string;
  employmentType?: string;
  industry?: string;
  startDate: string;
  endDate?: string | null;
  isCurrent?: boolean;
  description?: string;
  metricsSummary?: string;
  achievements?: string;
}

export type UpdateWorkExperienceRequest = AddWorkExperienceRequest;

export interface AddExternalLinkRequest {
  platform?: string;
  linkType: string;
  label?: string;
  title?: string;
  url: string;
}

export type UpdateExternalLinkRequest = AddExternalLinkRequest;

// —— Plans & Subscription ——

export interface PlanFeature {
  featureKey: string;
  featureValue: string;
  valueType: string;
}

export interface PlanResponse {
  id: string;
  planKey: string;
  name: string;
  description?: string;
  priceAmount: number;
  displayPrice: number;
  currencyCode: string;
  billingCycle: string;
  badge?: string | null;
  trialDays?: number;
  features: PlanFeature[];
}

export interface CurrentSubscription {
  id: string;
  planId: string;
  planName: string;
  planKey?: string;
  status: string;
  currentPeriodStartsAt: string;
  currentPeriodEndsAt: string;
  autoRenewEnabled: boolean;
  cancelAtPeriodEnd: boolean;
}

export interface DevActivatePlanRequest {
  planKey: 'free' | 'monthly' | 'quarterly' | 'yearly';
}

export type InvoiceStub = Record<string, never>;
export type PaymentStub = Record<string, never>;

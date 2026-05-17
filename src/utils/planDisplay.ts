import type { PlanResponse, CurrentSubscription } from '../lib/api/phase2Types';
import {
  CANDIDATE_PLANS,
  type PlanConfig,
  getPlanActionType,
  getPlanCTAText,
  getPlanCTAVariant,
  getPlanQuota,
} from '../app/config/pricing';

export type PlanKey = 'free' | 'monthly' | 'quarterly' | 'yearly';

export type DisplayPlan = PlanConfig & {
  planKey: PlanKey;
  apiId?: string;
  priceFromApi: number;
};

const PLAN_ORDER: PlanKey[] = ['free', 'monthly', 'quarterly', 'yearly'];
const UPGRADE_PLANS: PlanKey[] = ['monthly', 'quarterly', 'yearly'];

export function normalizePlanKey(raw?: string | null): PlanKey | null {
  if (!raw) return null;
  const k = raw.toLowerCase().replace(/\s/g, '');
  if (k === 'free' || k.includes('free')) return 'free';
  if (k === 'monthly' || k === 'month') return 'monthly';
  if (k === 'quarterly' || k === 'quarter') return 'quarterly';
  if (k === 'yearly' || k === 'year') return 'yearly';
  return null;
}

export function resolvePlanKeyFromSubscription(
  subscription: CurrentSubscription | null,
  apiPlans: PlanResponse[]
): PlanKey {
  if (!subscription) return 'free';

  const byId = apiPlans.find((p) => p.id === subscription.planId);
  const fromApi = normalizePlanKey(byId?.planKey);
  if (fromApi) return fromApi;

  const fromSub = normalizePlanKey(subscription.planKey);
  if (fromSub) return fromSub;

  const name = (subscription.planName ?? '').toLowerCase();
  if (name.includes('free') || name.includes('miễn phí')) return 'free';
  if (name.includes('year') || name.includes('năm')) return 'yearly';
  if (name.includes('quarter') || name.includes('quý')) return 'quarterly';
  if (name.includes('month') || name.includes('tháng')) return 'monthly';

  return 'free';
}

export function mergePlansForDisplay(apiPlans: PlanResponse[]): DisplayPlan[] {
  return PLAN_ORDER.map((key) => {
    const config = CANDIDATE_PLANS[key];
    const api = apiPlans.find((p) => normalizePlanKey(p.planKey) === key);
    return {
      ...config,
      planKey: key,
      apiId: api?.id,
      name: api?.name && !api.name.toLowerCase().includes('plan')
        ? api.name
        : config.name,
      description: api?.description?.trim() || config.description,
      priceFromApi: api?.displayPrice ?? api?.priceAmount ?? config.price,
      badge: api?.badge ?? config.badge,
      badgeColor: config.badgeColor,
    };
  });
}

export function getUpgradePlans(displayPlans: DisplayPlan[]): DisplayPlan[] {
  return UPGRADE_PLANS.map((key) => displayPlans.find((p) => p.planKey === key)!);
}

export function getCurrentDisplayPlan(
  displayPlans: DisplayPlan[],
  planKey: PlanKey
): DisplayPlan {
  return displayPlans.find((p) => p.planKey === planKey) ?? displayPlans[0];
}

export function formatPlanPrice(plan: DisplayPlan): string {
  if (plan.priceFromApi <= 0) return '0đ';
  return `${plan.priceFromApi.toLocaleString('vi-VN')}đ`;
}

export { getPlanActionType, getPlanCTAText, getPlanCTAVariant, getPlanQuota };

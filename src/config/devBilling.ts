export const isDevBillingEnabled =
  import.meta.env.VITE_ENABLE_DEV_BILLING === 'true';

export const DEV_PLAN_KEYS = ['free', 'monthly', 'quarterly', 'yearly'] as const;

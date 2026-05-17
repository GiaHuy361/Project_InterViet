const FEATURE_LABELS: Record<string, string> = {
  'interview.ai': 'Phỏng vấn AI',
  'cv.optimization': 'Tối ưu CV',
  'cv.optimize': 'Tối ưu CV',
  'resume.parse': 'Phân tích CV',
  'matching.jd': 'Matching JD',
};

export function getFeatureLabel(featureKey: string): string {
  return FEATURE_LABELS[featureKey] ?? featureKey;
}

export function isUnlimitedLimit(limitValue: number): boolean {
  return limitValue < 0;
}

export function formatQuotaUsed(used: number, limit: number): string {
  if (isUnlimitedLimit(limit)) {
    return `${used} / ∞`;
  }
  return `${used} / ${limit}`;
}

import { apiClient } from '../lib/api/apiClient';
import type { PlanResponse } from '../lib/api/phase2Types';

export async function getPlans(): Promise<PlanResponse[]> {
  return apiClient.get<PlanResponse[]>('/plans', { skipAuth: true });
}

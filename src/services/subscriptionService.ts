import { apiClient } from '../lib/api/apiClient';
import { ApiError } from '../lib/api/apiError';
import type {
  CurrentSubscription,
  DevActivatePlanRequest,
} from '../lib/api/phase2Types';

export async function getCurrentSubscription(): Promise<CurrentSubscription | null> {
  try {
    return await apiClient.get<CurrentSubscription>('/subscription');
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
}

export async function devActivatePlan(
  payload: DevActivatePlanRequest
): Promise<CurrentSubscription> {
  return apiClient.post<CurrentSubscription>(
    '/subscription/dev-activate',
    payload
  );
}

export async function cancelSubscription(): Promise<void> {
  return apiClient.post<void>('/subscription/cancel');
}

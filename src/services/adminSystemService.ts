import { apiClient } from '../lib/api/apiClient';

export interface AdminHealthComponent {
  status: 'Healthy' | 'Degraded' | 'Unavailable' | string;
  details: string;
}

export interface AdminHealthData {
  status: string;
  timestamp: string;
  components: Record<string, AdminHealthComponent>;
}

export interface AdminHealthResponse {
  success: boolean;
  message?: string | null;
  data: AdminHealthData;
  meta?: any;
}

export interface AdminAuditLogRecord {
  id: string;
  actorId?: string | null;
  actorEmail?: string | null;
  actorRole?: string | null;
  action: string;
  resource?: string | null;
  resourceId?: string | null;
  metadataJson?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
}

export interface AdminPaginatedResponse<T> {
  total: number;
  page: number;
  pageSize: number;
  items: T[];
}

export function getAdminHealth(): Promise<AdminHealthResponse> {
  return apiClient.get<AdminHealthResponse>('/admin/health');
}

export interface AdminDevPromoteRequest {
  email: string;
  roleCode: string;
}

export interface AdminDevPromoteData {
  message: string;
  email: string;
  previousRole?: string;
  newRole?: string;
}

export interface AdminDevPromoteResponse {
  success: boolean;
  message?: string | null;
  data?: AdminDevPromoteData | null;
  meta?: any;
}

/**
 * Developer-only endpoint to promote a user role in dev/local environments.
 * WARNING: This endpoint must NOT be exposed in production UI. Frontend should
 * only call this in development environments under strict controls.
 */
export function promoteAdminDev(body: AdminDevPromoteRequest): Promise<AdminDevPromoteResponse> {
  const enableDevBootstrap = (import.meta.env.VITE_ENABLE_DEV_BOOTSTRAP === 'true') || import.meta.env.MODE !== 'production';
  if (!enableDevBootstrap) {
    return Promise.reject(new Error('promoteAdminDev is allowed only in development environments'));
  }
  return apiClient.post<AdminDevPromoteResponse>('/admin/dev/promote', body);
}

export function listAdminAuditLogs(params?: {
  actorRole?: string;
  action?: string;
  resource?: string;
  resourceId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}): Promise<AdminPaginatedResponse<AdminAuditLogRecord>> {
  const search = new URLSearchParams();
  if (params?.search) search.set('search', params.search);
  if (params?.actorRole) search.set('actorRole', params.actorRole);
  if (params?.action) search.set('action', params.action);
  if (params?.resource) search.set('resource', params.resource);
  if (params?.resourceId) search.set('resourceId', params.resourceId);
  if (params?.page != null) search.set('page', String(params.page));
  if (params?.pageSize != null) search.set('pageSize', String(params.pageSize));
  const qs = search.toString();
  return apiClient.get<AdminPaginatedResponse<AdminAuditLogRecord>>(`/admin/audit-logs${qs ? `?${qs}` : ''}`);
}

export default { getAdminHealth, listAdminAuditLogs, promoteAdminDev };

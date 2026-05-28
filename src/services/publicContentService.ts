import { apiClient } from '../lib/api/apiClient';
import type {
  PublicStatsResponse,
  Testimonial,
  BlogPost,
  FaqItem,
  ContactRequestPayload,
  AdminContactRequest,
} from '../lib/api/publicTypes';

export async function getPublicStats(): Promise<PublicStatsResponse> {
  return apiClient.get<PublicStatsResponse>('/public/stats');
}

export async function getPublicTestimonials(): Promise<Testimonial[]> {
  const res = await apiClient.get<any>('/public/testimonials');
  return Array.isArray(res) ? res : res.items || res.data || [];
}

export async function getPublicBlogs(params?: { category?: string; page?: number; pageSize?: number }): Promise<BlogPost[]> {
  const search = new URLSearchParams();
  if (params?.category) search.set('category', params.category);
  if (params?.page != null) search.set('page', String(params.page));
  if (params?.pageSize != null) search.set('pageSize', String(params.pageSize));
  const qs = search.toString();
  const res = await apiClient.get<any>(`/public/blog${qs ? `?${qs}` : ''}`);
  return Array.isArray(res) ? res : res.items || res.data || [];
}

export async function getPublicFaqs(): Promise<FaqItem[]> {
  const res = await apiClient.get<any>('/public/faqs');
  return Array.isArray(res) ? res : res.items || res.data || [];
}

export async function submitContactRequest(payload: ContactRequestPayload): Promise<AdminContactRequest> {
  return apiClient.post<AdminContactRequest>('/public/contact', payload);
}

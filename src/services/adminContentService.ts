import { apiClient } from '../lib/api/apiClient';
import type {
  PublicStatsResponse,
  AdminCmsSummary,
  AdminStatItem,
  Testimonial,
  BlogPost,
  FaqItem,
  AdminContactRequest,
} from '../lib/api/publicTypes';

// --- Stats Management ---
export async function getAdminCmsSummary(): Promise<AdminCmsSummary> {
  return apiClient.get<AdminCmsSummary>('/admin/public/stats');
}

export async function createAdminStat(payload: Omit<AdminStatItem, 'id'>): Promise<AdminStatItem> {
  return apiClient.post<AdminStatItem>('/admin/public/stats', payload);
}

export async function updateAdminStat(id: string, payload: Partial<Omit<AdminStatItem, 'id'>>): Promise<AdminStatItem> {
  return apiClient.put<AdminStatItem>(`/admin/public/stats/${id}`, payload);
}

export async function deleteAdminStat(id: string): Promise<void> {
  return apiClient.delete<void>(`/admin/public/stats/${id}`);
}

// --- Testimonials Management ---
export async function getAdminTestimonials(): Promise<Testimonial[]> {
  const res = await apiClient.get<any>('/admin/public/testimonials');
  return Array.isArray(res) ? res : res.items || res.data || [];
}

export async function createAdminTestimonial(payload: Omit<Testimonial, 'id'>): Promise<Testimonial> {
  return apiClient.post<Testimonial>('/admin/public/testimonials', payload);
}

export async function updateAdminTestimonial(id: string, payload: Partial<Omit<Testimonial, 'id'>>): Promise<Testimonial> {
  return apiClient.put<Testimonial>(`/admin/public/testimonials/${id}`, payload);
}

export async function deleteAdminTestimonial(id: string): Promise<void> {
  return apiClient.delete<void>(`/admin/public/testimonials/${id}`);
}

// --- FAQs Management ---
export async function getAdminFaqs(): Promise<FaqItem[]> {
  const res = await apiClient.get<any>('/admin/public/faqs');
  return Array.isArray(res) ? res : res.items || res.data || [];
}

export async function createAdminFaq(payload: Omit<FaqItem, 'id'>): Promise<FaqItem> {
  return apiClient.post<FaqItem>('/admin/public/faqs', payload);
}

export async function updateAdminFaq(id: string, payload: Partial<Omit<FaqItem, 'id'>>): Promise<FaqItem> {
  return apiClient.put<FaqItem>(`/admin/public/faqs/${id}`, payload);
}

export async function deleteAdminFaq(id: string): Promise<void> {
  return apiClient.delete<void>(`/admin/public/faqs/${id}`);
}

// --- Blog Management ---
export async function getAdminBlogs(): Promise<BlogPost[]> {
  const res = await apiClient.get<any>('/admin/public/blog');
  return Array.isArray(res) ? res : res.items || res.data || [];
}

export async function createAdminBlog(payload: Omit<BlogPost, 'id' | 'createdAt'>): Promise<BlogPost> {
  return apiClient.post<BlogPost>('/admin/public/blog', payload);
}

export async function updateAdminBlog(id: string, payload: Partial<Omit<BlogPost, 'id' | 'createdAt'>>): Promise<BlogPost> {
  return apiClient.put<BlogPost>(`/admin/public/blog/${id}`, payload);
}

export async function deleteAdminBlog(id: string): Promise<void> {
  return apiClient.delete<void>(`/admin/public/blog/${id}`);
}

// --- Contact Requests Management ---
export async function getAdminContactRequests(): Promise<AdminContactRequest[]> {
  const res = await apiClient.get<any>('/admin/public/contact-requests');
  return Array.isArray(res) ? res : res.items || res.data || [];
}

export async function updateAdminContactRequestStatus(id: string, status: string): Promise<{id: string, previousStatus: string, currentStatus: string}> {
  return apiClient.post<{id: string, previousStatus: string, currentStatus: string}>(`/admin/public/contact-requests/${id}/status`, { status });
}

// --- Mentor Bookings Management ---
export async function getAdminMentorBookings(): Promise<any[]> {
  const res = await apiClient.get<any>('/admin/mentor-bookings');
  return Array.isArray(res) ? res : res.items || res.data || [];
}

// --- Report Shares Management ---
export async function getAdminReportShares(): Promise<any[]> {
  const res = await apiClient.get<any>('/admin/reports/shares');
  return Array.isArray(res) ? res : res.items || res.data || [];
}

// --- System Health ---
export async function getSystemHealth(): Promise<any> {
  return apiClient.get<any>('/admin/health');
}

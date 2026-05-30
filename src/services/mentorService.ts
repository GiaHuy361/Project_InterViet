import { apiClient } from '../lib/api/apiClient';

export interface MentorSpecialty {
  id: string;
  code: string;
  name: string;
  description?: string | null;
}

export interface MentorAvailabilitySlot {
  id: string;
  startsAt: string;
  endsAt: string;
  status: 'available' | 'reserved' | 'booked' | string;
  priceAmount: number;
  currencyCode: string;
}

export interface MentorSummary {
  id: string;
  fullName: string;
  headline?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
  yearsOfExperience?: number | null;
  ratingAverage: number;
  ratingCount: number;
  specialties: MentorSpecialty[];
}

export interface MentorDetail extends MentorSummary {
  availabilitySlots: MentorAvailabilitySlot[];
  expertise?: string[];
  industries?: string[];
  languages?: string[];
}

export interface MentorListResponse {
  items: MentorSummary[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface BookMentorRequest {
  slotId: string;
  serviceType: string;
  candidateNotes?: string;
}

export interface BookMentorResponse {
  bookingId: string;
  status: 'pending_payment' | 'confirmed' | 'cancelled' | 'completed' | string;
  amount: number;
  currencyCode: string;
  checkoutSessionId: string;
  checkoutUrl: string;
  paymentInstructionsUrl: string;
}

export interface MentorBookingReview {
  rating: number;
  comment: string;
}

export interface MentorBookingItem {
  id: string;
  userId: string;
  mentorId: string;
  mentorName: string;
  mentorHeadline: string;
  mentorAvatarUrl: string;
  availabilitySlotId: string;
  status: 'pending_payment' | 'confirmed' | 'cancelled' | 'completed' | string;
  scheduledStartsAt: string;
  scheduledEndsAt: string;
  serviceType: string;
  amount: number;
  currencyCode: string;
  meetingUrl: string;
  candidateNotes: string;
  checkoutSessionId: string;
  checkoutStatus: string;
  createdAt: string;
  cancelledAt: string;
}

export interface CancelMentorBookingRequest {
  reason: string;
}

export interface CancelMentorBookingResponse {
  bookingId: string;
  status: string;
  releasedSlotId?: string;
  message?: string;
}

export interface MentorBookingActionResponse {
  bookingId: string;
  status: string;
  message?: string;
}

export function listMentors(params?: {
  specialty?: string;
  serviceType?: string;
  rating?: number;
  search?: string;
  page?: number;
  pageSize?: number;
}): Promise<MentorListResponse> {
  const searchParams = new URLSearchParams();
  if (params?.specialty) searchParams.set('specialty', params.specialty);
  if (params?.serviceType) searchParams.set('serviceType', params.serviceType);
  if (params?.rating != null) searchParams.set('rating', String(params.rating));
  if (params?.search) searchParams.set('search', params.search);
  if (params?.page != null) searchParams.set('page', String(params.page));
  if (params?.pageSize != null) searchParams.set('pageSize', String(params.pageSize));
  const qs = searchParams.toString();
  return apiClient.get<MentorListResponse>(`/public/mentors${qs ? `?${qs}` : ''}`);
}

export function getMentorDetail(id: string): Promise<MentorDetail> {
  return apiClient.get<MentorDetail>(`/public/mentors/${encodeURIComponent(id)}`);
}

export function bookMentor(payload: BookMentorRequest): Promise<BookMentorResponse> {
  return apiClient.post<BookMentorResponse>('/mentor-bookings', payload);
}

export function listMentorBookings(params?: {
  status?: string;
  mentorId?: string;
  serviceType?: string;
}): Promise<MentorBookingItem[]> {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.set('status', params.status);
  if (params?.mentorId) searchParams.set('mentorId', params.mentorId);
  if (params?.serviceType) searchParams.set('serviceType', params.serviceType);
  const qs = searchParams.toString();
  return apiClient.get<MentorBookingItem[]>(`/mentor-bookings${qs ? `?${qs}` : ''}`);
}

export function cancelMentorBooking(
  bookingId: string,
  payload: CancelMentorBookingRequest
): Promise<CancelMentorBookingResponse> {
  return apiClient.post<CancelMentorBookingResponse>(`/mentor-bookings/${encodeURIComponent(bookingId)}/cancel`, payload);
}

export function simulateCompleteMentorBooking(bookingId: string): Promise<MentorBookingActionResponse> {
  return apiClient.post<MentorBookingActionResponse>(`/mentor-bookings/${encodeURIComponent(bookingId)}/simulate-complete`, {});
}

export function submitMentorBookingReview(
  bookingId: string,
  payload: MentorBookingReview
): Promise<MentorBookingActionResponse> {
  return apiClient.post<MentorBookingActionResponse>(`/mentor-bookings/${encodeURIComponent(bookingId)}/review`, payload);
}

export interface RegisterMentorPayload {
  fullName: string;
  headline: string;
  bio: string;
  yearsOfExperience: number;
  expertise: string[];
  industries: string[];
  languages: string[];
  specialtyIds: string[];
}

export interface RegisterMentorResponse {
  message: string;
  mentorProfileId: string;
}

export function registerMentor(payload: RegisterMentorPayload): Promise<RegisterMentorResponse> {
  return apiClient.post<RegisterMentorResponse>('/mentors/register', payload);
}

export default {
  listMentors,
  getMentorDetail,
  bookMentor,
  listMentorBookings,
  cancelMentorBooking,
  simulateCompleteMentorBooking,
  submitMentorBookingReview,
  registerMentor,
};

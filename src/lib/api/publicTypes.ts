import type { MentorBookingItem } from '../../services/mentorService';

export interface PublicStatsResponse {
  totalCandidates: number;
  totalCVsProcessed: number;
  totalInterviewsConducted: number;
  averageRating: number;
}

export interface AdminCmsSummary {
  totalFaqs: number;
  publishedFaqs: number;
  totalBlogArticles: number;
  publishedBlogArticles: number;
  totalTestimonials: number;
  activeTestimonials: number;
  totalContactRequests: number;
  pendingContactRequests: number;
}

export interface AdminStatItem {
  id: string;
  key: string;
  value: string;
  label: string;
  icon: string;
  sortOrder: number;
}

export interface Testimonial {
  id: string;
  authorName: string;
  authorRole: string;
  content: string;
  avatarUrl: string;
  rating: number;
  sortOrder: number;
  isActive: boolean;
  isFeatured: boolean;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  author: string;
  coverImageUrl: string;
  category: string;
  isPublished: boolean;
  publishedAt: string;
  createdAt: string;
}

export interface FaqItem {
  id: string;
  category: string;
  question: string;
  answer: string;
  sortOrder: number;
  isActive: boolean;
}

export interface ContactRequestPayload {
  name: string;
  email: string;
  phone: string;
  subject: string;
  category: string;
  message: string;
}

export interface AdminContactRequest {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  subject: string;
  category: string;
  message: string;
  status: 'pending' | 'in_progress' | 'resolved' | 'ignored' | string;
  createdAt: string;
}

export interface BaseApiResponse<T = unknown> {
  data: T;
  message: string;
}

export interface AdminMentorBooking {
  bookingId: string;
  userId: string;
  candidateEmail: string;
  mentorName: string;
  serviceType: string;
  status: string;
  priceAmount: number;
  currencyCode: string;
  startsAt: string;
  endsAt: string;
  paymentStatus: string;
}

export interface AdminReportShare {
  shareId: string;
  userId: string;
  ownerEmail: string;
  ownerFullName: string;
  reportType: string;
  resourceId: string;
  title: string;
  isActive: boolean;
  allowPdfDownload: boolean;
  viewCount: number;
  createdAt: string;
  expiresAt: string;
  revokedAt: string | null;
  tokenPreview: string;
}

export interface SystemHealthComponent {
  status: 'Healthy' | 'Degraded' | 'Unavailable' | 'Unhealthy' | string;
  details: string;
}

export interface SystemHealthResponse {
  status: 'Healthy' | 'Degraded' | 'Unavailable' | 'Unhealthy' | string;
  timestamp: string;
  components: {
    [key: string]: SystemHealthComponent;
  };
}

export interface SupportDashboardSummary {
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  resolvedTickets: number;
  closedTickets: number;
  totalContactRequests: number;
  pendingContactRequests: number;
  processedContactRequests: number;
}

export interface SupportWorkspaceMessage {
  id: string;
  senderType: string;
  senderUserId: string;
  messageBody: string;
  createdAt: string;
  isInternalNote: boolean;
}

export interface SupportWorkspaceTicket {
  id: string;
  ticketNumber: string;
  category: string;
  priority: string;
  subject: string;
  status: string;
  description: string;
  assignedTo: string | null;
  assignedToId: string | null;
  assignedToName: string | null;
  assignedToAvatarUrl: string | null;
  createdAt: string;
  closedAt: string | null;
  lastMessageAt: string | null;
  messages: SupportWorkspaceMessage[];
}

export interface SupportWorkspaceListResponse {
  total: number;
  page: number;
  pageSize: number;
  items: SupportWorkspaceTicket[];
}

export interface SupportWorkspaceContactRequest {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  subject: string;
  category: string;
  message: string;
  status: 'pending' | 'processed' | 'ignored' | string;
  createdAt: string;
}

export interface SupportWorkspaceContactRequestListResponse {
  total: number;
  page: number;
  pageSize: number;
  items: SupportWorkspaceContactRequest[];
}

export interface MentorWorkspaceDashboardSummary {
  pendingBookingsCount: number;
  confirmedBookingsCount: number;
  completedBookingsCount: number;
  cancelledBookingsCount: number;
  totalEarningsAmount: number;
  currencyCode: string;
  averageRating: number;
  recentBookings: MentorBookingItem[];
}

export interface MentorProfile {
  id: string;
  userId: string;
  isVerified: boolean;
  fullName: string;
  headline: string;
  avatarUrl: string;
  bio: string;
  yearsOfExperience: number;
  ratingAverage: number;
  ratingCount: number;
  status: string;
  expertise: string[];
  industries: string[];
  languages: string[];
  specialties?: import('../../services/mentorSpecialtyService').MentorSpecialtyDto[];
}

export interface UpdateMentorProfileRequest {
  fullName: string;
  headline: string;
  avatarUrl: string;
  bio: string;
  yearsOfExperience: number;
  expertise: string[];
  industries: string[];
  languages: string[];
}

export interface MentorWorkspaceBookingItem {
  id: string;
  userId: string;
  candidateName: string;
  candidateEmail: string;
  candidateAvatarUrl: string | null;
  mentorId: string;
  status: 'pending_payment' | 'confirmed' | 'cancelled' | 'completed' | string;
  scheduledStartsAt: string | null;
  scheduledEndsAt: string | null;
  serviceType: string;
  amount: number;
  currencyCode: string;
  meetingUrl: string | null;
  candidateNotes: string | null;
  cancelReason: string | null;
  cancelledAt: string | null;
  completedAt: string | null;
  createdAt: string | null;
  review: {
    rating: number;
    comment: string | null;
  } | null;
}

export interface MentorWorkspaceBookingListResponse {
  total: number;
  page: number;
  pageSize: number;
  items: MentorWorkspaceBookingItem[];
}

export interface MentorAvailabilitySlot {
  id?: string;
  startsAt: string;
  endsAt: string;
  status?: 'available' | 'reserved' | 'booked' | string;
  priceAmount: number;
  currencyCode: string;
}

export interface UpdateMentorAvailabilityRequest {
  slots: {
    startsAt: string;
    endsAt: string;
    priceAmount: number;
    currencyCode: string;
  }[];
}



import { apiClient } from '../lib/api/apiClient';
import type { MentorSpecialty } from './mentorService';

export interface MentorSpecialtyDto {
  id: string;
  code: string;
  name: string;
  description?: string;
}

export const mentorSpecialtyService = {
  // Admin Methods
  getAdminSpecialties: () => 
    apiClient.get<MentorSpecialtyDto[]>('/admin/mentors/specialties'),

  createSpecialty: (payload: { code: string; name: string; description?: string }) => 
    apiClient.post<MentorSpecialtyDto>('/admin/mentors/specialties', payload),

  updateSpecialty: (id: string, payload: { name: string; description?: string }) => 
    apiClient.put<MentorSpecialtyDto>(`/admin/mentors/specialties/${encodeURIComponent(id)}`, payload),

  deleteSpecialty: (id: string) => 
    apiClient.delete<{ id: string }>(`/admin/mentors/specialties/${encodeURIComponent(id)}`),

  adminAssignSpecialties: (mentorIdOrProfileId: string, specialtyIds: string[]) => 
    apiClient.post<{ mentorProfileId: string; specialties: MentorSpecialtyDto[] }>(`/admin/mentors/${encodeURIComponent(mentorIdOrProfileId)}/specialties`, { specialtyIds }),

  // Public/Mentor Methods
  getSpecialtiesCatalog: () =>
    apiClient.get<MentorSpecialtyDto[]>('/mentor/specialties'),

  // Mentor Methods
  selfAssignSpecialties: (specialtyIds: string[]) =>
    apiClient.post<{ mentorProfileId: string; specialties: MentorSpecialtyDto[] }>('/mentor/profile/specialties', { specialtyIds }),
};

export default mentorSpecialtyService;

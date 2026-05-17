import { apiClient } from '../lib/api/apiClient';
import { normalizeProfileResponse } from '../utils/profileMappers';
import type {
  ProfileResponse,
  UpdateProfileRequest,
  AddSkillRequest,
  UpdateSkillRequest,
  AddEducationRequest,
  UpdateEducationRequest,
  AddWorkExperienceRequest,
  UpdateWorkExperienceRequest,
  AddExternalLinkRequest,
  UpdateExternalLinkRequest,
  ProfileSkill,
  ProfileEducation,
  ProfileWorkExperience,
  ProfileExternalLink,
} from '../lib/api/phase2Types';

export async function getProfile(): Promise<ProfileResponse> {
  const data = await apiClient.get<ProfileResponse>('/profile');
  return normalizeProfileResponse(data);
}

export async function updateProfile(
  payload: UpdateProfileRequest
): Promise<ProfileResponse> {
  return apiClient.patch<ProfileResponse>('/profile', payload);
}

export async function addSkill(payload: AddSkillRequest): Promise<ProfileSkill> {
  return apiClient.post<ProfileSkill>('/profile/skills', payload);
}

export async function updateSkill(
  id: string,
  payload: UpdateSkillRequest
): Promise<ProfileSkill> {
  return apiClient.put<ProfileSkill>(`/profile/skills/${id}`, payload);
}

export async function deleteSkill(id: string): Promise<void> {
  return apiClient.delete<void>(`/profile/skills/${id}`);
}

export async function addEducation(
  payload: AddEducationRequest
): Promise<ProfileEducation> {
  return apiClient.post<ProfileEducation>('/profile/educations', payload);
}

export async function updateEducation(
  id: string,
  payload: UpdateEducationRequest
): Promise<ProfileEducation> {
  return apiClient.put<ProfileEducation>(`/profile/educations/${id}`, payload);
}

export async function deleteEducation(id: string): Promise<void> {
  return apiClient.delete<void>(`/profile/educations/${id}`);
}

export async function addExperience(
  payload: AddWorkExperienceRequest
): Promise<ProfileWorkExperience> {
  return apiClient.post<ProfileWorkExperience>('/profile/experiences', payload);
}

export async function updateExperience(
  id: string,
  payload: UpdateWorkExperienceRequest
): Promise<ProfileWorkExperience> {
  return apiClient.put<ProfileWorkExperience>(
    `/profile/experiences/${id}`,
    payload
  );
}

export async function deleteExperience(id: string): Promise<void> {
  return apiClient.delete<void>(`/profile/experiences/${id}`);
}

export async function addLink(
  payload: AddExternalLinkRequest
): Promise<ProfileExternalLink> {
  return apiClient.post<ProfileExternalLink>('/profile/links', payload);
}

export async function updateLink(
  id: string,
  payload: UpdateExternalLinkRequest
): Promise<ProfileExternalLink> {
  return apiClient.put<ProfileExternalLink>(`/profile/links/${id}`, payload);
}

export async function deleteLink(id: string): Promise<void> {
  return apiClient.delete<void>(`/profile/links/${id}`);
}

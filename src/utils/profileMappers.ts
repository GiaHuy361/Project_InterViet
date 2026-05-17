import { createApiError } from '../lib/api/apiError';
import type {
  ProfileResponse,
  ProfileSkill,
  ProfileEducation,
  ProfileWorkExperience,
  ProfileExternalLink,
  AddSkillRequest,
  AddExternalLinkRequest,
  AddWorkExperienceRequest,
  AddEducationRequest,
} from '../lib/api/phase2Types';

type WithEntityIds = {
  id?: string;
  skillId?: string;
  educationId?: string;
  experienceId?: string;
  linkId?: string;
};

type RawProfile = ProfileResponse & Record<string, unknown>;

export function resolveEntityId(item: WithEntityIds): string {
  return (
    item.id ??
    item.skillId ??
    item.educationId ??
    item.experienceId ??
    item.linkId ??
    ''
  );
}

function withId<T extends WithEntityIds>(item: T): T & { id: string } {
  return { ...item, id: resolveEntityId(item) };
}

function pickArray<T>(raw: RawProfile, ...keys: string[]): T[] {
  for (const key of keys) {
    const value = raw[key];
    if (Array.isArray(value)) return value as T[];
  }
  return [];
}

export function normalizeProfileResponse(data: ProfileResponse): ProfileResponse {
  const raw = data as RawProfile;

  return {
    ...data,
    skills: pickArray<ProfileSkill>(raw, 'skills', 'Skills').map((s) =>
      withId(s as ProfileSkill & WithEntityIds)
    ),
    educations: pickArray<ProfileEducation>(raw, 'educations', 'Educations', 'education').map(
      (e) => normalizeEducation(e as ProfileEducation & WithEntityIds)
    ),
    experiences: pickArray<ProfileWorkExperience>(
      raw,
      'experiences',
      'Experiences',
      'workExperiences',
      'WorkExperiences'
    ).map((e) => withId(e as ProfileWorkExperience & WithEntityIds)),
    links: pickArray<ProfileExternalLink>(
      raw,
      'links',
      'Links',
      'externalLinks',
      'ExternalLinks'
    ).map((l) => withId(l as ProfileExternalLink & WithEntityIds)),
  };
}

function normalizeEducation(e: ProfileEducation & WithEntityIds): ProfileEducation & {
  id: string;
} {
  const item = withId(e);
  return {
    ...item,
    schoolName: item.schoolName ?? item.institution,
    institution: item.institution ?? item.schoolName,
  };
}

export function buildSkillPayload(
  name: string,
  category: string,
  level: string
): AddSkillRequest {
  return {
    skillName: name.trim(),
    skillCategory: category.trim() || undefined,
    proficiencyLevel: level.trim() || undefined,
  };
}

export function getSkillDisplay(s: ProfileSkill) {
  return {
    name: s.skillName ?? s.name ?? '',
    category: s.skillCategory ?? s.category ?? '',
    level: s.proficiencyLevel ?? s.level ?? s.proficiency ?? '',
  };
}

export const SKILL_CATEGORIES = [
  'Technical',
  'Soft Skills',
  'Languages',
  'Tools',
  'Khác',
] as const;

export const PROFICIENCY_LEVELS = [
  'Beginner',
  'Intermediate',
  'Advanced',
  'Expert',
] as const;

/** Backend LinkType enum — gửi đúng PascalCase */
export const LINK_TYPES = [
  'LinkedIn',
  'GitHub',
  'Facebook',
  'Portfolio',
  'Website',
  'Other',
] as const;

export function buildLinkPayload(
  linkType: string,
  label: string,
  url: string
): AddExternalLinkRequest {
  const trimmedUrl = url.trim();
  try {
    const parsed = new URL(trimmedUrl);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error('invalid');
    }
  } catch {
    throw new Error('URL không hợp lệ. Vui lòng nhập địa chỉ đầy đủ (https://...).');
  }

  const type = linkType.trim();
  if (!type) {
    throw new Error('Vui lòng chọn loại liên kết.');
  }

  const displayLabel = label.trim() || type;

  return {
    linkType: type,
    url: trimmedUrl,
    label: displayLabel,
    title: displayLabel,
  };
}

export function buildExperiencePayload(form: {
  companyName: string;
  jobTitle: string;
  employmentType: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  description: string;
  metricsSummary: string;
}): AddWorkExperienceRequest {
  if (!form.isCurrent && !form.endDate) {
    throw new Error('Vui lòng nhập ngày kết thúc hoặc chọn "Đang làm việc tại đây".');
  }

  const payload: AddWorkExperienceRequest = {
    companyName: form.companyName.trim(),
    jobTitle: form.jobTitle.trim(),
    startDate: form.startDate,
    isCurrent: Boolean(form.isCurrent),
  };

  const industry = form.employmentType.trim();
  if (industry) {
    payload.industry = industry;
  }

  if (form.description.trim()) {
    payload.description = form.description.trim();
  }

  const achievements = form.metricsSummary.trim();
  if (achievements) {
    payload.achievements = achievements;
    payload.metricsSummary = achievements;
  }

  if (!form.isCurrent && form.endDate) {
    payload.endDate = form.endDate;
  }

  return payload;
}

export function buildEducationPayload(form: {
  schoolName: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string;
  endDate: string;
  description: string;
}): AddEducationRequest {
  const school = form.schoolName.trim();
  if (!school) {
    throw new Error('Tên trường là bắt buộc.');
  }
  return {
    schoolName: school,
    institution: school,
    degree: form.degree.trim() || undefined,
    fieldOfStudy: form.fieldOfStudy.trim() || undefined,
    startDate: form.startDate || undefined,
    endDate: form.endDate || undefined,
    description: form.description.trim() || undefined,
  };
}

export function formatProfileMutationError(err: unknown): string {
  if (err instanceof Error && !('status' in err)) {
    if (
      err.message.startsWith('URL') ||
      err.message.includes('ngày kết thúc') ||
      err.message.includes('loại liên kết')
    ) {
      return err.message;
    }
  }
  return createApiError(err).getUserMessage();
}

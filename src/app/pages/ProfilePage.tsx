import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { useApp } from '../contexts/AppContext';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { PageState } from '../components/phase2/PageState';
import { AvatarInitials } from '../components/brand/AvatarInitials';
import * as profileService from '../../services/profileService';
import type {
  ProfileResponse,
  ProfileSkill,
  ProfileEducation,
  ProfileWorkExperience,
  ProfileExternalLink,
} from '../../lib/api/phase2Types';
import { ApiError, createApiError } from '../../lib/api/apiError';
import {
  buildEducationPayload,
  buildExperiencePayload,
  buildLinkPayload,
  buildSkillPayload,
  formatProfileMutationError,
  getSkillDisplay,
  LINK_TYPES,
  PROFICIENCY_LEVELS,
  SKILL_CATEGORIES,
} from '../../utils/profileMappers';
import {
  formatThousands,
  salaryInputToNumber,
  sanitizeSalaryInput,
  toDateInputValue,
} from '../../utils/formatters';
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Briefcase,
  GraduationCap,
  Link2,
  Sparkles,
  UserRound,
} from 'lucide-react';
function linkLabel(l: ProfileExternalLink): string {
  return l.label ?? l.title ?? l.linkType ?? l.platform ?? l.url ?? '';
}

export const ProfilePage: React.FC = () => {
  const { state } = useApp();
  const navigate = useNavigate();
  const authUser = state.user;

  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [savingBasic, setSavingBasic] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');

  const [basic, setBasic] = useState({
    fullName: '',
    phoneNumber: '',
    headline: '',
    summary: '',
    desiredRole: '',
    yearsOfExperience: '',
    currentLocation: '',
    preferredLocation: '',
    salaryExpectationMin: '',
    salaryExpectationMax: '',
  });

  const loadProfile = useCallback(
    async (options?: { initial?: boolean }) => {
      const isInitial = options?.initial ?? false;
      if (isInitial) {
        setLoading(true);
        setError(null);
      } else {
        setRefreshing(true);
      }

      try {
        const data = await profileService.getProfile();
        setProfile(data);
        if (isInitial) {
          setBasic({
            fullName: data.fullName ?? authUser?.name ?? '',
            phoneNumber: data.phoneNumber ?? '',
            headline: data.headline ?? '',
            summary: data.summary ?? '',
            desiredRole: data.desiredRole ?? '',
            yearsOfExperience:
              data.yearsOfExperience != null ? String(data.yearsOfExperience) : '',
            currentLocation: data.currentLocation ?? '',
            preferredLocation: data.preferredLocation ?? '',
            salaryExpectationMin:
              data.salaryExpectationMin != null
                ? formatThousands(data.salaryExpectationMin)
                : '',
            salaryExpectationMax:
              data.salaryExpectationMax != null
                ? formatThousands(data.salaryExpectationMax)
                : '',
          });
        }
      } catch (err) {
        if (isInitial) {
          setError(createApiError(err));
        } else {
          toast.error(createApiError(err).getUserMessage());
        }
      } finally {
        if (isInitial) {
          setLoading(false);
        } else {
          setRefreshing(false);
        }
      }
    },
    [authUser?.name]
  );

  const refreshProfile = useCallback(async () => {
    await loadProfile({ initial: false });
  }, [loadProfile]);

  useEffect(() => {
    void loadProfile({ initial: true });
  }, [loadProfile]);

  const validateBasic = (): string | null => {
    if (!basic.fullName.trim()) return 'Họ và tên không được để trống.';
    const years = basic.yearsOfExperience
      ? Number(basic.yearsOfExperience)
      : undefined;
    if (years != null && (Number.isNaN(years) || years < 0)) {
      return 'Số năm kinh nghiệm phải >= 0.';
    }
    const min = salaryInputToNumber(basic.salaryExpectationMin);
    const max = salaryInputToNumber(basic.salaryExpectationMax);
    if (min != null && (Number.isNaN(min) || min < 0)) {
      return 'Mức lương tối thiểu phải >= 0.';
    }
    if (max != null && (Number.isNaN(max) || max < 0)) {
      return 'Mức lương tối đa phải >= 0.';
    }
    if (min != null && max != null && min > max) {
      return 'Mức lương tối thiểu không được lớn hơn tối đa.';
    }
    return null;
  };

  const handleSaveBasic = async () => {
    const validation = validateBasic();
    if (validation) {
      toast.error(validation);
      return;
    }
    setSavingBasic(true);
    try {
      const payload: Record<string, unknown> = {
        fullName: basic.fullName.trim(),
      };
      if (basic.phoneNumber.trim()) payload.phoneNumber = basic.phoneNumber.trim();
      if (basic.headline.trim()) payload.headline = basic.headline.trim();
      if (basic.summary.trim()) payload.summary = basic.summary.trim();
      if (basic.desiredRole.trim()) payload.desiredRole = basic.desiredRole.trim();
      if (basic.currentLocation.trim()) {
        payload.currentLocation = basic.currentLocation.trim();
      }
      if (basic.preferredLocation.trim()) {
        payload.preferredLocation = basic.preferredLocation.trim();
      }
      if (basic.yearsOfExperience !== '') {
        payload.yearsOfExperience = Number(basic.yearsOfExperience);
      }
      const minSalary = salaryInputToNumber(basic.salaryExpectationMin);
      const maxSalary = salaryInputToNumber(basic.salaryExpectationMax);
      if (minSalary != null) payload.salaryExpectationMin = minSalary;
      if (maxSalary != null) payload.salaryExpectationMax = maxSalary;

      await profileService.updateProfile(payload);
      toast.success('Đã cập nhật hồ sơ');
      await refreshProfile();
    } catch (err) {
      toast.error(formatProfileMutationError(err));
    } finally {
      setSavingBasic(false);
    }
  };

  const displayName = profile?.fullName ?? authUser?.name ?? 'Ứng viên';
  const avatarUrl = profile?.avatarUrl;
  const headline = profile?.headline;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <PageState
        isLoading={loading}
        error={error}
        onRetry={() => void loadProfile({ initial: true })}
      >
        {refreshing && (
          <p className="text-xs text-muted-foreground mb-2 flex items-center gap-2">
            <Loader2 className="h-3 w-3 animate-spin" />
            Đang đồng bộ dữ liệu...
          </p>
        )}
        <Card className="surface-card gap-0 overflow-hidden p-0">
          <div className="border-b border-slate-200 bg-slate-50 px-6 py-5 dark:border-slate-700 dark:bg-slate-800/50">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Hồ sơ cá nhân
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Quản lý thông tin ứng tuyển — đồng bộ với tài khoản của bạn
            </p>
          </div>
          <div className="flex items-center gap-5 p-6">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt=""
                className="h-20 w-20 rounded-2xl object-cover ring-2 ring-slate-200 shadow-sm dark:ring-slate-700"
              />
            ) : (
              <AvatarInitials
                name={displayName}
                size="lg"
                plan={authUser?.subscriptionPlan}
                className="!h-20 !w-20 !text-lg"
              />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-xl font-semibold text-slate-900 dark:text-white">
                {displayName}
              </p>
              {headline && (
                <p className="mt-0.5 truncate text-sm text-slate-600 dark:text-slate-400">
                  {headline}
                </p>
              )}
              {authUser?.email && (
                <p className="mt-1 text-xs text-slate-500">{authUser.email}</p>
              )}
            </div>
          </div>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6 w-full">
          <TabsList className="grid h-auto w-full grid-cols-5 gap-1 border border-slate-200 bg-slate-100 p-1 dark:border-slate-700 dark:bg-slate-800">
            <TabsTrigger value="basic" className="text-xs sm:text-sm gap-1">
              <UserRound className="h-3.5 w-3.5 hidden sm:inline" />
              Cơ bản
            </TabsTrigger>
            <TabsTrigger value="skills" className="text-xs sm:text-sm gap-1">
              <Sparkles className="h-3.5 w-3.5 hidden sm:inline" />
              Kỹ năng
            </TabsTrigger>
            <TabsTrigger value="education" className="text-xs sm:text-sm gap-1">
              <GraduationCap className="h-3.5 w-3.5 hidden sm:inline" />
              Học vấn
            </TabsTrigger>
            <TabsTrigger value="experience" className="text-xs sm:text-sm gap-1">
              <Briefcase className="h-3.5 w-3.5 hidden sm:inline" />
              Kinh nghiệm
            </TabsTrigger>
            <TabsTrigger value="links" className="text-xs sm:text-sm gap-1">
              <Link2 className="h-3.5 w-3.5 hidden sm:inline" />
              Liên kết
            </TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="mt-4">
            <SectionCard title="Thông tin cơ bản" description="Thông tin nhà tuyển dụng thường xem đầu tiên">
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Họ và tên *" id="fullName">
                  <Input
                    id="fullName"
                    value={basic.fullName}
                    onChange={(e) =>
                      setBasic((b) => ({ ...b, fullName: e.target.value }))
                    }
                  />
                </Field>
                <Field label="Số điện thoại" id="phone">
                  <Input
                    id="phone"
                    value={basic.phoneNumber}
                    onChange={(e) =>
                      setBasic((b) => ({ ...b, phoneNumber: e.target.value }))
                    }
                  />
                </Field>
                <Field label="Tiêu đề / Headline" className="md:col-span-2">
                  <Input
                    value={basic.headline}
                    onChange={(e) =>
                      setBasic((b) => ({ ...b, headline: e.target.value }))
                    }
                  />
                </Field>
                <Field label="Tóm tắt" className="md:col-span-2">
                  <Textarea
                    rows={4}
                    value={basic.summary}
                    onChange={(e) =>
                      setBasic((b) => ({ ...b, summary: e.target.value }))
                    }
                  />
                </Field>
                <Field label="Vị trí mong muốn">
                  <Input
                    value={basic.desiredRole}
                    onChange={(e) =>
                      setBasic((b) => ({ ...b, desiredRole: e.target.value }))
                    }
                  />
                </Field>
                <Field label="Số năm kinh nghiệm">
                  <Input
                    type="number"
                    min={0}
                    step={0.5}
                    value={basic.yearsOfExperience}
                    onChange={(e) =>
                      setBasic((b) => ({
                        ...b,
                        yearsOfExperience: e.target.value,
                      }))
                    }
                  />
                </Field>
                <Field label="Địa điểm hiện tại">
                  <Input
                    value={basic.currentLocation}
                    onChange={(e) =>
                      setBasic((b) => ({
                        ...b,
                        currentLocation: e.target.value,
                      }))
                    }
                  />
                </Field>
                <Field label="Địa điểm ưu tiên">
                  <Input
                    value={basic.preferredLocation}
                    onChange={(e) =>
                      setBasic((b) => ({
                        ...b,
                        preferredLocation: e.target.value,
                      }))
                    }
                  />
                </Field>
                <Field label="Lương tối thiểu (VND)">
                  <Input
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
                    placeholder="12,000,000"
                    value={basic.salaryExpectationMin}
                    onChange={(e) =>
                      setBasic((b) => ({
                        ...b,
                        salaryExpectationMin: sanitizeSalaryInput(e.target.value),
                      }))
                    }
                  />
                </Field>
                <Field label="Lương tối đa (VND)">
                  <Input
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
                    placeholder="25,000,000"
                    value={basic.salaryExpectationMax}
                    onChange={(e) =>
                      setBasic((b) => ({
                        ...b,
                        salaryExpectationMax: sanitizeSalaryInput(e.target.value),
                      }))
                    }
                  />
                </Field>
              </div>
              <Button onClick={() => void handleSaveBasic()} disabled={savingBasic} className="mt-2">
                {savingBasic && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Lưu thông tin cơ bản
              </Button>
            </SectionCard>
          </TabsContent>

          <TabsContent value="skills" className="mt-4">
            <SkillsSection skills={profile?.skills ?? []} onChanged={refreshProfile} />
          </TabsContent>
          <TabsContent value="education" className="mt-4">
            <EducationSection items={profile?.educations ?? []} onChanged={refreshProfile} />
          </TabsContent>
          <TabsContent value="experience" className="mt-4">
            <ExperienceSection items={profile?.experiences ?? []} onChanged={refreshProfile} />
          </TabsContent>
          <TabsContent value="links" className="mt-4">
            <LinksSection items={profile?.links ?? []} onChanged={refreshProfile} />
          </TabsContent>
        </Tabs>

      </PageState>
    </div>
  );
};

// —— Layout helpers ——

const SectionCard: React.FC<{
  title: string;
  description?: string;
  children: React.ReactNode;
}> = ({ title, description, children }) => (
  <Card className="surface-card gap-0 p-6">
    <div className="mb-5">
      <h3 className="font-semibold text-lg">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
      )}
    </div>
    <div className="space-y-4">{children}</div>
  </Card>
);

const Field: React.FC<{
  label: string;
  id?: string;
  className?: string;
  children: React.ReactNode;
}> = ({ label, id, className, children }) => (
  <div className={className}>
    <Label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-800 dark:text-slate-200">
      {label}
    </Label>
    {children}
  </div>
);

const EmptyHint: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="text-sm text-muted-foreground py-2">{children}</p>
);

// —— Skills ——

const SkillsSection: React.FC<{
  skills: ProfileSkill[];
  onChanged: () => Promise<void>;
}> = ({ skills, onChanged }) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<string>('');
  const [level, setLevel] = useState<string>('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const resetForm = () => {
    setName('');
    setCategory('');
    setLevel('');
    setEditingId(null);
  };

  const submit = async () => {
    if (!name.trim()) {
      toast.error('Tên kỹ năng là bắt buộc');
      return;
    }
    setBusy(true);
    try {
      const payload = buildSkillPayload(name, category, level);
      if (editingId) {
        await profileService.updateSkill(editingId, payload);
        toast.success('Đã cập nhật kỹ năng');
      } else {
        await profileService.addSkill(payload);
        toast.success('Đã thêm kỹ năng');
      }
      resetForm();
      await onChanged();
    } catch (err) {
      toast.error(formatProfileMutationError(err));
    } finally {
      setBusy(false);
    }
  };

  const startEdit = (s: ProfileSkill) => {
    const d = getSkillDisplay(s);
    setEditingId(s.id);
    setName(d.name);
    setCategory(d.category || '');
    setLevel(d.level || '');
  };

  return (
    <SectionCard title="Kỹ năng" description="Danh mục và mức độ giúp hồ sơ nổi bật hơn">
      {skills.length === 0 && (
        <EmptyHint>Bạn chưa thêm kỹ năng nào.</EmptyHint>
      )}
      {skills.length > 0 && (
        <ul className="space-y-2">
          {skills.map((s) => {
            const d = getSkillDisplay(s);
            return (
              <li
                key={s.id}
                className="flex items-center justify-between gap-3 rounded-xl border bg-card px-4 py-3 hover:border-primary/20 transition-colors"
              >
                <div>
                  <p className="font-medium">{d.name}</p>
                  {(d.category || d.level) && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {[d.category, d.level].filter(Boolean).join(' · ')}
                    </p>
                  )}
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button size="icon" variant="ghost" onClick={() => startEdit(s)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    disabled={busy}
                    onClick={async () => {
                      if (!confirm('Xóa kỹ năng này?')) return;
                      setBusy(true);
                      try {
                        await profileService.deleteSkill(s.id);
                        toast.success('Đã xóa');
                        await onChanged();
                      } catch (err) {
                        toast.error(formatProfileMutationError(err));
                      } finally {
                        setBusy(false);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="rounded-xl border border-dashed bg-muted/30 p-4 space-y-4">
        <p className="text-sm font-medium">
          {editingId ? 'Chỉnh sửa kỹ năng' : 'Thêm kỹ năng mới'}
        </p>
        <div className="grid md:grid-cols-3 gap-3">
          <Field label="Tên kỹ năng *">
            <Input
              placeholder="VD: React, C#, English"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>
          <Field label="Danh mục">
            <Select value={category || '_none'} onValueChange={(v) => setCategory(v === '_none' ? '' : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn danh mục" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">— Chọn danh mục —</SelectItem>
                {SKILL_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Mức độ">
            <Select value={level || '_none'} onValueChange={(v) => setLevel(v === '_none' ? '' : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn mức độ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">— Chọn mức độ —</SelectItem>
                {PROFICIENCY_LEVELS.map((l) => (
                  <SelectItem key={l} value={l}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => void submit()} disabled={busy}>
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {editingId ? 'Cập nhật' : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Thêm kỹ năng
              </>
            )}
          </Button>
          {editingId && (
            <Button variant="outline" onClick={resetForm}>
              Hủy
            </Button>
          )}
        </div>
      </div>
    </SectionCard>
  );
};

// —— Education ——

const EducationSection: React.FC<{
  items: ProfileEducation[];
  onChanged: () => Promise<void>;
}> = ({ items, onChanged }) => {
  const empty = {
    schoolName: '',
    degree: '',
    fieldOfStudy: '',
    startDate: '',
    endDate: '',
    description: '',
  };
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!form.schoolName.trim()) {
      toast.error('Tên trường là bắt buộc');
      return;
    }
    setBusy(true);
    try {
      const payload = buildEducationPayload(form);
      if (editingId) {
        await profileService.updateEducation(editingId, payload);
        toast.success('Đã cập nhật học vấn');
      } else {
        await profileService.addEducation(payload);
        toast.success('Đã thêm học vấn');
      }
      setForm(empty);
      setEditingId(null);
      await onChanged();
    } catch (err) {
      toast.error(formatProfileMutationError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <CrudSection
      title="Học vấn"
      items={items}
      emptyText="Bạn chưa thêm học vấn."
      busy={busy}
      renderItem={(e) => (
        <>
          <p className="font-medium">{e.schoolName ?? e.institution}</p>
          <p className="text-sm text-muted-foreground">
            {[e.degree, e.fieldOfStudy].filter(Boolean).join(' · ')}
            {(e.startDate || e.endDate) &&
              ` · ${toDateInputValue(e.startDate)} – ${toDateInputValue(e.endDate) || 'nay'}`}
          </p>
        </>
      )}
      onEdit={(e) => {
        setEditingId(e.id);
        setForm({
          schoolName: e.schoolName ?? e.institution ?? '',
          degree: e.degree ?? '',
          fieldOfStudy: e.fieldOfStudy ?? '',
          startDate: toDateInputValue(e.startDate),
          endDate: toDateInputValue(e.endDate),
          description: e.description ?? '',
        });
      }}
      onDelete={async (id) => {
        await profileService.deleteEducation(id);
        await onChanged();
      }}
      formTitle={editingId ? 'Chỉnh sửa học vấn' : 'Thêm học vấn'}
      form={
        <>
          <Field label="Tên trường *">
            <Input
              value={form.schoolName}
              onChange={(e) => setForm((f) => ({ ...f, schoolName: e.target.value }))}
            />
          </Field>
          <div className="grid md:grid-cols-2 gap-3">
            <Field label="Bằng cấp">
              <Input
                value={form.degree}
                onChange={(e) => setForm((f) => ({ ...f, degree: e.target.value }))}
              />
            </Field>
            <Field label="Chuyên ngành">
              <Input
                value={form.fieldOfStudy}
                onChange={(e) =>
                  setForm((f) => ({ ...f, fieldOfStudy: e.target.value }))
                }
              />
            </Field>
            <Field label="Bắt đầu">
              <Input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
              />
            </Field>
            <Field label="Kết thúc">
              <Input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
              />
            </Field>
          </div>
          <Button onClick={() => void submit()} disabled={busy}>
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {editingId ? 'Cập nhật' : 'Thêm học vấn'}
          </Button>
        </>
      }
    />
  );
};

// —— Experience ——

const EMPLOYMENT_TYPES = [
  'Full-time',
  'Part-time',
  'Contract',
  'Freelance',
  'Internship',
] as const;

const ExperienceSection: React.FC<{
  items: ProfileWorkExperience[];
  onChanged: () => Promise<void>;
}> = ({ items, onChanged }) => {
  const empty = {
    companyName: '',
    jobTitle: '',
    employmentType: '',
    startDate: '',
    endDate: '',
    isCurrent: false,
    description: '',
    metricsSummary: '',
  };
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!form.companyName.trim() || !form.jobTitle.trim()) {
      toast.error('Công ty và chức danh là bắt buộc');
      return;
    }
    if (!form.startDate) {
      toast.error('Ngày bắt đầu là bắt buộc');
      return;
    }
    if (!form.isCurrent && form.endDate && form.endDate < form.startDate) {
      toast.error('Ngày kết thúc không được trước ngày bắt đầu');
      return;
    }
    setBusy(true);
    try {
      const payload = buildExperiencePayload(form);
      if (editingId) {
        await profileService.updateExperience(editingId, payload);
        toast.success('Đã cập nhật kinh nghiệm');
      } else {
        await profileService.addExperience(payload);
        toast.success('Đã thêm kinh nghiệm');
      }
      setForm(empty);
      setEditingId(null);
      await onChanged();
    } catch (err) {
      toast.error(formatProfileMutationError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <CrudSection
      title="Kinh nghiệm làm việc"
      items={items}
      emptyText="Bạn chưa thêm kinh nghiệm làm việc."
      busy={busy}
      renderItem={(e) => (
        <>
          <p className="font-medium">
            {e.jobTitle} · {e.companyName}
          </p>
          <p className="text-sm text-muted-foreground">
            {toDateInputValue(e.startDate)} –{' '}
            {e.isCurrent ? 'Hiện tại' : toDateInputValue(e.endDate) || '—'}
            {e.employmentType || e.industry
              ? ` · ${e.employmentType ?? e.industry}`
              : ''}
          </p>
        </>
      )}
      onEdit={(e) => {
        setEditingId(e.id);
        setForm({
          companyName: e.companyName ?? '',
          jobTitle: e.jobTitle ?? '',
          employmentType: e.industry ?? e.employmentType ?? '',
          startDate: toDateInputValue(e.startDate),
          endDate: toDateInputValue(e.endDate),
          isCurrent: e.isCurrent ?? false,
          description: e.description ?? '',
          metricsSummary: e.metricsSummary ?? '',
        });
      }}
      onDelete={async (id) => {
        await profileService.deleteExperience(id);
        await onChanged();
      }}
      formTitle={editingId ? 'Chỉnh sửa kinh nghiệm' : 'Thêm kinh nghiệm'}
      form={
        <>
          <div className="grid md:grid-cols-2 gap-3">
            <Field label="Công ty *">
              <Input
                value={form.companyName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, companyName: e.target.value }))
                }
              />
            </Field>
            <Field label="Chức danh *">
              <Input
                value={form.jobTitle}
                onChange={(e) => setForm((f) => ({ ...f, jobTitle: e.target.value }))}
              />
            </Field>
            <Field label="Ngành / loại hình">
              <Select
                value={form.employmentType || '_none'}
                onValueChange={(v) =>
                  setForm((f) => ({
                    ...f,
                    employmentType: v === '_none' ? '' : v,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn ngành" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">— Không chọn —</SelectItem>
                  {EMPLOYMENT_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Ngày bắt đầu *">
              <Input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
              />
            </Field>
            <Field label="Ngày kết thúc">
              <Input
                type="date"
                value={form.endDate}
                disabled={form.isCurrent}
                onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
              />
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              className="rounded border-gray-300"
              checked={form.isCurrent}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  isCurrent: e.target.checked,
                  endDate: e.target.checked ? '' : f.endDate,
                }))
              }
            />
            Đang làm việc tại đây
          </label>
          <Field label="Mô tả công việc">
            <Textarea
              rows={3}
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
            />
          </Field>
          <Button onClick={() => void submit()} disabled={busy}>
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {editingId ? 'Cập nhật kinh nghiệm' : 'Thêm kinh nghiệm'}
          </Button>
        </>
      }
    />
  );
};

// —— Links ——

const LinksSection: React.FC<{
  items: ProfileExternalLink[];
  onChanged: () => Promise<void>;
}> = ({ items, onChanged }) => {
  const [linkType, setLinkType] = useState<string>('LinkedIn');
  const [label, setLabel] = useState('');
  const [url, setUrl] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!linkType) {
      toast.error('Vui lòng chọn loại liên kết');
      return;
    }
    if (!url.trim()) {
      toast.error('URL là bắt buộc');
      return;
    }
    setBusy(true);
    try {
      const payload = buildLinkPayload(linkType, label, url);
      if (editingId) {
        await profileService.updateLink(editingId, payload);
        toast.success('Đã cập nhật liên kết');
      } else {
        await profileService.addLink(payload);
        toast.success('Đã thêm liên kết');
      }
      setLinkType('LinkedIn');
      setLabel('');
      setUrl('');
      setEditingId(null);
      await onChanged();
    } catch (err) {
      toast.error(formatProfileMutationError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <SectionCard title="Liên kết cá nhân" description="LinkedIn, GitHub, portfolio...">
      {items.length === 0 && (
        <EmptyHint>Bạn chưa thêm liên kết cá nhân.</EmptyHint>
      )}
      {items.length > 0 && (
        <ul className="space-y-2">
          {items.map((l) => (
            <li
              key={l.id}
              className="flex justify-between gap-3 rounded-xl border px-4 py-3"
            >
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{l.linkType ?? l.platform}</p>
                <a
                  href={l.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary font-medium truncate block hover:underline"
                >
                  {linkLabel(l)}
                </a>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    setEditingId(l.id);
                    setLinkType(l.linkType ?? l.platform ?? 'Other');
                    setLabel(linkLabel(l));
                    setUrl(l.url ?? '');
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  disabled={busy}
                  onClick={async () => {
                    if (!confirm('Xóa liên kết?')) return;
                    setBusy(true);
                    try {
                      await profileService.deleteLink(l.id);
                      toast.success('Đã xóa');
                      await onChanged();
                    } catch (err) {
                      toast.error(formatProfileMutationError(err));
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="rounded-xl border border-dashed bg-muted/30 p-4 space-y-4 mt-2">
        <p className="text-sm font-medium">
          {editingId ? 'Chỉnh sửa liên kết' : 'Thêm liên kết'}
        </p>
        <div className="grid md:grid-cols-3 gap-3">
          <Field label="Loại liên kết *">
            <Select value={linkType} onValueChange={setLinkType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LINK_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Nhãn hiển thị">
            <Input
              placeholder="VD: LinkedIn cá nhân"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
          </Field>
          <Field label="URL *">
            <Input
              type="url"
              placeholder="https://..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </Field>
        </div>
        <Button onClick={() => void submit()} disabled={busy}>
          {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {editingId ? 'Cập nhật' : 'Thêm liên kết'}
        </Button>
      </div>
    </SectionCard>
  );
};

// —— Shared CRUD ——

function CrudSection<T extends { id: string }>(props: {
  title: string;
  items: T[];
  emptyText: string;
  renderItem: (item: T) => React.ReactNode;
  onEdit: (item: T) => void;
  onDelete: (id: string) => Promise<void>;
  form: React.ReactNode;
  formTitle: string;
  busy: boolean;
}) {
  const { title, items, emptyText, renderItem, onEdit, onDelete, form, formTitle, busy } =
    props;

  return (
    <SectionCard title={title}>
      {items.length === 0 && <EmptyHint>{emptyText}</EmptyHint>}
      {items.length > 0 && (
        <ul className="space-y-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex justify-between gap-3 rounded-xl border px-4 py-3"
            >
              <div className="min-w-0 flex-1">{renderItem(item)}</div>
              <div className="flex gap-1 shrink-0">
                <Button size="icon" variant="ghost" onClick={() => onEdit(item)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  disabled={busy}
                  onClick={async () => {
                    if (!confirm('Xóa mục này?')) return;
                    try {
                      await onDelete(item.id);
                      toast.success('Đã xóa');
                    } catch (err) {
                      toast.error(formatProfileMutationError(err));
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <div className="rounded-xl border border-dashed bg-muted/30 p-4 space-y-4">
        <p className="text-sm font-medium">{formTitle}</p>
        {form}
      </div>
    </SectionCard>
  );
}

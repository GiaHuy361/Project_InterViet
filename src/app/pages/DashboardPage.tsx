import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { useApp } from '../contexts/AppContext';
import { Button } from '../components/ui/button';
import { PageState } from '../components/phase2/PageState';
import { DashboardPlanPanel } from '../components/dashboard/DashboardPlanPanel';
import { GradientProgress } from '../components/dashboard/GradientProgress';
import {
  FadeInImmediate,
  Stagger,
  StaggerItem,
  ScaleOnHover,
} from '../components/design-system/motion';
import * as dashboardService from '../../services/dashboardService';
import type {
  DashboardSummaryResponse,
  ActivityItem,
  QuotaCounter,
  RecentJobDescriptionResponse,
  RecentResumesResponse,
} from '../../lib/api/dashboardTypes';
import { ApiError, createApiError } from '../../lib/api/apiError';
import { formatLocalDate, formatLocalDateShort } from '../../utils/formatters';
import type { PlanKey } from '../../utils/planDisplay';
import {
  FileText,
  FileSearch,
  Mic,
  BarChart3,
  Upload,
  Lightbulb,
  Sparkles,
  ChevronRight,
  Activity,
  User,
  TrendingUp,
} from 'lucide-react';

const QUICK_STEPS = [
  {
    code: 'upload_cv',
    label: 'Tải CV',
    desc: 'Upload và phân tích CV',
    path: '/cv-matching',
    icon: Upload,
    gradient: 'from-blue-500 to-cyan-500',
    shadow: 'shadow-blue-500/30',
    ring: 'group-hover:ring-blue-400/40',
  },
  {
    code: 'create_jd',
    label: 'Thêm JD',
    desc: 'Phân tích Job Description',
    path: '/cv-matching',
    icon: FileSearch,
    gradient: 'from-violet-500 to-purple-600',
    shadow: 'shadow-violet-500/30',
    ring: 'group-hover:ring-violet-400/40',
  },
  {
    code: 'start_matching',
    label: 'Phỏng vấn',
    desc: 'Luyện tập với AI',
    path: '/phong-van-setup',
    icon: Mic,
    gradient: 'from-fuchsia-500 to-pink-500',
    shadow: 'shadow-fuchsia-500/30',
    ring: 'group-hover:ring-fuchsia-400/40',
  },
  {
    code: 'complete_profile',
    label: 'Báo cáo',
    desc: 'Xem kết quả',
    path: '/bao-cao',
    icon: BarChart3,
    gradient: 'from-emerald-500 to-teal-500',
    shadow: 'shadow-emerald-500/30',
    ring: 'group-hover:ring-emerald-400/40',
  },
] as const;

const CONTINUE_ITEMS = [
  {
    title: 'Tối ưu CV cho vị trí mục tiêu',
    desc: 'Tăng điểm matching với JD bạn quan tâm',
    path: '/cv-matching',
    gradient: 'from-blue-500 to-indigo-600',
    icon: FileText,
  },
  {
    title: 'Luyện phỏng vấn với AI',
    desc: '6 phong cách interviewer & stress-test',
    path: '/phong-van-setup',
    gradient: 'from-violet-500 to-purple-600',
    icon: Mic,
  },
  {
    title: 'Hoàn thiện hồ sơ ứng viên',
    desc: 'Kỹ năng, kinh nghiệm và liên kết mạng xã hội',
    path: '/cai-dat',
    gradient: 'from-emerald-500 to-teal-600',
    icon: User,
  },
];

function activityItems(data: { items?: ActivityItem[]; activities?: ActivityItem[] }) {
  return data.items ?? data.activities ?? [];
}

function resumeItems(data: { items?: RecentResumesResponse[] }) {
  return data.items ?? [];
}

function jobDescriptionItems(data: {
  items?: RecentJobDescriptionResponse[];
}) {
  return data.items ?? [];
}

function getActivityText(item: ActivityItem): string {
  return (
    item.description?.trim() ||
    item.actionKey?.replace(/_/g, ' ') ||
    'Hoạt động'
  );
}

function formatActivityAction(actionKey?: string): string {
  if (!actionKey) return 'Hoạt động';
  return actionKey
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function getActivityEntityLabel(entityType?: string): string {
  if (!entityType) return 'System';
  if (entityType === 'InterviewSession') return 'Interview';
  if (entityType === 'JobDescription') return 'JD';
  if (entityType === 'MatchSession') return 'Match';
  if (entityType === 'Resume') return 'CV';
  return entityType;
}

function getActivityGroup(item: ActivityItem): 'resume' | 'interview' | 'other' {
  const actionKey = (item.actionKey ?? '').toLowerCase();
  const entityType = (item.entityType ?? '').toLowerCase();

  if (entityType.includes('resume') || actionKey.includes('resume') || actionKey.includes('cv')) {
    return 'resume';
  }
  if (entityType.includes('interview') || actionKey.includes('interview')) {
    return 'interview';
  }
  return 'other';
}

function getActivityAccent(item: ActivityItem): string {
  switch (getActivityGroup(item)) {
    case 'resume':
      return 'from-blue-500 to-cyan-500';
    case 'interview':
      return 'from-fuchsia-500 to-pink-500';
    default:
      return 'from-slate-500 to-slate-700';
  }
}

function getActivityIcon(item: ActivityItem): React.ElementType {
  switch (getActivityGroup(item)) {
    case 'resume':
      return FileText;
    case 'interview':
      return Mic;
    default:
      return Activity;
  }
}

function formatParseStatus(status?: string): string {
  if (!status) return 'Chưa rõ';
  return status
    .replace(/_/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function formatFileSize(bytes?: number): string {
  if (!bytes || Number.isNaN(bytes)) return '0 KB';
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function num(value?: number | null): number {
  return value ?? 0;
}

function formatScore(value?: number | null): string {
  if (value == null || Number.isNaN(Number(value))) return '—';
  return Number(value).toFixed(0);
}

function stepCompleted(
  steps: DashboardSummaryResponse['onboardingSteps'],
  code: string
): boolean {
  return steps.some((s) => s.stepCode === code && s.status === 'completed');
}

export const DashboardPage: React.FC = () => {
  const { state } = useApp();
  const navigate = useNavigate();
  const user = state.user!;
  const displayName = user.name || 'bạn';
  const planKey = (user.subscriptionPlan ?? 'free') as PlanKey;

  const [summary, setSummary] = useState<DashboardSummaryResponse | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [resumes, setResumes] = useState<RecentResumesResponse[]>([]);
  const [jobDescriptions, setJobDescriptions] = useState<RecentJobDescriptionResponse[]>([]);
  const [quotaCounters, setQuotaCounters] = useState<QuotaCounter[]>([]);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState<ApiError | null>(null);
  const [activityLoading, setActivityLoading] = useState(true);
  const [resumeLoading, setResumeLoading] = useState(true);
  const [jobDescriptionLoading, setJobDescriptionLoading] = useState(true);
  const [quotaLoading, setQuotaLoading] = useState(true);

  const loadSummary = useCallback(async () => {
    setSummaryLoading(true);
    setSummaryError(null);
    try {
      setSummary(await dashboardService.getSummary());
    } catch (err) {
      setSummaryError(createApiError(err));
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  const loadActivity = useCallback(async () => {
    setActivityLoading(true);
    try {
      const data = await dashboardService.getActivity({ page: 1, pageSize: 8 });
      setActivities(activityItems(data));
    } catch {
      setActivities([]);
    } finally {
      setActivityLoading(false);
    }
  }, []);

  const loadResumes = useCallback(async () => {
    setResumeLoading(true);
    try {
      const data = await dashboardService.getRecentResumes();
      setResumes(resumeItems(data));
    } catch {
      setResumes([]);
    } finally {
      setResumeLoading(false);
    }
  }, []);

  const loadJobDescriptions = useCallback(async () => {
    setJobDescriptionLoading(true);
    try {
      const data = await dashboardService.getRecentJobDescriptions({ page: 1, pageSize: 10 });
      setJobDescriptions(jobDescriptionItems(data));
    } catch {
      setJobDescriptions([]);
    } finally {
      setJobDescriptionLoading(false);
    }
  }, []);

  const loadQuota = useCallback(async () => {
    setQuotaLoading(true);
    try {
      const data = await dashboardService.getQuota();
      setQuotaCounters(data.counters ?? []);
    } catch {
      setQuotaCounters([]);
    } finally {
      setQuotaLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSummary();
    void loadActivity();
    void loadResumes();
    void loadJobDescriptions();
    void loadQuota();
  }, [loadSummary, loadActivity, loadResumes, loadJobDescriptions, loadQuota]);

  const onboardingSteps = summary?.onboardingSteps ?? [];
  const completedQuick = useMemo(() => {
    if (onboardingSteps.length > 0) {
      return QUICK_STEPS.filter((s) => stepCompleted(onboardingSteps, s.code)).length;
    }
    const p = summary?.profile;
    if (!p) return 0;
    let n = 0;
    if (num(summary?.resumes?.total) > 0) n++;
    if (num(summary?.jobDescriptions?.total) > 0) n++;
    if (num(summary?.matches?.total) > 0) n++;
    if (p.hasProfile && p.hasSkills) n++;
    return n;
  }, [onboardingSteps, summary]);

  const progressPct = (completedQuick / QUICK_STEPS.length) * 100;

  const resumeActivities = activities.filter((a) => getActivityGroup(a) === 'resume');
  const interviewActivities = activities.filter((a) => getActivityGroup(a) === 'interview');

  const cvUsed =
    summary?.usageToday?.resumeActivityCount ?? user.cvOptimizationsDaily ?? 0;
  const interviewUsed = summary?.usageToday?.interviewUsed ?? user.interviewsDaily ?? 0;

  const planPanelProps = {
    planKey,
    cvUsed,
    interviewUsed,
    quotaCounters,
    quotaLoading,
  };

  return (
    <div className="space-y-6 pb-8">
      <FadeInImmediate>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight lg:text-4xl">
            Xin chào,{' '}
            <span className="text-gradient-brand">{displayName}</span>! 👋
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Chào mừng bạn quay lại{' '}
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              INTER-VIET
            </span>
          </p>
        </div>
      </FadeInImmediate>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px] xl:items-start">
        <div className="min-w-0 space-y-6">
          <PageState
            isLoading={summaryLoading}
            error={summaryError}
            onRetry={() => void loadSummary()}
          >
            {summary && (
              <>
                <FadeInImmediate delay={0.08}>
                  <div className="surface-card p-6 lg:p-7">
                    <motion.div
                      className="mb-5 flex flex-wrap items-center justify-between gap-3"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 text-white shadow-md shadow-blue-500/20">
                          <Sparkles className="h-4 w-4" />
                        </span>
                        Truy cập nhanh
                      </h2>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                        Hoàn thành{' '}
                        <span className="font-bold text-primary">
                          {completedQuick}/{QUICK_STEPS.length}
                        </span>
                      </span>
                    </motion.div>

                    <GradientProgress value={progressPct} className="mb-7" />

                    <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      {QUICK_STEPS.map((step) => {
                        const done =
                          onboardingSteps.length > 0
                            ? stepCompleted(onboardingSteps, step.code)
                            : false;
                        const Icon = step.icon;
                        return (
                          <StaggerItem key={step.code}>
                            <ScaleOnHover>
                              <motion.button
                                type="button"
                                onClick={() => navigate(step.path)}
                                whileTap={{ scale: 0.97 }}
                                className={`group relative w-full overflow-hidden rounded-xl border p-4 text-left transition-colors ${
                                  done
                                    ? 'border-primary/30 bg-primary/5 ring-1 ring-primary/20'
                                    : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900'
                                }`}
                              >
                                <div
                                  className={`mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${step.gradient} text-white shadow-lg ${step.shadow} transition-transform duration-300 group-hover:scale-105`}
                                >
                                  <Icon className="h-5 w-5" />
                                </div>
                                <p className="text-sm font-bold text-slate-900 dark:text-white">
                                  {step.label}
                                </p>
                                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                  {step.desc}
                                </p>
                                {done && (
                                  <span className="absolute right-3 top-3 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                                    ✓
                                  </span>
                                )}
                              </motion.button>
                            </ScaleOnHover>
                          </StaggerItem>
                        );
                      })}
                    </Stagger>
                  </div>
                </FadeInImmediate>

                <FadeInImmediate delay={0.12}>
                  <div className="surface-card border-blue-100/80 bg-gradient-to-r from-blue-50/90 via-white to-violet-50/80 p-4 dark:border-blue-900/40 dark:from-blue-950/30 dark:via-slate-900 dark:to-violet-950/30">
                    <div className="flex gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md shadow-orange-500/25">
                        <Lightbulb className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                          Duy trì momentum
                        </p>
                        <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">
                          Cập nhật CV và luyện phỏng vấn thường xuyên để giữ phong độ trước kỳ
                          tuyển dụng.
                        </p>
                      </div>
                    </div>
                  </div>
                </FadeInImmediate>

                <FadeInImmediate delay={0.16}>
                  <div className="surface-card p-6 lg:p-7">
                    <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      Tiếp tục phát triển
                    </h2>
                    <ul className="space-y-2">
                      {CONTINUE_ITEMS.map((item, i) => {
                        const ItemIcon = item.icon;
                        return (
                          <li
                            key={item.title}
                          >
                            <motion.button
                              type="button"
                              onClick={() => navigate(item.path)}
                              initial={{ opacity: 0, x: -12 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.2 + i * 0.06 }}
                              whileHover={{ x: 4 }}
                              className="group flex w-full items-center gap-3 rounded-xl border border-transparent p-3 text-left transition-colors hover:border-slate-200/80 hover:bg-white/60 dark:hover:border-slate-700 dark:hover:bg-slate-800/50"
                            >
                              <div
                                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${item.gradient} text-white shadow-md transition-transform group-hover:scale-105`}
                              >
                                <ItemIcon className="h-4 w-4" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                  {item.title}
                                </p>
                                <p className="truncate text-xs text-slate-500">{item.desc}</p>
                              </div>
                              <ChevronRight className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                            </motion.button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </FadeInImmediate>

                <Stagger className="grid gap-4 md:grid-cols-3">
                  <StaggerItem>
                    <MiniStat
                      label="CV đã tải"
                      value={num(summary.resumes?.total)}
                      sub={`${num(summary.resumes?.parsed)} đã phân tích`}
                      gradient=""
                    />
                  </StaggerItem>
                  <StaggerItem>
                    <MiniStat
                      label="JD"
                      value={num(summary.jobDescriptions?.total)}
                      sub="Job Description"
                      gradient=""
                    />
                  </StaggerItem>
                  <StaggerItem>
                    <MiniStat
                      label="Matching"
                      value={num(summary.matches?.total)}
                      sub={
                        num(summary.matches?.total) > 0
                          ? `TB ${formatScore(summary.matches?.averageScore)}%`
                          : 'Chưa có'
                      }
                      gradient=""
                    />
                  </StaggerItem>
                </Stagger>

                <div className="grid gap-4 xl:grid-cols-2">
                  <RecentItemsCard
                    title="CV đã thêm"
                    icon={FileText}
                    loading={resumeLoading}
                    empty="Chưa có CV nào được thêm."
                    actionLabel="Quản lý CV"
                    onViewAll={() => navigate('/cv-history')}
                  >
                    {resumes.slice(0, 5).map((item) => (
                      <div
                        key={item.resumeId}
                        className="flex gap-3 border-b border-slate-100 pb-3 last:border-0 dark:border-slate-800"
                      >
                        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-sm">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="truncate font-medium text-slate-900 dark:text-slate-100">
                              {item.title}
                            </span>
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${item.isActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>
                              {item.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                            <span>{formatParseStatus(item.parseStatus)}</span>
                            <span>•</span>
                            <span>{formatFileSize(item.fileSizeBytes)}</span>
                            <span>•</span>
                            <span>{formatLocalDate(item.updatedAt)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </RecentItemsCard>

                  <RecentItemsCard
                    title="JD đã thêm"
                    icon={FileSearch}
                    loading={jobDescriptionLoading}
                    empty="Chưa có JD nào được thêm."
                    actionLabel="Quản lý JD"
                    onViewAll={() => navigate('/jd-history')}
                  >
                    {jobDescriptions.slice(0, 5).map((item) => (
                      <div
                        key={item.id}
                        className="flex gap-3 border-b border-slate-100 pb-3 last:border-0 dark:border-slate-800"
                      >
                        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-sm">
                          <FileSearch className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="truncate font-medium text-slate-900 dark:text-slate-100">
                              {item.title}
                            </span>
                            <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
                              JD
                            </span>
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                            <span>{item.companyName}</span>
                            <span>•</span>
                            <span className="truncate">{item.location}</span>
                            <span>•</span>
                            <span>{formatLocalDate(item.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </RecentItemsCard>
                </div>
              </>
            )}
          </PageState>

          <div className="grid gap-4 lg:grid-cols-2">
            <ActivityGlassCard
              title="CV gần đây"
              icon={FileText}
              loading={activityLoading}
              empty="Chưa có CV gần đây."
              items={resumeActivities.slice(0, 3)}
              onViewAll={() => navigate('/cv-history')}
              delay={0.2}
            />
            <ActivityGlassCard
              title="Phỏng vấn gần đây"
              icon={Mic}
              loading={activityLoading}
              empty="Chưa có phỏng vấn gần đây."
              items={interviewActivities.slice(0, 3)}
              onViewAll={() => navigate('/bao-cao')}
              delay={0.25}
            />
          </div>

          <FadeInImmediate delay={0.28} className="xl:hidden">
            <div className="surface-card p-5">
              <h3 className="mb-3 flex items-center gap-2 font-bold">
                <Activity className="h-4 w-4 text-primary" />
                Hoạt động gần đây
              </h3>
              {activityLoading ? (
                <p className="text-sm text-slate-500">Đang tải...</p>
              ) : activities.length === 0 ? (
                <p className="text-sm text-slate-500">Bạn chưa có hoạt động gần đây.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {activities.slice(0, 5).map((item, i) => (
                    <li
                      key={item.id ?? i}
                      className="flex gap-3 border-b border-slate-100 pb-3 last:border-0 dark:border-slate-800"
                    >
                      <div
                        className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${getActivityAccent(item)} text-white shadow-sm`}
                      >
                        {React.createElement(getActivityIcon(item), { className: 'h-4 w-4' })}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="truncate font-medium text-slate-900 dark:text-slate-100">
                            {getActivityText(item)}
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </FadeInImmediate>

          <div className="xl:hidden">
            <DashboardPlanPanel {...planPanelProps} />
          </div>
        </div>

        <aside className="hidden min-w-0 xl:block">
          <div className="sticky top-6">
            <DashboardPlanPanel {...planPanelProps} />
          </div>
        </aside>
      </div>
    </div>
  );
};

const MiniStat: React.FC<{
  label: string;
  value: number;
  sub: string;
  gradient: string;
}> = ({ label, value, sub, gradient }) => (
  <motion.div
    className="surface-card p-5 text-center"
    whileHover={{ y: -2 }}
  >
    <motion.p
      className="text-3xl font-extrabold tabular-nums text-primary"
      initial={{ scale: 0.8, opacity: 0 }}
      whileInView={{ scale: 1, opacity: 1 }}
      viewport={{ once: true }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      {value}
    </motion.p>
    <p className="mt-1 text-xs font-bold text-slate-800 dark:text-slate-100">{label}</p>
    <p className="text-xs text-slate-500">{sub}</p>
  </motion.div>
);

const ActivityGlassCard: React.FC<{
  title: string;
  icon: React.ElementType;
  loading: boolean;
  empty: string;
  items: ActivityItem[];
  onViewAll: () => void;
  delay?: number;
}> = ({ title, icon: Icon, loading, empty, items, onViewAll, delay = 0 }) => (
  <FadeInImmediate delay={delay}>
    <div className="surface-card p-5 lg:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="h-4 w-4" />
          </span>
          {title}
        </h3>
        <Button
          variant="link"
          className="h-auto p-0 text-xs font-semibold text-primary"
          onClick={onViewAll}
        >
          Xem tất cả
        </Button>
      </div>
      {loading ? (
        <motion.div
          className="h-20 rounded-lg bg-slate-100 dark:bg-slate-800"
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ repeat: Infinity, duration: 1.2 }}
        />
      ) : items.length === 0 ? (
        <p className="text-sm text-slate-500">{empty}</p>
      ) : (
        <ul className="space-y-3">
          {items.map((item, i) => (
            <li
              key={item.id ?? i}
            >
              <motion.div
                className="flex gap-3 border-b border-slate-100 pb-3 text-sm last:border-0 dark:border-slate-800"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <div
                  className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${getActivityAccent(item)} text-white shadow-sm`}
                >
                  {React.createElement(getActivityIcon(item), { className: 'h-4 w-4' })}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate font-medium text-slate-900 dark:text-slate-100">
                      {getActivityText(item)}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span>•</span>
                    <span>{item.createdAt ? formatLocalDateShort(item.createdAt) : '—'}</span>
                  </div>
                </div>
              </motion.div>
            </li>
          ))}
        </ul>
      )}
    </div>
  </FadeInImmediate>
);

const RecentItemsCard: React.FC<{
  title: string;
  icon: React.ElementType;
  loading: boolean;
  empty: string;
  actionLabel: string;
  onViewAll: () => void;
  children: React.ReactNode;
}> = ({ title, icon: Icon, loading, empty, actionLabel, onViewAll, children }) => (
  <div className="surface-card p-5 lg:p-6">
    <div className="mb-4 flex items-center justify-between gap-3">
      <h3 className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </span>
        {title}
      </h3>
      <Button
        variant="link"
        className="h-auto p-0 text-xs font-semibold text-primary"
        onClick={onViewAll}
      >
        {actionLabel}
      </Button>
    </div>
    {loading ? (
      <motion.div
        className="h-24 rounded-lg bg-slate-100 dark:bg-slate-800"
        animate={{ opacity: [0.4, 0.8, 0.4] }}
        transition={{ repeat: Infinity, duration: 1.2 }}
      />
    ) : React.Children.count(children) === 0 ? (
      <p className="text-sm text-slate-500">{empty}</p>
    ) : (
      <div className="space-y-3">{children}</div>
    )}
  </div>
);

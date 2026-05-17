import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { useApp } from '../contexts/AppContext';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { PageState } from '../components/phase2/PageState';
import { PlanComparisonTable } from '../components/plans/PlanComparisonTable';
import { UpgradePlanCard } from '../components/plans/UpgradePlanCard';
import * as subscriptionService from '../../services/subscriptionService';
import * as plansService from '../../services/plansService';
import type { CurrentSubscription, PlanResponse } from '../../lib/api/phase2Types';
import { ApiError, createApiError } from '../../lib/api/apiError';
import { formatLocalDateShort } from '../../utils/formatters';
import { isDevBillingEnabled, DEV_PLAN_KEYS } from '../../config/devBilling';
import {
  mergePlansForDisplay,
  getUpgradePlans,
  getCurrentDisplayPlan,
  resolvePlanKeyFromSubscription,
  formatPlanPrice,
  getPlanQuota,
  type PlanKey,
} from '../../utils/planDisplay';
import { CheckCircle, Loader2, Sparkles, XCircle, Crown } from 'lucide-react';
import { AppPageHeader } from '../components/design-system/AppPageHeader';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';

export const CandidateSubscriptionPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = useApp();
  const user = state.user;

  const [subscription, setSubscription] = useState<CurrentSubscription | null>(null);
  const [apiPlans, setApiPlans] = useState<PlanResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [devPlanKey, setDevPlanKey] = useState<string>('monthly');
  const [devLoading, setDevLoading] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);

  const displayPlans = useMemo(() => mergePlansForDisplay(apiPlans), [apiPlans]);
  const currentPlanKey = useMemo(
    () => resolvePlanKeyFromSubscription(subscription, apiPlans),
    [subscription, apiPlans]
  );
  const currentPlan = useMemo(
    () => getCurrentDisplayPlan(displayPlans, currentPlanKey),
    [displayPlans, currentPlanKey]
  );
  const upgradePlans = useMemo(() => getUpgradePlans(displayPlans), [displayPlans]);
  const isPaidPlan = currentPlanKey !== 'free';
  const quota = getPlanQuota(currentPlanKey);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [sub, planList] = await Promise.all([
        subscriptionService.getCurrentSubscription(),
        plansService.getPlans(),
      ]);
      setSubscription(sub);
      setApiPlans(planList);
    } catch (err) {
      setError(createApiError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  useEffect(() => {
    const scrollTo = (location.state as { scrollTo?: string } | null)?.scrollTo;
    if (scrollTo === 'comparison') {
      requestAnimationFrame(() => {
        document.getElementById('comparison-section')?.scrollIntoView({ behavior: 'smooth' });
      });
    }
  }, [location.state, loading]);

  const scrollToPlans = () => {
    document.getElementById('upgrade-plans-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToComparison = () => {
    document.getElementById('comparison-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleDevActivate = async () => {
    setDevLoading(true);
    try {
      await subscriptionService.devActivatePlan({
        planKey: devPlanKey as (typeof DEV_PLAN_KEYS)[number],
      });
      toast.success('Đã kích hoạt gói test thành công');
      await loadAll();
    } catch (err) {
      toast.error(createApiError(err).getUserMessage());
    } finally {
      setDevLoading(false);
    }
  };

  const handleCancel = async () => {
    setCancelLoading(true);
    try {
      await subscriptionService.cancelSubscription();
      toast.success('Đã gửi yêu cầu hủy gói');
      setCancelOpen(false);
      await loadAll();
    } catch (err) {
      toast.error(createApiError(err).getUserMessage());
    } finally {
      setCancelLoading(false);
    }
  };

  const handleSelectPlan = (targetKey: PlanKey) => {
    if (targetKey === currentPlanKey) return;

    if (isDevBillingEnabled) {
      setDevPlanKey(targetKey);
      document.getElementById('dev-billing-block')?.scrollIntoView({ behavior: 'smooth' });
      toast.info(`Chọn gói "${CANDIDATE_PLAN_LABEL[targetKey]}" và bấm Kích hoạt bên dưới.`);
      return;
    }

    navigate('/thanh-toan', { state: { selectedPlan: targetKey } });
  };

  const cvUsed = user?.cvOptimizationsDaily ?? 0;
  const interviewUsed = user?.interviewsDaily ?? 0;
  const cvLimit = quota.cv;
  const interviewLimit = quota.interview;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      <AppPageHeader
        title="Gói dịch vụ"
        subtitle="Quản lý gói hiện tại, hạn mức sử dụng và nâng cấp tài khoản"
        icon={Crown}
        iconGradient="from-blue-500 to-violet-600"
        actions={
          <Button variant="outline" className="hover-lift" onClick={scrollToComparison}>
            Xem bảng so sánh
          </Button>
        }
      />

      <PageState isLoading={loading} error={error} onRetry={() => void loadAll()}>
        <Card className="surface-card p-6">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-6 dark:border-slate-800">
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Gói hiện tại
              </p>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{currentPlan.name}</h2>
              <p className="mt-1 text-sm text-muted-foreground max-w-xl">{currentPlan.description}</p>
            </div>
            <Badge variant={isPaidPlan ? 'default' : 'secondary'} className="shrink-0 px-4 py-2 text-sm">
              {formatPlanPrice(currentPlan)}
              {currentPlan.priceFromApi > 0 ? `/${currentPlan.cycle}` : ''}
            </Badge>
          </div>

          {subscription && isPaidPlan && (
            <div className="mb-6 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm space-y-1 dark:border-slate-700 dark:bg-slate-800/50">
              <p>
                <span className="text-muted-foreground">Kỳ hiện tại:</span>{' '}
                {formatLocalDateShort(subscription.currentPeriodStartsAt)} –{' '}
                {formatLocalDateShort(subscription.currentPeriodEndsAt)}
              </p>
              <p>
                <span className="text-muted-foreground">Trạng thái:</span> {subscription.status}
                {subscription.cancelAtPeriodEnd ? ' · Hủy vào cuối kỳ' : ''}
              </p>
            </div>
          )}

          <div className="mb-6">
            <h4 className="font-semibold mb-3 text-foreground">Tính năng hiện tại:</h4>
            <div className="grid md:grid-cols-2 gap-2">
              {currentPlan.features.map((feature, i) => (
                <div className="flex items-start gap-2" key={i}>
                  <CheckCircle size={16} className="mt-0.5 shrink-0 text-primary" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {currentPlanKey !== 'yearly' && user && (
            <div className="mb-6 rounded-lg border border-slate-100 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-800/40">
              <h4 className="font-semibold mb-3 text-foreground">
                {currentPlanKey === 'free'
                  ? 'Mức sử dụng (toàn bộ):'
                  : 'Mức sử dụng hôm nay:'}
              </h4>
              <div className="space-y-3">
                <UsageBar label="Tối ưu CV" used={cvUsed} limit={cvLimit} />
                <UsageBar label="Phỏng vấn AI" used={interviewUsed} limit={interviewLimit} />
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            {currentPlanKey === 'free' ? (
              <>
                <Button onClick={scrollToPlans}>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Nâng cấp gói
                </Button>
                <Button variant="outline" onClick={scrollToComparison}>
                  Xem bảng so sánh
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={scrollToPlans}>
                  Xem các gói khác
                </Button>
                {subscription?.status === 'active' && !subscription.cancelAtPeriodEnd && (
                  <Button
                    variant="outline"
                    className="text-destructive border-destructive/30"
                    onClick={() => setCancelOpen(true)}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Hủy gói
                  </Button>
                )}
              </>
            )}
          </div>
        </Card>

        {isDevBillingEnabled && (
          <Card
            id="dev-billing-block"
            className="p-6 border-dashed border-amber-300 bg-amber-50/40 dark:bg-amber-950/20"
          >
            <h3 className="font-semibold text-amber-900 dark:text-amber-200 mb-1">
              Dev: Kích hoạt gói test
            </h3>
            <p className="text-sm text-amber-800 dark:text-amber-300/90 mb-4">
              Chỉ hiển thị khi <code className="text-xs">VITE_ENABLE_DEV_BILLING=true</code>
            </p>
            <div className="flex flex-wrap gap-3 items-end">
              <Select value={devPlanKey} onValueChange={setDevPlanKey}>
                <SelectTrigger className="w-[200px] bg-white dark:bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DEV_PLAN_KEYS.map((k) => (
                    <SelectItem key={k} value={k}>
                      {CANDIDATE_PLAN_LABEL[k as PlanKey] ?? k}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={() => void handleDevActivate()} disabled={devLoading}>
                {devLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Kích hoạt
              </Button>
            </div>
          </Card>
        )}

        <div id="upgrade-plans-section" className="scroll-mt-6">
          <h2 className="text-2xl font-bold mb-6">
            {currentPlanKey === 'free' ? 'Các gói phù hợp với bạn' : 'Các gói nâng cấp'}
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {upgradePlans.map((plan) => (
              <UpgradePlanCard
                key={plan.planKey}
                plan={plan}
                currentPlanKey={currentPlanKey}
                onSelect={() => handleSelectPlan(plan.planKey)}
              />
            ))}
          </div>
        </div>

        <PlanComparisonTable />
      </PageState>

      <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hủy gói đăng ký?</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn vẫn dùng được gói hiện tại đến hết kỳ. Sau đó tài khoản chuyển về gói miễn phí.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelLoading}>Không</AlertDialogCancel>
            <AlertDialogAction
              disabled={cancelLoading}
              onClick={(e) => {
                e.preventDefault();
                void handleCancel();
              }}
            >
              {cancelLoading ? 'Đang xử lý...' : 'Xác nhận hủy'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

const CANDIDATE_PLAN_LABEL: Record<PlanKey, string> = {
  free: 'Miễn phí',
  monthly: 'Gói Tháng',
  quarterly: 'Gói Quý',
  yearly: 'Gói Năm',
};

const UsageBar: React.FC<{
  label: string;
  used: number;
  limit: number | null;
}> = ({ label, used, limit }) => {
  const unlimited = limit == null;
  const pct = unlimited || !limit ? 0 : Math.min(100, (used / limit) * 100);

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span>{label}</span>
        <span className="font-medium tabular-nums">
          {unlimited ? `${used} / ∞` : `${used}/${limit} lần`}
        </span>
      </div>
      {!unlimited && <Progress value={pct} className="h-2" />}
    </div>
  );
};

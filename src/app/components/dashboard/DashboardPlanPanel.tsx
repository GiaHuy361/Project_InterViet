import React, { useMemo } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { CheckCircle, Crown, Sparkles } from 'lucide-react';
import { CANDIDATE_PLANS } from '../../config/pricing';
import { getPlanQuota } from '../../../utils/planDisplay';
import type { PlanKey } from '../../../utils/planDisplay';
import type { QuotaCounter } from '../../../lib/api/phase2Types';
import { getFeatureLabel, isUnlimitedLimit } from '../../../utils/quotaLabels';
import { GradientProgress } from './GradientProgress';
import { cn } from '../ui/utils';

interface DashboardPlanPanelProps {
  planKey: PlanKey;
  cvUsed: number;
  interviewUsed: number;
  quotaCounters?: QuotaCounter[];
  quotaLoading?: boolean;
  className?: string;
}

function pickCounter(
  counters: QuotaCounter[],
  matchers: string[]
): QuotaCounter | undefined {
  return counters.find((c) =>
    matchers.some((m) => c.featureKey.toLowerCase().includes(m))
  );
}

export const DashboardPlanPanel: React.FC<DashboardPlanPanelProps> = ({
  planKey,
  cvUsed,
  interviewUsed,
  quotaCounters = [],
  quotaLoading,
  className,
}) => {
  const navigate = useNavigate();
  const plan = CANDIDATE_PLANS[planKey] ?? CANDIDATE_PLANS.free;
  const fallbackQuota = getPlanQuota(planKey);

  const { cvUsedDisplay, cvLimitDisplay, interviewUsedDisplay, interviewLimitDisplay } =
    useMemo(() => {
      const cvCounter = pickCounter(quotaCounters, ['cv', 'resume', 'optimize']);
      const interviewCounter = pickCounter(quotaCounters, ['interview']);

      const cvLimit =
        cvCounter && !isUnlimitedLimit(cvCounter.limitValue)
          ? cvCounter.limitValue
          : fallbackQuota.cv;
      const interviewLimit =
        interviewCounter && !isUnlimitedLimit(interviewCounter.limitValue)
          ? interviewCounter.limitValue
          : fallbackQuota.interview;

      return {
        cvUsedDisplay: cvCounter?.usedValue ?? cvUsed,
        cvLimitDisplay: cvLimit,
        interviewUsedDisplay: interviewCounter?.usedValue ?? interviewUsed,
        interviewLimitDisplay: interviewLimit,
      };
    }, [quotaCounters, cvUsed, interviewUsed, fallbackQuota]);

  const showUsage = planKey !== 'yearly';

  return (
    <Card className={cn('surface-card gap-0 overflow-hidden p-0', className)}>
      <div className="border-b border-slate-100 bg-gradient-to-r from-blue-50/90 to-violet-50/70 px-5 py-4 dark:border-slate-800 dark:from-blue-950/40 dark:to-violet-950/30">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 text-white shadow-md shadow-blue-500/25">
            <Crown className="h-4 w-4" />
          </span>
          <p className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">
            Gói hiện tại
          </p>
        </div>
        <div className="mt-3 flex items-baseline justify-between gap-2">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Gói {plan.name}</h3>
          <span className="text-xl font-extrabold tabular-nums text-gradient-brand">
            {plan.price === 0 ? '0đ' : `${plan.price.toLocaleString('vi-VN')}đ`}
          </span>
        </div>
      </div>

      <div className="space-y-4 p-5">
        {quotaLoading ? (
          <div className="space-y-3">
            <div className="h-10 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
            <div className="h-10 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
          </div>
        ) : showUsage ? (
          <div className="space-y-4">
            <UsageRow label="Tối ưu CV" used={cvUsedDisplay} limit={cvLimitDisplay} />
            <UsageRow
              label={getFeatureLabel('interview.ai')}
              used={interviewUsedDisplay}
              limit={interviewLimitDisplay}
            />
          </div>
        ) : (
          <p className="rounded-xl bg-emerald-50 px-3 py-2.5 text-sm font-medium text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
            Không giới hạn tối ưu CV & phỏng vấn AI
          </p>
        )}

        {planKey === 'free' && (
          <button
            type="button"
            onClick={() => navigate('/goi-dich-vu')}
            className="w-full rounded-xl border border-blue-200/80 bg-gradient-to-r from-blue-50 to-violet-50 px-3 py-2.5 text-left text-xs font-medium text-blue-900 transition-colors hover:border-blue-300 dark:border-blue-800 dark:from-blue-950/50 dark:to-violet-950/40 dark:text-blue-200"
          >
            Hết lượt? Xem quảng cáo để nhận thêm lượt →
          </button>
        )}

        <ul className="space-y-2">
          {plan.features.slice(0, 5).map((text, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
              <CheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
              <span>{text}</span>
            </li>
          ))}
        </ul>

        <Button
          className="btn-brand-gradient h-11 w-full rounded-xl font-semibold"
          onClick={() => navigate('/goi-dich-vu')}
        >
          <Sparkles className="mr-2 h-4 w-4" />
          Nâng cấp gói
        </Button>
        <Button
          variant="outline"
          className="h-10 w-full rounded-xl border-slate-200 bg-white font-medium hover:border-blue-300 hover:bg-blue-50/50 dark:border-slate-600"
          onClick={() => navigate('/goi-dich-vu', { state: { scrollTo: 'comparison' } })}
        >
          Xem bảng giá
        </Button>
      </div>
    </Card>
  );
};

const UsageRow: React.FC<{
  label: string;
  used: number;
  limit: number | null;
}> = ({ label, used, limit }) => {
  const unlimited = limit == null;
  const pct = unlimited || !limit ? 0 : Math.min(100, (used / limit) * 100);

  return (
    <div>
      <div className="mb-1.5 flex justify-between text-sm">
        <span className="font-semibold text-slate-800 dark:text-slate-100">{label}</span>
        <span className="tabular-nums font-medium text-slate-600">
          {unlimited ? `${used} / ∞` : `${used}/${limit} lần`}
        </span>
      </div>
      {!unlimited && <GradientProgress value={pct} className="h-2" />}
    </div>
  );
};

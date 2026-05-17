import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { useApp } from '../contexts/AppContext';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Check, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import * as plansService from '../../services/plansService';
import * as subscriptionService from '../../services/subscriptionService';
import { PlanComparisonTable } from '../components/plans/PlanComparisonTable';
import { createApiError } from '../../lib/api/apiError';
import {
  mergePlansForDisplay,
  resolvePlanKeyFromSubscription,
  formatPlanPrice,
  type PlanKey,
} from '../../utils/planDisplay';
import { getPlanActionType, getPlanCTAText } from '../config/pricing';

export const PricingPage: React.FC = () => {
  const { state } = useApp();
  const navigate = useNavigate();
  const [apiPlans, setApiPlans] = useState<Awaited<ReturnType<typeof plansService.getPlans>>>([]);
  const [subscription, setSubscription] = useState<Awaited<
    ReturnType<typeof subscriptionService.getCurrentSubscription>
  > | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const displayPlans = useMemo(() => mergePlansForDisplay(apiPlans), [apiPlans]);
  const currentPlanKey = useMemo(
    () => resolvePlanKeyFromSubscription(subscription, apiPlans),
    [subscription, apiPlans]
  );

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const list = await plansService.getPlans();
        setApiPlans(list);
        if (state.user) {
          const sub = await subscriptionService.getCurrentSubscription();
          setSubscription(sub);
        }
      } catch (err) {
        setError(createApiError(err).getUserMessage());
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [state.user]);

  const handleSelectPlan = (planKey: PlanKey) => {
    if (!state.user) {
      navigate('/dang-ky');
      return;
    }
    if (planKey === currentPlanKey) {
      toast.info('Bạn đang dùng gói này');
      return;
    }
    navigate('/goi-dich-vu', { state: { highlightPlan: planKey } });
  };

  const scrollToComparison = () => {
    document.getElementById('comparison-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div>
      <section className="bg-gradient-to-br from-blue-600 to-purple-600 py-18 text-white">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <h1 className="mb-4 text-4xl font-bold md:text-5xl">Chọn gói phù hợp với bạn</h1>
          <p className="mx-auto max-w-2xl text-lg text-blue-100">
            Mô tả dễ hiểu cho ứng viên · Giá cập nhật từ hệ thống
          </p>
          {state.user && (
            <Button variant="secondary" className="mt-7" onClick={() => navigate('/goi-dich-vu')}>
              Quản lý gói trong tài khoản
            </Button>
          )}
        </div>
      </section>

      <section className="py-16 bg-gray-50 dark:bg-background">
        <div className="max-w-7xl mx-auto px-6">
          {loading && (
            <p className="text-center text-muted-foreground flex items-center justify-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Đang tải bảng giá...
            </p>
          )}
          {error && <p className="text-center text-destructive">{error}</p>}

          {!loading && !error && (
            <>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                {displayPlans.map((plan) => {
                  const actionType = getPlanActionType(currentPlanKey, plan.planKey);
                  const isCurrent = actionType === 'current';
                  const isQuarterly = plan.planKey === 'quarterly';
                  const isYearly = plan.planKey === 'yearly';

                  const borderClass = isCurrent
                    ? 'ring-2 ring-primary'
                    : isQuarterly
                      ? 'border-2 border-purple-200'
                      : isYearly
                        ? 'border-2 border-green-200'
                        : '';

                  return (
                    <Card
                      key={plan.planKey}
                      className={`relative flex h-full flex-col p-6 ${borderClass}`}
                    >
                      <div className="mb-4 flex min-h-8 items-start justify-center md:justify-start">
                        {plan.badge && !isCurrent ? (
                          <div
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-bold text-white whitespace-nowrap ${
                              isQuarterly
                                ? 'bg-purple-600'
                                : isYearly
                                  ? 'bg-green-600'
                                  : 'bg-primary'
                            }`}
                          >
                            {plan.badge}
                          </div>
                        ) : isCurrent ? (
                          <Badge variant="secondary" className="w-fit">
                            Đang dùng
                          </Badge>
                        ) : (
                          <div className="h-8" />
                        )}
                      </div>

                      <h3 className="mb-1 text-xl font-bold">{plan.name}</h3>
                      <p className="text-sm text-muted-foreground min-h-[40px] mb-4">
                        {plan.description}
                      </p>

                      <div className="mb-4">
                        <span className="text-3xl font-bold">{formatPlanPrice(plan)}</span>
                        {plan.priceFromApi > 0 && (
                          <span className="text-muted-foreground text-sm">/{plan.cycle}</span>
                        )}
                        {plan.savings && (
                          <p className="text-xs text-muted-foreground mt-1">{plan.savings}</p>
                        )}
                      </div>

                      <ul className="space-y-2 flex-1 text-sm mb-4 border-t pt-4">
                        {plan.features.slice(0, 8).map((text, i) => (
                          <li key={i} className="flex gap-2">
                            <Check className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                            <span className="text-xs leading-relaxed">{text}</span>
                          </li>
                        ))}
                        {plan.limitations?.slice(0, 2).map((lim, i) => (
                          <li key={`lim-${i}`} className="flex gap-2 text-muted-foreground">
                            <X className="h-4 w-4 shrink-0 mt-0.5" />
                            <span className="text-xs">{lim}</span>
                          </li>
                        ))}
                      </ul>

                      <Button
                        className="w-full mt-auto"
                        variant={isCurrent ? 'outline' : 'default'}
                        disabled={isCurrent}
                        onClick={() => handleSelectPlan(plan.planKey)}
                      >
                        {state.user
                          ? getPlanCTAText(actionType, plan.planKey)
                          : plan.planKey === 'free'
                            ? 'Bắt đầu miễn phí'
                            : `Chọn ${plan.name}`}
                      </Button>
                    </Card>
                  );
                })}
              </div>

              <div className="text-center mb-8">
                <Button variant="outline" onClick={scrollToComparison}>
                  Xem bảng so sánh chi tiết
                </Button>
              </div>

              <PlanComparisonTable />
            </>
          )}
        </div>
      </section>
    </div>
  );
};

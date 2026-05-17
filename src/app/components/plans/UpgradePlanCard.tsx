import React from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Check, X } from 'lucide-react';
import {
  formatPlanPrice,
  getPlanActionType,
  getPlanCTAText,
  type DisplayPlan,
  type PlanKey,
} from '../../../utils/planDisplay';

export const UpgradePlanCard: React.FC<{
  plan: DisplayPlan;
  currentPlanKey: PlanKey;
  onSelect: () => void;
}> = ({ plan, currentPlanKey, onSelect }) => {
  const actionType = getPlanActionType(currentPlanKey, plan.planKey);
  const isCurrent = actionType === 'current';
  const isQuarterly = plan.planKey === 'quarterly';
  const isYearly = plan.planKey === 'yearly';

  const borderClass = isCurrent
    ? 'border-2 border-primary shadow-lg'
    : isQuarterly
      ? 'border-2 border-purple-200 dark:border-purple-800'
      : isYearly
        ? 'border-2 border-green-200 dark:border-green-800'
        : 'border border-border/80';

  return (
    <Card className={`p-6 flex flex-col relative h-full bg-card shadow-sm ${borderClass}`}>
      {plan.badge && !isCurrent && (
        <div
          className={`absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 text-xs font-bold rounded-full text-white whitespace-nowrap ${
            isQuarterly ? 'bg-purple-600' : isYearly ? 'bg-green-600' : 'bg-primary'
          }`}
        >
          {plan.badge}
        </div>
      )}
      {isCurrent && (
        <Badge className="w-fit mb-3 mt-1 bg-primary text-primary-foreground">Gói hiện tại</Badge>
      )}
      {!isCurrent && plan.badge && <div className="h-3" />}

      <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
      <p className="text-sm text-muted-foreground mb-4 min-h-[60px]">{plan.description}</p>

      <div className="mb-4">
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold tracking-tight">{formatPlanPrice(plan)}</span>
          {plan.priceFromApi > 0 && <span className="text-muted-foreground">/tháng</span>}
        </div>
        {plan.savings && (
          <p className="text-xs text-muted-foreground mt-1">{plan.savings}</p>
        )}
      </div>

      <Button
        className={`w-full mb-4 ${!isCurrent && (actionType === 'upgrade' || actionType === 'select') ? 'btn-brand-gradient rounded-xl font-semibold' : ''}`}
        variant={isCurrent ? 'secondary' : actionType === 'upgrade' || actionType === 'select' ? 'default' : 'outline'}
        disabled={isCurrent}
        onClick={onSelect}
      >
        {getPlanCTAText(actionType, plan.planKey)}
      </Button>

      <div className="space-y-2 flex-1 text-sm border-t pt-4">
        {plan.features.map((feature, i) => (
          <div key={i} className="flex items-start gap-2">
            <Check className="h-4 w-4 text-green-600 shrink-0 mt-0.5" size={14} />
            <span className="text-xs leading-relaxed">{feature}</span>
          </div>
        ))}
        {plan.limitations?.map((lim, i) => (
          <div key={`lim-${i}`} className="flex items-start gap-2 text-muted-foreground">
            <X className="h-4 w-4 shrink-0 mt-0.5" size={14} />
            <span className="text-xs">{lim}</span>
          </div>
        ))}
      </div>
    </Card>
  );
};

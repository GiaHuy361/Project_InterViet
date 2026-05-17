import React from 'react';
import { useNavigate } from 'react-router';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { AlertCircle, Crown } from 'lucide-react';
import type { QuotaCounter } from '../../../lib/api/phase2Types';
import {
  formatQuotaUsed,
  getFeatureLabel,
  isUnlimitedLimit,
} from '../../../utils/quotaLabels';

interface QuotaWidgetProps {
  counters: QuotaCounter[];
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  compact?: boolean;
}

export const QuotaWidget: React.FC<QuotaWidgetProps> = ({
  counters,
  isLoading,
  error,
  onRetry,
  compact,
}) => {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <Card className={compact ? 'p-4' : 'p-6'}>
        <p className="text-sm text-gray-500">Đang tải hạn mức...</p>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`${compact ? 'p-4' : 'p-6'} border-amber-200 bg-amber-50/50`}>
        <div className="flex items-start gap-2 text-sm text-amber-900">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Không tải được hạn mức</p>
            <p className="text-xs mt-0.5 text-amber-800">{error}</p>
            {onRetry && (
              <Button variant="link" size="sm" className="h-auto p-0 mt-1" onClick={onRetry}>
                Thử lại
              </Button>
            )}
          </div>
        </div>
      </Card>
    );
  }

  if (!counters.length) {
    return (
      <Card className={compact ? 'p-4' : 'p-6'}>
        <p className="text-sm text-gray-500">Chưa có thông tin hạn mức.</p>
      </Card>
    );
  }

  return (
    <Card className={compact ? 'p-4' : 'p-6'}>
      <h3 className="font-semibold mb-4">Hạn mức sử dụng</h3>
      <div className="space-y-4">
        {counters.map((c) => {
          const unlimited = isUnlimitedLimit(c.limitValue);
          const pct =
            unlimited || c.limitValue === 0
              ? 0
              : Math.min(100, (c.usedValue / c.limitValue) * 100);
          const depleted = !unlimited && c.remainingValue <= 0;

          return (
            <div key={`${c.featureKey}-${c.periodKey ?? c.periodType}`}>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium">{getFeatureLabel(c.featureKey)}</span>
                <span className="text-gray-600">
                  {formatQuotaUsed(c.usedValue, c.limitValue)}
                  {unlimited && ' (không giới hạn)'}
                </span>
              </div>
              {!unlimited && <Progress value={pct} className="h-2" />}
              <p className="text-xs text-gray-500 mt-1">
                Gói: {c.planKey ?? '—'} · Chu kỳ: {c.periodType}
                {c.periodKey ? ` (${c.periodKey})` : ''}
              </p>
              {depleted && (
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2 w-full"
                  onClick={() => navigate('/goi-dich-vu')}
                >
                  <Crown className="mr-2 h-3.5 w-3.5" />
                  Nâng cấp gói
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
};

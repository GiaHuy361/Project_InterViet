import React from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { ArrowLeft, CreditCard, Sparkles } from 'lucide-react';
import { isDevBillingEnabled } from '../../config/devBilling';
import { AppPageHeader } from '../components/design-system/AppPageHeader';

/**
 * Phase 2: No real payment gateway. Redirect users to subscription / dev activate.
 */
export const BillingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      <Button variant="ghost" size="sm" className="-ml-2" onClick={() => navigate(-1)}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        Quay lại
      </Button>

      <AppPageHeader
        title="Thanh toán trực tuyến"
        subtitle={
          isDevBillingEnabled
            ? 'Cổng thanh toán chưa tích hợp — dùng Dev activate trên trang Gói dịch vụ để test local.'
            : 'Cổng thanh toán (VNPay, MoMo, thẻ) sẽ sớm được tích hợp. Quản lý gói tại trang Gói dịch vụ.'
        }
        icon={CreditCard}
        iconGradient="from-amber-500 to-orange-600"
      />

      <Card className="glass-card rounded-2xl p-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-orange-500/25">
          <Sparkles className="h-7 w-7" />
        </div>
        <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-md mx-auto">
          {isDevBillingEnabled
            ? 'Bật VITE_ENABLE_DEV_BILLING=true để kích hoạt gói test mà không cần cổng thanh toán.'
            : 'Khi thanh toán sẵn sàng, bạn sẽ hoàn tất nâng cấp ngay tại đây.'}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button className="btn-glow" onClick={() => navigate('/goi-dich-vu')}>
            Đến Gói dịch vụ
          </Button>
          <Button variant="outline" className="hover-lift" onClick={() => navigate('/goi-dich-vu', { state: { scrollTo: 'comparison' } })}>
            Xem bảng so sánh gói
          </Button>
        </div>
      </Card>
    </div>
  );
};

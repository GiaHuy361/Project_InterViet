import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { ArrowLeft, CreditCard, Loader2, Sparkles, ShieldCheck } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { AppPageHeader } from '../components/design-system/AppPageHeader';
import { isDevBillingEnabled } from '../../config/devBilling';
import billingService, { type BillingProviderRecord } from '../../services/billingService';
import { useApp } from '../contexts/AppContext';
import * as subscriptionService from '../../services/subscriptionService';
import { createApiError } from '../../lib/api/apiError';
interface BillingLocationState {
  selectedPlan?: string;
  contextType?: 'subscription' | 'mentor_booking';
  bookingId?: string;
}

export const BillingPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = useApp();
  const locationState = (location.state as BillingLocationState | null) ?? null;

  const [providers, setProviders] = useState<BillingProviderRecord[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState('vnpay');
  const [creatingSession, setCreatingSession] = useState(false);
  const [devLoading, setDevLoading] = useState(false);

  const selectedPlan = locationState?.selectedPlan ?? 'pro_monthly';
  const contextType = locationState?.contextType ?? 'subscription';
  const enableDevBilling = isDevBillingEnabled;

  const enabledProviders = useMemo(() => providers.filter((provider) => provider.enabled), [providers]);

  useEffect(() => {
    let mounted = true;

    const loadProviders = async () => {
      setLoadingProviders(true);
      try {
        const providerList = await billingService.getBillingProviders();
        if (!mounted) return;
        setProviders(providerList);
        const firstEnabled = providerList.find((provider) => provider.enabled)?.provider;
        if (firstEnabled) {
          setSelectedProvider(firstEnabled);
        }
      } catch (error) {
        console.error('Failed to load billing providers', error);
        toast.error('Không thể tải danh sách cổng thanh toán');
      } finally {
        if (mounted) {
          setLoadingProviders(false);
        }
      }
    };

    void loadProviders();

    return () => {
      mounted = false;
    };
  }, []);

  const startCheckout = async () => {
    setCreatingSession(true);
    try {
      const successUrl = new URL(`${window.location.origin}/payment/success`);
      successUrl.searchParams.set('contextType', contextType);
      successUrl.searchParams.set('selectedPlan', selectedPlan);
      if (locationState?.bookingId) {
        successUrl.searchParams.set('bookingId', locationState.bookingId);
      }

      const cancelUrl = new URL(`${window.location.origin}/payment/cancel`);
      cancelUrl.searchParams.set('contextType', contextType);
      cancelUrl.searchParams.set('selectedPlan', selectedPlan);
      cancelUrl.searchParams.set('returnTo', '/thanh-toan');
      if (locationState?.bookingId) {
        cancelUrl.searchParams.set('bookingId', locationState.bookingId);
      }

      const response = await billingService.createBillingCheckoutSession({
        planKey: selectedPlan,
        provider: selectedProvider,
        returnUrl: successUrl.toString(),
        cancelUrl: cancelUrl.toString(),
      });

      const checkoutPath = new URL(response.checkoutUrl, window.location.origin);
      navigate(`${checkoutPath.pathname}${checkoutPath.search}${checkoutPath.hash}`, {
        replace: true,
        state: { checkoutSession: response },
      });
    } catch (error) {
      toast.error(createApiError(error).getUserMessage());
    } finally {
      setCreatingSession(false);
    }
  };

  const handleDevActivate = async () => {
    setDevLoading(true);
    try {
      await subscriptionService.devActivatePlan({ planKey: selectedPlan as 'free' | 'monthly' | 'quarterly' | 'yearly' });
      toast.success('Đã kích hoạt gói test thành công');
      navigate('/dashboard');
    } catch (error) {
      toast.error(createApiError(error).getUserMessage());
    } finally {
      setDevLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-12">
      <Button variant="ghost" size="sm" className="-ml-2" onClick={() => navigate(-1)}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Quay lại
      </Button>

      <AppPageHeader
        title="Thanh toán trực tuyến"
        subtitle={
          contextType === 'mentor_booking'
            ? 'Tạo phiên checkout dùng chung cho lịch hẹn mentor.'
            : 'Tạo phiên checkout cho gói dịch vụ và mở trang thanh toán mock dùng chung.'
        }
        icon={CreditCard}
        iconGradient="from-amber-500 to-orange-600"
      />

      <Card className="space-y-6 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Plan</p>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{selectedPlan}</h2>
            <p className="text-sm text-muted-foreground">
              Ngữ cảnh: {contextType === 'mentor_booking' ? 'Mentor booking' : 'Subscription'}
            </p>
          </div>
          <Badge variant="outline" className="rounded-full bg-slate-50 px-3 py-1 text-slate-700">
            {state.user?.systemRole ? state.user.systemRole.toUpperCase() : 'USER'}
          </Badge>
        </div>

        <div className="space-y-3">
          <label className="text-sm font-medium text-slate-700">Chọn cổng thanh toán</label>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {loadingProviders && enabledProviders.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">Đang tải provider...</div>
            ) : (
              enabledProviders.map((provider) => {
                const active = provider.provider === selectedProvider;
                return (
                  <button
                    key={provider.provider}
                    type="button"
                    onClick={() => setSelectedProvider(provider.provider)}
                    className={`rounded-2xl border p-4 text-left transition-all ${
                      active ? 'border-sky-300 bg-sky-50 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-slate-900">{provider.displayName}</span>
                      <Badge variant="outline">{provider.isMock ? 'Mock' : 'Live'}</Badge>
                    </div>
                    <p className="mt-2 text-sm text-slate-500">{provider.provider}</p>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button className="btn-glow" onClick={() => void startCheckout()} disabled={creatingSession || loadingProviders}>
            {creatingSession && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Tạo Checkout Session
          </Button>
          <Button variant="outline" onClick={() => navigate('/goi-dich-vu')}>
            Xem Gói dịch vụ
          </Button>
        </div>
      </Card>

      {enableDevBilling && (
        <Card className="space-y-4 border-dashed border-amber-300 bg-amber-50/40 p-6">
          <div>
            <h3 className="font-semibold text-amber-900 dark:text-amber-200">Dev: kích hoạt gói test</h3>
            <p className="text-sm text-amber-800 dark:text-amber-300/90">Chỉ hiển thị ở local/development.</p>
          </div>
          <Button onClick={() => void handleDevActivate()} disabled={devLoading} variant="outline">
            {devLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Sparkles className="mr-2 h-4 w-4" />
            Dev activate
          </Button>
        </Card>
      )}

      <Card className="p-6">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 text-emerald-600" />
          <div>
            <p className="font-semibold text-slate-900">Flow chính thức</p>
            <p className="text-sm text-slate-500">
              POST /api/v1/billing/checkout trả về checkoutUrl và paymentInstructionsUrl, sau đó frontend mở trang mock checkout chung.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default BillingPage;

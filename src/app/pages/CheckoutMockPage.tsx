import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router';
import { toast } from 'sonner';
import { ArrowLeft, CheckCircle2, Copy, Loader2, QrCode, RefreshCw, Shield, TriangleAlert } from 'lucide-react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { AppPageHeader } from '../components/design-system/AppPageHeader';
import { isDevBillingEnabled } from '../../config/devBilling';
import billingService, {
  type BillingBankTransferRequest,
  type BillingCheckoutSessionResponse,
  type BillingPaymentInstructionsResponse,
  type BillingProviderRecord,
  type BillingTransferAttempt,
} from '../../services/billingService';

const SESSION_STORAGE_PREFIX = 'billing-checkout-session:';

type CheckoutLocationState = {
  checkoutSession?: BillingCheckoutSessionResponse;
};

const getSessionStorageKey = (sessionId: string) => `${SESSION_STORAGE_PREFIX}${sessionId}`;

const loadStoredSession = (sessionId: string): BillingCheckoutSessionResponse | null => {
  try {
    const raw = window.sessionStorage.getItem(getSessionStorageKey(sessionId));
    return raw ? (JSON.parse(raw) as BillingCheckoutSessionResponse) : null;
  } catch {
    return null;
  }
};

const storeSession = (session: BillingCheckoutSessionResponse) => {
  try {
    window.sessionStorage.setItem(getSessionStorageKey(session.checkoutSessionId), JSON.stringify(session));
  } catch {
    // Ignore storage failures; the page still works from in-memory state.
  }
};

const copyText = async (value: string) => {
  await navigator.clipboard.writeText(value);
  toast.success('Đã sao chép');
};

const providerLabel = (provider?: string) => {
  if (!provider) return 'Cổng thanh toán';
  const normalized = provider.toLowerCase();
  if (normalized === 'vnpay') return 'VNPay';
  if (normalized === 'momo') return 'MoMo';
  if (normalized === 'stripe') return 'Stripe';
  if (normalized === 'payos') return 'PayOS';
  return provider;
};

const contextLabel = (contextType?: string) => {
  if (contextType === 'mentor_booking') return 'Lịch hẹn mentor';
  return 'Gói cước';
};

const successToastMessage = (contextType?: string) => {
  if (contextType === 'mentor_booking') return 'Lịch hẹn đã được xác nhận';
  return 'Gói cước đã được kích hoạt';
};

export const CheckoutMockPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { sessionId } = useParams<{ sessionId: string }>();

  const locationState = (location.state as CheckoutLocationState | null) ?? null;
  const [session, setSession] = useState<BillingCheckoutSessionResponse | null>(() => {
    const initialSession = locationState?.checkoutSession ?? (sessionId ? loadStoredSession(sessionId) : null);
    return initialSession ?? null;
  });
  const [instructions, setInstructions] = useState<BillingPaymentInstructionsResponse | null>(null);
  const [attempts, setAttempts] = useState<BillingTransferAttempt[]>([]);
  const [providers, setProviders] = useState<BillingProviderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [providerLoading, setProviderLoading] = useState(true);
  const [paymentForm, setPaymentForm] = useState<BillingBankTransferRequest>({
    payerAccountNumber: '',
    payerAccountName: '',
    amountPaid: 0,
    transferContent: '',
  });

  const contextType = session?.contextType ?? 'subscription';
  const checkoutProvider = session?.provider;

  useEffect(() => {
    if (session) {
      storeSession(session);
    }
  }, [session]);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      if (!sessionId) {
        setLoading(false);
        setProviderLoading(false);
        return;
      }

      setLoading(true);
      setProviderLoading(true);

      try {
        const [providerList, paymentInstructions, checkoutAttempts] = await Promise.all([
          billingService.getBillingProviders(),
          billingService.getBillingPaymentInstructions(sessionId),
          billingService.getBillingCheckoutAttempts(sessionId),
        ]);

        if (!mounted) return;

        setProviders(providerList);
        setInstructions(paymentInstructions);
        setAttempts(checkoutAttempts);
        setSession((currentSession) =>
          currentSession ?? {
            checkoutSessionId: paymentInstructions.checkoutSessionId,
            checkoutUrl: `/checkout/mock/${paymentInstructions.checkoutSessionId}`,
            status: 'pending',
            expiresAt: '',
            provider: checkoutProvider ?? providerList.find((item) => item.enabled)?.provider ?? 'vnpay',
            planKey: paymentInstructions.planKey,
            contextType: paymentInstructions.purpose === 'mentor_booking' ? 'mentor_booking' : 'subscription',
            amount: paymentInstructions.amount,
            currencyCode: paymentInstructions.currencyCode,
            paymentInstructionsUrl: '',
          }
        );
        setPaymentForm((currentForm) => ({
          ...currentForm,
          amountPaid: paymentInstructions.amount,
          transferContent: paymentInstructions.transfer.requiredContent,
        }));
      } catch (error) {
        console.error('Failed to load checkout session', error);
        toast.error('Không thể tải thông tin thanh toán');
      } finally {
        if (mounted) {
          setLoading(false);
          setProviderLoading(false);
        }
      }
    };

    void load();

    return () => {
      mounted = false;
    };
  }, [sessionId]);

  const enabledProviders = useMemo(() => providers.filter((item) => item.enabled), [providers]);
  const primaryTitle = contextLabel(contextType);
  const targetSuccessPath = useMemo(() => {
    if (contextType === 'mentor_booking') {
      const bookingId = session?.bookingId;
      return bookingId ? `/mentor-bookings/${bookingId}` : '/dashboard';
    }
    return '/dashboard';
  }, [contextType, session?.bookingId]);

  const refreshData = async () => {
    if (!sessionId) return;
    setRefreshing(true);
    try {
      const [paymentInstructions, checkoutAttempts] = await Promise.all([
        billingService.getBillingPaymentInstructions(sessionId),
        billingService.getBillingCheckoutAttempts(sessionId),
      ]);
      setInstructions(paymentInstructions);
      setAttempts(checkoutAttempts);
      setPaymentForm((currentForm) => ({
        ...currentForm,
        amountPaid: paymentInstructions.amount,
        transferContent: paymentInstructions.transfer.requiredContent,
      }));
      toast.success('Đã làm mới dữ liệu thanh toán');
    } catch (error) {
      toast.error('Không thể làm mới dữ liệu thanh toán');
    } finally {
      setRefreshing(false);
    }
  };

  const handleSubmitTransfer = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!sessionId) return;

    setSubmitting(true);
    try {
      const response = await billingService.submitBillingBankTransfer(sessionId, {
        payerAccountNumber: paymentForm.payerAccountNumber.trim(),
        payerAccountName: paymentForm.payerAccountName.trim(),
        amountPaid: Number(paymentForm.amountPaid),
        transferContent: paymentForm.transferContent.trim().toUpperCase(),
      });

      setAttempts((currentAttempts) => [response.attempt, ...currentAttempts]);
      setSession((currentSession) =>
        currentSession
          ? {
            ...currentSession,
            status: response.status,
          }
          : currentSession
      );

      if (response.status === 'succeeded') {
        toast.success(successToastMessage(contextType));
        const successUrl = new URL(`${window.location.origin}/payment/success`);
        successUrl.searchParams.set('contextType', contextType);
        successUrl.searchParams.set('checkoutSessionId', sessionId);
        if (session?.bookingId) {
          successUrl.searchParams.set('bookingId', session.bookingId);
        }
        navigate(`${successUrl.pathname}${successUrl.search}${successUrl.hash}`, {
          replace: true,
          state: { successToast: successToastMessage(contextType), targetPath: targetSuccessPath },
        });
        return;
      }

      if (response.status === 'pending') {
        toast.info('Giao dịch đang chờ đối soát');
      } else {
        toast.error('Giao dịch chưa được xác thực');
      }

      await refreshData();
    } catch (error) {
      console.error('Failed to submit bank transfer', error);
      toast.error('Không thể gửi yêu cầu xác nhận chuyển khoản');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSimulate = async (action: 'success' | 'failed' | 'cancelled') => {
    if (!sessionId) return;
    try {
      if (action === 'success') {
        await billingService.simulateBillingCheckoutSuccess(sessionId);
        toast.success('Đã mô phỏng thanh toán thành công');
      } else if (action === 'failed') {
        await billingService.simulateBillingCheckoutFailed(sessionId);
        toast.error('Đã mô phỏng thanh toán lỗi');
      } else {
        await billingService.simulateBillingCheckoutCancelled(sessionId);
        toast.info('Đã mô phỏng hủy thanh toán');
      }
      await refreshData();
    } catch (error) {
      toast.error('Không thể mô phỏng trạng thái thanh toán');
    }
  };

  const requiredContent = instructions?.transfer.requiredContent ?? '';

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-12">
      <Button variant="ghost" size="sm" className="-ml-2" onClick={() => navigate(-1)}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Quay lại
      </Button>

      <AppPageHeader
        title={session?.checkoutSessionId ? `Thanh toán ${primaryTitle}` : 'Thanh toán'}
        subtitle={
          session
            ? `Thanh toán cho ${primaryTitle.toLowerCase()} • ${providerLabel(session.provider)}`
            : 'Đang tải thông tin thanh toán...'
        }
        icon={CreditCardIcon}
        iconGradient="from-cyan-500 to-blue-600"
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={refreshData} disabled={refreshing || loading}>
              {refreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Làm mới
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="space-y-5 p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Thông tin thanh toán</h2>
              <p className="text-sm text-gray-500">Dùng chung cho Subscription và Mentor Booking.</p>
            </div>
            <Badge variant="outline" className="rounded-full bg-slate-50 px-3 py-1 text-slate-700">
              {session?.status ?? 'pending'}
            </Badge>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <InfoTile label="Plan Key" value={session?.planKey ?? '—'} />
            <InfoTile label="Cổng thanh toán" value={providerLabel(session?.provider)} />
            <InfoTile label="Ngữ cảnh" value={contextLabel(contextType)} />
            <InfoTile label="Số tiền" value={session ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: session.currencyCode || 'VND', maximumFractionDigits: 0 }).format(session.amount || 0) : '—'} />
          </div>

          <div className="rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/30 p-4 text-sm text-amber-900">
            <div className="flex gap-3">
              <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="font-semibold">Lưu ý</p>
                <p className="mt-1">
                  Đây là trang mock checkout dùng chung. Sau khi xác nhận thành công, hệ thống sẽ chuyển hướng theo <span className="font-medium">contextType</span> từ response.
                </p>
              </div>
            </div>
          </div>

          <form className="space-y-4" onSubmit={handleSubmitTransfer}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Số tài khoản người chuyển</label>
                <Input
                  value={paymentForm.payerAccountNumber}
                  onChange={(event) => setPaymentForm((currentForm) => ({ ...currentForm, payerAccountNumber: event.target.value }))}
                  placeholder="001100223344"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Tên chủ tài khoản</label>
                <Input
                  value={paymentForm.payerAccountName}
                  onChange={(event) => setPaymentForm((currentForm) => ({ ...currentForm, payerAccountName: event.target.value }))}
                  placeholder="NGUYEN VAN A"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Số tiền đã chuyển</label>
                <Input
                  type="number"
                  min="0"
                  step="1000"
                  value={paymentForm.amountPaid}
                  onChange={(event) => setPaymentForm((currentForm) => ({ ...currentForm, amountPaid: Number(event.target.value) }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Nội dung chuyển khoản</label>
                <div className="flex gap-2">
                  <Input
                    className="font-mono uppercase"
                    value={paymentForm.transferContent}
                    onChange={(event) => setPaymentForm((currentForm) => ({ ...currentForm, transferContent: event.target.value.toUpperCase() }))}
                    placeholder="IVPAY 83K29F"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void copyText((paymentForm.transferContent || requiredContent).toUpperCase())}
                    disabled={!paymentForm.transferContent && !requiredContent}
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copy
                  </Button>
                </div>
              </div>
            </div>

            <Button type="submit" disabled={submitting || loading || !sessionId} className="w-full sm:w-auto">
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
              Tôi đã chuyển khoản thành công
            </Button>
          </form>
        </Card>

        <div className="space-y-6">
          <Card className="space-y-4 p-6">
            <div className="flex items-center gap-2">
              <QrCode className="h-5 w-5 text-sky-600 dark:text-sky-400" />
              <h3 className="text-lg font-semibold text-gray-900">Chuyển khoản & QR</h3>
            </div>

            {instructions ? (
              <>
                <div className="space-y-3 rounded-2xl border border-gray-100 bg-gray-50 p-4 text-sm">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-400">Merchant</p>
                    <p className="font-medium text-gray-900">{instructions.merchant.merchantName}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-400">Ngân hàng</p>
                    <p className="text-gray-700">{instructions.merchant.bankName}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <InfoTile label="Số tài khoản" value={instructions.merchant.accountNumber} compact />
                    <InfoTile label="Tên tài khoản" value={instructions.merchant.accountName} compact />
                  </div>
                  <div className="rounded-xl bg-white p-3">
                    <p className="text-xs uppercase tracking-wide text-gray-400">Nội dung yêu cầu</p>
                    <div className="mt-1 flex items-center justify-between gap-2">
                      <code className="truncate font-mono text-base font-semibold text-gray-900">{requiredContent || '—'}</code>
                      <Button type="button" size="sm" variant="outline" onClick={() => void copyText(requiredContent)} disabled={!requiredContent}>
                        <Copy className="mr-2 h-4 w-4" />
                        Copy
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
                  {instructions.qr.imageBase64 ? (
                    <img src={instructions.qr.imageBase64} alt="QR thanh toán" className="mx-auto h-auto w-full max-w-sm rounded-xl" />
                  ) : (
                    <div className="flex min-h-64 items-center justify-center rounded-xl bg-gray-50 text-sm text-gray-500">
                      QR chưa sẵn sàng
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="rounded-2xl border border-dashed border-gray-200 p-6 text-center text-sm text-gray-500">
                {loading ? 'Đang tải thông tin chuyển khoản...' : 'Không có dữ liệu chuyển khoản'}
              </div>
            )}
          </Card>

          <Card className="space-y-4 p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Lượt nộp tiền</h3>
                <p className="text-sm text-gray-500">submitted / accepted / rejected</p>
              </div>
              <Badge variant="outline">{attempts.length} attempts</Badge>
            </div>

            <div className="overflow-hidden rounded-2xl border border-gray-100">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ngày</TableHead>
                    <TableHead>Người nộp</TableHead>
                    <TableHead>Nội dung</TableHead>
                    <TableHead>Trạng thái</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attempts.length > 0 ? (
                    attempts.map((attempt) => (
                      <TableRow key={attempt.id}>
                        <TableCell className="text-xs text-gray-500">{new Date(attempt.createdAt).toLocaleString('vi-VN')}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium text-gray-900">{attempt.payerAccountName}</div>
                            <div className="text-xs text-gray-500">{attempt.payerAccountNumberMasked}</div>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs uppercase text-gray-700">{attempt.transferContent}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{attempt.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="py-8 text-center text-sm text-gray-500">
                        Chưa có attempt nào
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>

          {isDevBillingEnabled && (
            <Card className="space-y-3 border-dashed border-amber-300 bg-amber-50 dark:bg-amber-900/30 p-6">
              <div>
                <h3 className="text-lg font-semibold text-amber-900">DEV Simulate</h3>
                <p className="text-sm text-amber-800 dark:text-amber-300">Chỉ dùng trong local/development.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" onClick={() => void handleSimulate('success')} disabled={loading}>
                  Mô phỏng Success
                </Button>
                <Button type="button" variant="outline" onClick={() => void handleSimulate('failed')} disabled={loading}>
                  Mô phỏng Failed
                </Button>
                <Button type="button" variant="outline" onClick={() => void handleSimulate('cancelled')} disabled={loading}>
                  Mô phỏng Cancelled
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>

      <Card className="p-6">
        <div className="flex items-start gap-3">
          <Shield className="mt-0.5 h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          <div>
            <p className="font-semibold text-gray-900">Provider khả dụng</p>
            <p className="text-sm text-gray-500">Các cổng mô phỏng theo endpoint chính thức.</p>
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {providerLoading && enabledProviders.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 p-4 text-sm text-gray-500">Đang tải provider...</div>
          ) : (
            enabledProviders.map((provider) => (
              <div key={provider.provider} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-gray-900">{provider.displayName}</p>
                  <Badge variant="outline">{provider.isMock ? 'Mock' : 'Live'}</Badge>
                </div>
                <p className="mt-2 text-sm text-gray-500">{provider.provider}</p>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};

const CreditCardIcon: React.FC<{ className?: string }> = ({ className }) => <Shield className={className} />;

const InfoTile: React.FC<{ label: string; value: React.ReactNode; compact?: boolean }> = ({ label, value, compact }) => (
  <div className={`rounded-2xl border border-gray-100 bg-gray-50 ${compact ? 'p-3' : 'p-4'}`}>
    <p className="text-xs uppercase tracking-wide text-gray-400">{label}</p>
    <div className="mt-1 break-words text-sm font-medium text-gray-900">{value}</div>
  </div>
);

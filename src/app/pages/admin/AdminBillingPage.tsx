/**
 * Admin Billing Page
 *
 * Billing reconciliation across payments, invoices, subscriptions, mentor bookings and public report shares.
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  CreditCard,
  Receipt,
  Search,
  Filter,
  RefreshCw,
  CalendarClock,
  Link2,
  Loader2,
  ShieldCheck,
  BarChart3,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import adminBillingService, {
  AdminInvoiceRecord,
  AdminMentorBookingRecord,
  AdminPaymentRecord,
  AdminReportShareRecord,
  AdminSubscriptionRecord,
} from '../../../services/adminBillingService';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '../../components/ui/tooltip';

type BillingTab = 'payments' | 'invoices' | 'subscriptions' | 'bookings' | 'shares';

const tabMeta: Record<BillingTab, { label: string; icon: React.ComponentType<{ className?: string }>; description: string }> = {
  payments: { label: 'Payments', icon: CreditCard, description: 'Đối soát giao dịch thanh toán' },
  invoices: { label: 'Invoices', icon: Receipt, description: 'Theo dõi hóa đơn hệ thống' },
  subscriptions: { label: 'Subscriptions', icon: ShieldCheck, description: 'Gói cước người dùng' },
  bookings: { label: 'Mentor Bookings', icon: CalendarClock, description: 'Đặt lịch mentor toàn hệ thống' },
  shares: { label: 'Report Shares', icon: Link2, description: 'Liên kết chia sẻ báo cáo công khai' },
};

const paymentStatusBadge: Record<string, string> = {
  succeeded: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
  paid: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
  failed: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800',
  pending: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800',
  open: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800',
  draft: 'bg-slate-100 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800',
  void: 'bg-slate-100 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800',
  active: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
  expired: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800',
  cancelled: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800',
  confirmed: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
  pending_payment: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800',
  completed: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
};

const paymentPurposeBadge: Record<string, string> = {
  subscription: 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-400 border-violet-200 dark:border-violet-800',
  subscription_plan: 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-400 border-violet-200 dark:border-violet-800',
  booking_fee: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800',
  mentor_booking: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800',
  report_share: 'bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800',
};

const formatCurrency = (amount?: number, currencyCode = 'VND') =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: currencyCode, maximumFractionDigits: 0 }).format(amount || 0);

const formatDateTime = (value?: string | null) => (value ? new Date(value).toLocaleString('vi-VN') : '—');

const formatProvider = (value?: string) => {
  if (!value) return '—';
  const normalized = value.toLowerCase();
  if (normalized === 'vnpay') return 'VNPay';
  if (normalized === 'momo') return 'MoMo';
  if (normalized === 'stripe') return 'Stripe';
  if (normalized === 'payos') return 'PayOS';
  return value;
};

export const AdminBillingPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<BillingTab>('payments');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [loading, setLoading] = useState(false);

  const [payments, setPayments] = useState<AdminPaymentRecord[]>([]);
  const [paymentsTotal, setPaymentsTotal] = useState(0);
  const [paymentStatus, setPaymentStatus] = useState('all');
  const [paymentPurpose, setPaymentPurpose] = useState('all');
  const [paymentProvider, setPaymentProvider] = useState('all');
  const [paymentUserId, setPaymentUserId] = useState('');

  const [invoices, setInvoices] = useState<AdminInvoiceRecord[]>([]);
  const [invoicesTotal, setInvoicesTotal] = useState(0);
  const [invoiceStatus, setInvoiceStatus] = useState('all');
  const [invoicePurpose, setInvoicePurpose] = useState('all');
  const [invoiceUserId, setInvoiceUserId] = useState('');

  const [subscriptions, setSubscriptions] = useState<AdminSubscriptionRecord[]>([]);
  const [subscriptionsTotal, setSubscriptionsTotal] = useState(0);
  const [subscriptionStatus, setSubscriptionStatus] = useState('all');
  const [subscriptionUserId, setSubscriptionUserId] = useState('');

  const [mentorBookings, setMentorBookings] = useState<AdminMentorBookingRecord[]>([]);
  const [mentorBookingsTotal, setMentorBookingsTotal] = useState(0);
  const [bookingStatus, setBookingStatus] = useState('all');
  const [bookingMentorId, setBookingMentorId] = useState('');
  const [bookingUserId, setBookingUserId] = useState('');
  const [bookingFrom, setBookingFrom] = useState('');
  const [bookingTo, setBookingTo] = useState('');

  const [reportShares, setReportShares] = useState<AdminReportShareRecord[]>([]);
  const [reportSharesTotal, setReportSharesTotal] = useState(0);
  const [reportType, setReportType] = useState('all');
  const [reportUserId, setReportUserId] = useState('');
  const [reportIsActive, setReportIsActive] = useState<'all' | 'true' | 'false'>('all');

  const activeTotals = useMemo(() => {
    if (activeTab === 'payments') return paymentsTotal;
    if (activeTab === 'invoices') return invoicesTotal;
    if (activeTab === 'subscriptions') return subscriptionsTotal;
    if (activeTab === 'bookings') return mentorBookingsTotal;
    return reportSharesTotal;
  }, [activeTab, paymentsTotal, invoicesTotal, subscriptionsTotal, mentorBookingsTotal, reportSharesTotal]);

  const tabCountLabel = useMemo(() => `${activeTotals} records`, [activeTotals]);
  const hasActiveFilters = Boolean(
    searchQuery ||
    paymentStatus !== 'all' ||
    paymentPurpose !== 'all' ||
    paymentProvider !== 'all' ||
    paymentUserId ||
    invoiceStatus !== 'all' ||
    invoicePurpose !== 'all' ||
    invoiceUserId ||
    subscriptionStatus !== 'all' ||
    subscriptionUserId ||
    bookingStatus !== 'all' ||
    bookingMentorId ||
    bookingUserId ||
    bookingFrom ||
    bookingTo ||
    reportType !== 'all' ||
    reportUserId ||
    reportIsActive !== 'all',
  );

  const normalizedSearch = searchQuery.trim().toLowerCase();
  const matchesLocalSearch = (...values: Array<string | number | null | undefined>) => {
    if (!normalizedSearch) return true;
    return values
      .filter((value) => value != null)
      .some((value) => String(value).toLowerCase().includes(normalizedSearch));
  };

  const filteredPayments = payments.filter((item) => matchesLocalSearch(item.id, item.userEmail, item.userId, item.provider, item.purpose));
  const filteredInvoices = invoices.filter((item) => matchesLocalSearch(item.id, item.userEmail, item.userId, item.purpose, item.status));
  const filteredSubscriptions = subscriptions.filter((item) => matchesLocalSearch(item.id, item.userEmail, item.userId, item.planKey, item.status));
  const filteredBookings = mentorBookings.filter((item) => matchesLocalSearch(item.bookingId, item.candidateEmail, item.mentorName, item.serviceType, item.status, item.userId));
  const filteredReportShares = reportShares.filter((item) => matchesLocalSearch(item.shareId, item.ownerEmail, item.ownerFullName, item.reportType, item.title, item.tokenPreview));

  const visibleCount = useMemo(() => {
    if (activeTab === 'payments') return filteredPayments.length;
    if (activeTab === 'invoices') return filteredInvoices.length;
    if (activeTab === 'subscriptions') return filteredSubscriptions.length;
    if (activeTab === 'bookings') return filteredBookings.length;
    return filteredReportShares.length;
  }, [activeTab, filteredBookings.length, filteredInvoices.length, filteredPayments.length, filteredReportShares.length, filteredSubscriptions.length]);

  const visibleCountLabel = `${visibleCount} hiển thị`;

  const resetPage = () => setPage(1);

  useEffect(() => {
    resetPage();
  }, [activeTab]);

  useEffect(() => {
    let mounted = true;
    const timer = window.setTimeout(() => {
      const load = async () => {
        setLoading(true);
        try {
          if (activeTab === 'payments') {
            const response = await adminBillingService.listAdminPayments({
              status: paymentStatus === 'all' ? undefined : paymentStatus,
              purpose: paymentPurpose === 'all' ? undefined : paymentPurpose,
              provider: paymentProvider === 'all' ? undefined : paymentProvider,
              userId: paymentUserId || undefined,
              page,
              pageSize,
            });
            if (mounted) {
              setPayments(response.items || []);
              setPaymentsTotal(response.total || 0);
            }
          }

          if (activeTab === 'invoices') {
            const response = await adminBillingService.listAdminInvoices({
              status: invoiceStatus === 'all' ? undefined : invoiceStatus,
              purpose: invoicePurpose === 'all' ? undefined : invoicePurpose,
              userId: invoiceUserId || undefined,
              page,
              pageSize,
            });
            if (mounted) {
              setInvoices(response.items || []);
              setInvoicesTotal(response.total || 0);
            }
          }

          if (activeTab === 'subscriptions') {
            const response = await adminBillingService.listAdminSubscriptions({
              status: subscriptionStatus === 'all' ? undefined : subscriptionStatus,
              userId: subscriptionUserId || undefined,
              page,
              pageSize,
            });
            if (mounted) {
              setSubscriptions(response.items || []);
              setSubscriptionsTotal(response.total || 0);
            }
          }

          if (activeTab === 'bookings') {
            const response = await adminBillingService.listAdminMentorBookings({
              status: bookingStatus === 'all' ? undefined : bookingStatus,
              mentorId: bookingMentorId || undefined,
              userId: bookingUserId || undefined,
              from: bookingFrom || undefined,
              to: bookingTo || undefined,
              page,
              pageSize,
            });
            if (mounted) {
              setMentorBookings(response.items || []);
              setMentorBookingsTotal(response.total || 0);
            }
          }

          if (activeTab === 'shares') {
            const response = await adminBillingService.listAdminReportShares({
              reportType: reportType === 'all' ? undefined : reportType,
              userId: reportUserId || undefined,
              isActive:
                reportIsActive === 'all' ? undefined : reportIsActive === 'true',
              page,
              pageSize,
            });
            if (mounted) {
              setReportShares(response.items || []);
              setReportSharesTotal(response.total || 0);
            }
          }
        } catch (error) {
          console.error('Failed to load admin billing data', error);
        } finally {
          if (mounted) setLoading(false);
        }
      };

      void load();
    }, 250);

    return () => {
      mounted = false;
      window.clearTimeout(timer);
    };
  }, [
    activeTab,
    page,
    pageSize,
    paymentStatus,
    paymentPurpose,
    paymentProvider,
    paymentUserId,
    invoiceStatus,
    invoicePurpose,
    invoiceUserId,
    subscriptionStatus,
    subscriptionUserId,
    bookingStatus,
    bookingMentorId,
    bookingUserId,
    bookingFrom,
    bookingTo,
    reportType,
    reportUserId,
    reportIsActive,
  ]);

  const statusTranslations: Record<string, string> = {
    succeeded: 'Thành công',
    paid: 'Đã thanh toán',
    failed: 'Thất bại',
    pending: 'Chờ xử lý',
    open: 'Đang mở',
    draft: 'Bản nháp',
    void: 'Đã hủy',
    active: 'Hoạt động',
    expired: 'Hết hạn',
    cancelled: 'Đã hủy',
    confirmed: 'Đã xác nhận',
    pending_payment: 'Chờ thanh toán',
    completed: 'Hoàn thành',
  };

  const purposeTranslations: Record<string, string> = {
    subscription: 'Gói đăng ký',
    subscription_plan: 'Gói đăng ký',
    booking_fee: 'Phí đặt lịch',
    mentor_booking: 'Đặt lịch mentor',
    report_share: 'Chia sẻ báo cáo',
  };

  const renderStatusBadge = (value: string) => {
    const className = paymentStatusBadge[value] || 'bg-slate-100 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800';
    return <Badge variant="outline" className={className}>{statusTranslations[value] || value}</Badge>;
  };

  const renderPurposeBadge = (value: string) => {
    const className = paymentPurposeBadge[value] || 'bg-slate-100 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800';
    return <Badge variant="outline" className={className}>{purposeTranslations[value] || value}</Badge>;
  }

  const renderEmptyState = (message: string) => (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-900/40 dark:to-orange-900/40 text-amber-600 dark:text-amber-400 shadow-sm">
        <BarChart3 className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-gray-900 dark:text-slate-100">Không có dữ liệu phù hợp</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-gray-500 dark:text-slate-400">{message}</p>
      {hasActiveFilters ? (
        <Button
          variant="outline"
          className="mt-5"
          onClick={() => {
            setSearchQuery('');
            setPaymentStatus('all');
            setPaymentPurpose('all');
            setPaymentProvider('all');
            setPaymentUserId('');
            setInvoiceStatus('all');
            setInvoicePurpose('all');
            setInvoiceUserId('');
            setSubscriptionStatus('all');
            setSubscriptionUserId('');
            setBookingStatus('all');
            setBookingMentorId('');
            setBookingUserId('');
            setBookingFrom('');
            setBookingTo('');
            setReportType('all');
            setReportUserId('');
            setReportIsActive('all');
          }}
        >
          Xóa bộ lọc
        </Button>
      ) : null}
    </div>
  );

  const renderTable = () => {
    if (activeTab === 'payments') {
      return (
        <Table className="table-fixed">
          <TableHeader>
            <TableRow>
              <TableHead className="text-center">Mã giao dịch</TableHead>
              <TableHead className="text-center">Khách hàng</TableHead>
              <TableHead className="text-center">Số tiền</TableHead>
              <TableHead className="text-center">Hình thức / Cổng</TableHead>
              <TableHead className="text-center">Trạng thái</TableHead>
              <TableHead className="text-center">Thời gian</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPayments.length ? filteredPayments.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium text-center cursor-pointer">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span>
                          {`${item.id.slice(0, 6)}...${item.id.slice(-6)}`}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{item.id}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
                <TableCell className="text-center">{item.userEmail}</TableCell>
                <TableCell className="text-center">{formatCurrency(item.amount, item.currencyCode)}</TableCell>
                <TableCell className="text-center">{formatProvider(item.provider)}</TableCell>
                <TableCell className="text-center">{renderStatusBadge(item.status)}</TableCell>
                <TableCell className="text-center">{formatDateTime(item.createdAt)}</TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={6} className="p-0">
                  {renderEmptyState('Không có giao dịch thanh toán trong phạm vi bộ lọc hiện tại.')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      );
    }

    if (activeTab === 'invoices') {
      return (
        <Table className="table-fixed">
          <TableHeader>
            <TableRow>
              <TableHead className="text-center">Mã hóa đơn</TableHead>
              <TableHead className="text-center">Khách hàng</TableHead>
              <TableHead className="text-center">Số tiền</TableHead>
              <TableHead className="text-center">Loại</TableHead>
              <TableHead className="text-center">Trạng thái</TableHead>
              <TableHead className="text-center">Thời gian</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInvoices.length ? filteredInvoices.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium text-center cursor-pointer">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span>
                          {`${item.id.slice(0, 6)}...${item.id.slice(-6)}`}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{item.id}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
                <TableCell className="text-center">{item.userEmail}</TableCell>
                <TableCell className="text-center">{formatCurrency(item.amount, item.currencyCode)}</TableCell>
                <TableCell className="text-center">{renderPurposeBadge(item.purpose)}</TableCell>
                <TableCell className="text-center">{renderStatusBadge(item.status)}</TableCell>
                <TableCell className="text-center">{formatDateTime(item.createdAt)}</TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={6} className="p-0">
                  {renderEmptyState('Chưa có hóa đơn khớp điều kiện lọc hoặc dữ liệu đang trống.')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      );
    }

    if (activeTab === 'subscriptions') {
      return (
        <Table className="table-fixed">
          <TableHeader>
            <TableRow>
              {/* <TableHead className="text-center">ID</TableHead> */}
              <TableHead className="text-center">Khách hàng</TableHead>
              <TableHead className="text-center">Plan</TableHead>
              <TableHead className="text-center">Trạng thái</TableHead>
              <TableHead className="text-center">Bắt đầu</TableHead>
              <TableHead className="text-center">Kết thúc</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSubscriptions.length ? filteredSubscriptions.map((item) => (
              <TableRow key={item.id}>
                {/* <TableCell className="font-medium text-center">{item.id}</TableCell> */}
                <TableCell className="text-center">{item.userEmail}</TableCell>
                <TableCell className="text-center">{item.planKey}</TableCell>
                <TableCell className="text-center">{renderStatusBadge(item.status)}</TableCell>
                <TableCell className="text-center">{formatDateTime(item.startsAt)}</TableCell>
                <TableCell className="text-center">{formatDateTime(item.endsAt)}</TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={6} className="p-0">
                  {renderEmptyState('Không có subscription nào thỏa điều kiện lọc hiện tại.')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      );
    }

    if (activeTab === 'bookings') {
      return (
        <Table className="table-fixed">
          <TableHeader>
            <TableRow>
              <TableHead className="text-center">Mã booking</TableHead>
              <TableHead className="text-center">Ứng viên</TableHead>
              <TableHead className="text-center">Mentor</TableHead>
              <TableHead className="text-center">Số tiền</TableHead>
              <TableHead className="text-center">Trạng thái</TableHead>
              <TableHead className="text-center">Thanh toán</TableHead>
              <TableHead className="text-center">Thời gian</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredBookings.length ? filteredBookings.map((item) => (
              <TableRow key={item.bookingId}>
                <TableCell className="font-medium text-center cursor-pointer">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span>
                          {`${item.bookingId.slice(0, 6)}...${item.bookingId.slice(-6)}`}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{item.bookingId}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
                <TableCell className="text-center">{item.candidateEmail}</TableCell>
                <TableCell className="text-center">{item.mentorName}</TableCell>
                <TableCell className="text-center">{formatCurrency(item.priceAmount, item.currencyCode)}</TableCell>
                <TableCell className="text-center">{renderStatusBadge(item.status)}</TableCell>
                <TableCell className="text-center">{item.paymentStatus}</TableCell>
                <TableCell className="text-center">{formatDateTime(item.startsAt)}</TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={7} className="p-0">
                  {renderEmptyState('Không có mentor booking phù hợp với bộ lọc hiện tại.')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      );
    }

    return (
      <Table className="table-fixed">
        <TableHeader>
          <TableRow>
            <TableHead className="text-center">Mã share</TableHead>
            <TableHead className="text-center">Chủ sở hữu</TableHead>
            <TableHead className="text-center">Loại report</TableHead>
            <TableHead className="text-center">Tiêu đề</TableHead>
            <TableHead className="text-center">Active</TableHead>
            <TableHead className="text-center">Lượt xem</TableHead>
            <TableHead className="text-center">Token preview</TableHead>
            <TableHead className="text-center">Thời gian</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredReportShares.length ? filteredReportShares.map((item) => (
            <TableRow key={item.shareId}>
              <TableCell className="font-medium text-center cursor-pointer">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>
                        {`${item.shareId.slice(0, 6)}...${item.shareId.slice(-6)}`}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{item.shareId}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </TableCell>
              <TableCell className="text-center">
                <div>
                  <p className="font-medium text-gray-900 dark:text-slate-100">{item.ownerFullName}</p>
                  <p className="text-xs text-gray-500 dark:text-slate-400">{item.ownerEmail}</p>
                </div>
              </TableCell>
              <TableCell className="text-center">{item.reportType}</TableCell>
              <TableCell className="max-w-[260px] truncate text-center">{item.title}</TableCell>
              <TableCell className="text-center">{item.isActive ? <Badge className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400">Active</Badge> : <Badge className="bg-slate-100 text-slate-700 dark:text-slate-300">Inactive</Badge>}</TableCell>
              <TableCell className="text-center">{item.viewCount}</TableCell>
              <TableCell className="text-center">
                <span className="rounded-md bg-slate-100 px-2 py-1 font-mono text-xs text-slate-700 dark:text-slate-300">••••••••{item.tokenPreview}</span>
              </TableCell>
              <TableCell className="text-center">{formatDateTime(item.createdAt)}</TableCell>
            </TableRow>
          )) : (
            <TableRow>
              <TableCell colSpan={8} className="p-0">
                {renderEmptyState('Không có report share nào trong phạm vi lọc hiện tại.')}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    );
  };

  const renderFilters = () => {
    if (activeTab === 'payments') {
      return (
        <div className="grid gap-3 lg:grid-cols-5">
          <Input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Tìm kiếm cục bộ: email / id người dùng" />
          <select value={paymentStatus} onChange={(event) => setPaymentStatus(event.target.value)} className={fieldSelectClass}><option value="all">Tất cả trạng thái</option><option value="succeeded">Thành công</option><option value="failed">Thất bại</option><option value="pending">Chờ xử lý</option></select>
          <select value={paymentPurpose} onChange={(event) => setPaymentPurpose(event.target.value)} className={fieldSelectClass}><option value="all">Tất cả mục đích</option><option value="subscription_plan">Gói đăng ký</option><option value="mentor_booking">Đặt lịch mentor</option></select>
          <select value={paymentProvider} onChange={(event) => setPaymentProvider(event.target.value)} className={fieldSelectClass}><option value="all">Tất cả nhà cung cấp</option><option value="vnpay">VNPay</option><option value="momo">MoMo</option><option value="stripe">Stripe</option><option value="payos">PayOS</option></select>
          <Input value={paymentUserId} onChange={(event) => setPaymentUserId(event.target.value)} placeholder="User ID" />
        </div>
      );
    }

    if (activeTab === 'invoices') {
      return (
        <div className="grid gap-3 lg:grid-cols-4">
          <Input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Tìm kiếm cục bộ: email / id người dùng" />
          <select value={invoiceStatus} onChange={(event) => setInvoiceStatus(event.target.value)} className={fieldSelectClass}><option value="all">Tất cả trạng thái</option><option value="draft">Bản nháp</option><option value="open">Đang mở</option><option value="paid">Đã thanh toán</option><option value="void">Đã hủy</option></select>
          <select value={invoicePurpose} onChange={(event) => setInvoicePurpose(event.target.value)} className={fieldSelectClass}><option value="all">Tất cả mục đích</option><option value="subscription_plan">Gói đăng ký</option><option value="mentor_booking">Đặt lịch mentor</option></select>
          <Input value={invoiceUserId} onChange={(event) => setInvoiceUserId(event.target.value)} placeholder="User ID" />
        </div>
      );
    }

    if (activeTab === 'subscriptions') {
      return (
        <div className="grid gap-3 lg:grid-cols-3">
          <Input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Tìm kiếm cục bộ: email / id người dùng" />
          <select value={subscriptionStatus} onChange={(event) => setSubscriptionStatus(event.target.value)} className={fieldSelectClass}><option value="all">Tất cả trạng thái</option><option value="active">Hoạt động</option><option value="expired">Hết hạn</option><option value="cancelled">Đã hủy</option></select>
          <Input value={subscriptionUserId} onChange={(event) => setSubscriptionUserId(event.target.value)} placeholder="User ID" />
        </div>
      );
    }

    if (activeTab === 'bookings') {
      return (
        <div className="grid gap-3 lg:grid-cols-6">
          <Input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Tìm kiếm cục bộ: email / mentor" />
          <select value={bookingStatus} onChange={(event) => setBookingStatus(event.target.value)} className={fieldSelectClass}><option value="all">Tất cả trạng thái</option><option value="pending_payment">Chờ thanh toán</option><option value="confirmed">Đã xác nhận</option><option value="cancelled">Đã hủy</option><option value="completed">Hoàn thành</option></select>
          <Input value={bookingMentorId} onChange={(event) => setBookingMentorId(event.target.value)} placeholder="Mentor ID" />
          <Input value={bookingUserId} onChange={(event) => setBookingUserId(event.target.value)} placeholder="User ID" />
          <Input type="datetime-local" value={bookingFrom} onChange={(event) => setBookingFrom(event.target.value)} />
          <Input type="datetime-local" value={bookingTo} onChange={(event) => setBookingTo(event.target.value)} />
        </div>
      );
    }

    return (
      <div className="grid gap-3 lg:grid-cols-4">
        <Input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Tìm kiếm cục bộ: owner/title" />
        <select value={reportType} onChange={(event) => setReportType(event.target.value)} className={fieldSelectClass}><option value="all">Tất cả các báo cáo</option><option value="interview">Phỏng vấn</option><option value="match">So khớp</option></select>
        <select value={reportIsActive} onChange={(event) => setReportIsActive(event.target.value as 'all' | 'true' | 'false')} className={fieldSelectClass}><option value="all">Tất cả trạng thái</option><option value="true">Hoạt động</option><option value="false">Không hoạt động</option></select>
        <Input value={reportUserId} onChange={(event) => setReportUserId(event.target.value)} placeholder="User ID" />
      </div>
    );
  };

  const fieldSelectClass = 'flex h-10 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 shadow-sm outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50';

  return (
    <div className="space-y-8">
      <div className="overflow-hidden rounded-[28px] border border-amber-100 dark:border-amber-800/50 bg-gradient-to-br from-white via-amber-50/70 to-orange-50/70 dark:from-slate-900 dark:via-amber-900/20 dark:to-orange-900/20 p-6 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 shadow-lg shadow-amber-200">
              <CreditCard className="h-7 w-7 text-white" />
            </div>
            <div className="max-w-2xl">
              <h1 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 dark:text-slate-100">Bảng kê thanh toán</h1>
              <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-slate-400">
                Đối soát giao dịch thanh toán, hóa đơn, gói đăng ký, đặt lịch mentor và báo cáo trong một màn hình.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="outline" className="rounded-full border-amber-200 dark:border-amber-800 bg-white dark:bg-slate-900 px-3 py-1 text-amber-700 dark:text-amber-400">
              {tabMeta[activeTab].label}
            </Badge>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          {[
            { label: 'Tổng kết quả', value: activeTotals, icon: BarChart3 },
            { label: 'Đang hiển thị', value: visibleCount, icon: TrendingUp },
            { label: 'Trang hiện tại', value: page, icon: Receipt },
            { label: 'Bộ lọc', value: hasActiveFilters ? 'Đang bật' : 'Tắt', icon: Filter },
            { label: 'Tab', value: tabMeta[activeTab].label, icon: CreditCard },
            { label: 'Trạng thái tải', value: loading ? 'Đang tải' : 'Sẵn sàng', icon: Loader2 },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="rounded-2xl border border-white/70 bg-white dark:bg-slate-900/90 p-4 shadow-sm backdrop-blur">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-slate-400">{stat.label}</p>
                    <p className="mt-2 text-lg font-semibold text-gray-900 dark:text-slate-100">{stat.value}</p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        {Object.entries(tabMeta).map(([key, meta]) => {
          const Icon = meta.icon;
          const tab = key as BillingTab;
          return (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setPage(1);
              }}
              className={`group rounded-2xl border p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${activeTab === tab ? 'border-amber-200 dark:border-amber-800 bg-gradient-to-br from-amber-50 to-white dark:from-amber-900/40 dark:to-slate-900 shadow-sm' : 'border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900'}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">{meta.label}</p>
                  <p className="text-xs leading-5 text-gray-500 dark:text-slate-400">{meta.description}</p>
                </div>
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl transition-colors ${activeTab === tab ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400' : 'bg-gray-50 dark:bg-slate-950 text-gray-500 dark:text-slate-400 group-hover:bg-amber-50 dark:bg-amber-900/30 group-hover:text-amber-600 dark:text-amber-400'}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                <div className={`h-full rounded-full ${activeTab === tab ? 'bg-gradient-to-r from-amber-500 to-orange-500' : 'bg-transparent'}`} />
              </div>
            </button>
          );
        })}
      </div>

      <Card className="border-gray-100 dark:border-slate-800 p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">Bộ lọc</h2>
            <p className="text-sm text-gray-500 dark:text-slate-400">{visibleCountLabel}</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => void setPage(1)} disabled={loading}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Làm mới
            </Button>
            <Badge variant="outline" className="rounded-full bg-slate-50 dark:bg-slate-950 px-3 py-1 text-slate-700 dark:text-slate-300">
              {tabCountLabel}
            </Badge>
          </div>
        </div>

        <div className="mt-5 space-y-4 rounded-2xl border border-dashed border-amber-100 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-900/30 p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-amber-700 dark:text-amber-400">
            <Filter className="h-4 w-4" />
            <span>{tabMeta[activeTab].description}</span>
          </div>
          {renderFilters()}
        </div>
      </Card>

      <Card className="overflow-hidden border-gray-100 dark:border-slate-800 p-0 shadow-sm">
        <div className="border-b border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 py-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">{tabMeta[activeTab].label}</h2>
              <p className="text-sm text-gray-500 dark:text-slate-400">{loading ? 'Đang tải...' : `${activeTotals} kết quả toàn hệ thống`}</p>
            </div>
            <Badge variant="outline" className="w-fit rounded-full border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/30 px-3 py-1 text-amber-700 dark:text-amber-400">
              {visibleCountLabel} trên trang
            </Badge>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-16 text-sm text-gray-500 dark:text-slate-400">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Đang tải dữ liệu...
          </div>
        ) : (
          renderTable()
        )}

        <div className="flex flex-col gap-3 border-t border-gray-100 dark:border-slate-800 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-gray-500 dark:text-slate-400">
            Hiển thị <span className="font-medium text-gray-900 dark:text-slate-100">{visibleCount}</span> / <span className="font-medium text-gray-900 dark:text-slate-100">{activeTotals}</span> kết quả
          </div>
          <Button variant="outline" size="sm" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page <= 1 || loading}>
            Trước
          </Button>
          <div className="text-sm text-gray-600 dark:text-slate-400">
            {page} / {Math.max(1, Math.ceil(activeTotals / pageSize))}
          </div>
          <Button variant="outline" size="sm" onClick={() => setPage((current) => Math.min(Math.ceil(activeTotals / pageSize), current + 1))} disabled={page >= Math.ceil(activeTotals / pageSize) || loading}>
            Sau
          </Button>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-gray-100 dark:border-slate-800 bg-gradient-to-br from-white to-amber-50/40 dark:from-slate-900 dark:to-amber-900/20 p-5 shadow-sm">
          <p className="text-sm text-gray-500 dark:text-slate-400">Doanh thu</p>
          <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-slate-100">{formatCurrency(payments.reduce((sum, item) => sum + item.amount, 0))}</p>
          <p className="mt-2 text-xs text-gray-500 dark:text-slate-400">Tổng giá trị giao dịch.</p>
        </Card>
        <Card className="border-gray-100 dark:border-slate-800 bg-gradient-to-br from-white to-sky-50/40 dark:from-slate-900 dark:to-sky-900/20 p-5 shadow-sm">
          <p className="text-sm text-gray-500 dark:text-slate-400">Hóa đơn</p>
          <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-slate-100">{formatCurrency(invoices.reduce((sum, item) => sum + item.amount, 0))}</p>
          <p className="mt-2 text-xs text-gray-500 dark:text-slate-400">Tổng giá trị hóa đơn.</p>
        </Card>
        <Card className="border-gray-100 dark:border-slate-800 bg-gradient-to-br from-white to-emerald-50/40 dark:from-slate-900 dark:to-emerald-900/20 p-5 shadow-sm">
          <p className="text-sm text-gray-500 dark:text-slate-400">Đặt lịch Mentor</p>
          <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-slate-100">{formatCurrency(mentorBookings.reduce((sum, item) => sum + item.priceAmount, 0))}</p>
          <p className="mt-2 text-xs text-gray-500 dark:text-slate-400">Tổng giá trị đặt lịch mentor.</p>
        </Card>
      </div>
    </div>
  );
};

export default AdminBillingPage;
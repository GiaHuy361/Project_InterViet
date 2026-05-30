import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { CalendarDays, CheckCircle2, Clock3, Search, Star, XCircle, RefreshCw, CircleDollarSignIcon, DollarSignIcon } from 'lucide-react';
import { toast } from 'sonner';
import { AppPageHeader } from '../components/design-system/AppPageHeader';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Label } from '../components/ui/label';
import { ApiError } from '../../lib/api/apiError';
import mentorService, { type MentorBookingItem } from '../../services/mentorService';
import { isDevBillingEnabled } from '../../config/devBilling';

const statusLabel: Record<string, string> = {
  pending_payment: 'Chờ thanh toán',
  confirmed: 'Đã xác nhận',
  cancelled: 'Đã hủy',
  completed: 'Hoàn thành',
};

const statusColor: Record<string, string> = {
  pending_payment: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800 hover:bg-amber-200',
  confirmed: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800 hover:bg-blue-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800 hover:bg-red-200',
  completed: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800 hover:bg-emerald-200',
};

export const MentorBookingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { id: routeBookingId } = useParams();
  const [bookings, setBookings] = useState<MentorBookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(routeBookingId ?? null);
  const [refreshing, setRefreshing] = useState(false);

  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState('5');
  const [reviewComment, setReviewComment] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const loadBookings = async (showSpinner = false) => {
    try {
      if (showSpinner) setLoading(true);
      else setRefreshing(true);
      const response = await mentorService.listMentorBookings({
        status: status === 'all' ? undefined : status,
      });
      setBookings(response || []);
      setError(null);
      if (!selectedBookingId && response?.length) {
        setSelectedBookingId(response[0].id);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.getUserMessage() : 'Không thể tải lịch đặt mentor.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadBookings(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadBookings(false);
    }, 250);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  useEffect(() => {
    if (routeBookingId) {
      setSelectedBookingId(routeBookingId);
    }
  }, [routeBookingId]);

  const selectedBooking = useMemo(
    () => bookings.find((item) => item.id === selectedBookingId) ?? null,
    [bookings, selectedBookingId]
  );

  const handleOpenBooking = (booking: MentorBookingItem) => {
    setSelectedBookingId(booking.id);
    navigate(`/mentor-bookings/${booking.id}`, { replace: true });
  };

  const handleCancel = async () => {
    if (!selectedBooking) return;
    setActionLoading(true);
    try {
      await mentorService.cancelMentorBooking(selectedBooking.id, { reason: cancelReason.trim() });
      toast.success('Đã hủy booking và mở lại slot.');
      setCancelOpen(false);
      setCancelReason('');
      await loadBookings(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.getUserMessage() : 'Không thể hủy booking.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSimulateComplete = async () => {
    if (!selectedBooking) return;
    setActionLoading(true);
    try {
      await mentorService.simulateCompleteMentorBooking(selectedBooking.id);
      toast.success('Đã mô phỏng hoàn thành booking.');
      await loadBookings(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.getUserMessage() : 'Không thể mô phỏng hoàn thành.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReview = async () => {
    if (!selectedBooking) return;
    setActionLoading(true);
    try {
      await mentorService.submitMentorBookingReview(selectedBooking.id, {
        rating: Number(reviewRating),
        comment: reviewComment.trim(),
      });
      toast.success('Đã gửi đánh giá mentor.');
      setReviewOpen(false);
      setReviewComment('');
      setReviewRating('5');
      await loadBookings(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.getUserMessage() : 'Không thể gửi đánh giá.');
    } finally {
      setActionLoading(false);
    }
  };

  const canUseSimulator = isDevBillingEnabled || import.meta.env.MODE !== 'production';

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-12">
      <AppPageHeader
        title="Danh sách Lịch đặt của Ứng viên"
        subtitle="Theo dõi trạng thái booking, meeting link, review và checkout tương ứng"
        icon={CalendarDays}
        iconGradient="from-emerald-500 to-cyan-600"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => void loadBookings(false)} disabled={refreshing || loading}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Làm mới
            </Button>
            <Button variant="outline" onClick={() => navigate('/network')}>
              Danh bạ mentor
            </Button>
          </div>
        }
      />

      <Card className="p-5">
        <div className="grid gap-4 md:grid-cols-[1fr_220px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm theo booking, mentor, trạng thái" className="pl-10" />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue placeholder="Tất cả trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              <SelectItem value="pending_payment">pending_payment</SelectItem>
              <SelectItem value="confirmed">confirmed</SelectItem>
              <SelectItem value="cancelled">cancelled</SelectItem>
              <SelectItem value="completed">completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {loading ? (
        <Card className="p-10 text-center text-sm text-gray-500">Đang tải danh sách booking...</Card>
      ) : error ? (
        <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30 p-6 text-red-700 dark:text-red-400">{error}</Card>
      ) : bookings.length === 0 ? (
        <Card className="p-10 text-center">
          <CalendarDays className="mx-auto mb-3 h-14 w-14 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900">Chưa có booking nào</h3>
          <p className="mt-1 text-sm text-gray-500">Đặt lịch mentor từ danh bạ để bắt đầu.</p>
        </Card>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-3">
            {bookings.map((booking) => (
              <button
                key={booking.id}
                type="button"
                onClick={() => handleOpenBooking(booking)}
                className={`w-full rounded-2xl border p-4 text-left transition-all ${selectedBookingId === booking.id ? 'border-cyan-300 bg-cyan-50 dark:border-cyan-800 dark:bg-cyan-900/40 shadow-sm' : 'border-gray-200 bg-white dark:border-slate-800 dark:bg-slate-900 hover:border-gray-300 dark:hover:border-slate-700'}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">{booking.mentorName}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{booking.mentorHeadline || booking.serviceType}</p>
                  </div>
                  <Badge variant="outline" className={statusColor[booking.status] || ''}>
                    {statusLabel[booking.status] || booking.status}
                  </Badge>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                  <span className="inline-flex items-center gap-1"><DollarSignIcon className="h-4 w-4 text-green-500" /> {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: booking.currencyCode, maximumFractionDigits: 0 }).format(booking.amount)}</span>
                  <span className="inline-flex items-center gap-1"><Clock3 className="h-4 w-4 text-cyan-500" /> {booking.scheduledStartsAt ? new Date(booking.scheduledStartsAt).toLocaleString('vi-VN') : 'Chờ xác nhận'}</span>
                </div>
              </button>
            ))}
          </div>

          <Card className="space-y-4 p-6">
            {selectedBooking ? (
              <>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{selectedBooking.mentorName}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{selectedBooking.mentorHeadline || selectedBooking.serviceType}</p>
                  </div>
                  <Badge variant="outline" className={statusColor[selectedBooking.status] || ''}>
                    {statusLabel[selectedBooking.status] || selectedBooking.status}
                  </Badge>
                </div>

                <div className="grid gap-3 text-sm text-gray-700 dark:text-gray-300">
                  <InfoRow label="Giờ bắt đầu" value={selectedBooking.scheduledStartsAt ? new Date(selectedBooking.scheduledStartsAt).toLocaleString('vi-VN') : 'Chờ xác nhận'} />
                  <InfoRow label="Giờ kết thúc" value={selectedBooking.scheduledEndsAt ? new Date(selectedBooking.scheduledEndsAt).toLocaleString('vi-VN') : 'Chờ xác nhận'} />
                  <InfoRow label="Loại Dịch vụ" value={selectedBooking.serviceType} />
                  <InfoRow label="Giá tiền" value={new Intl.NumberFormat('vi-VN', { style: 'currency', currency: selectedBooking.currencyCode, maximumFractionDigits: 0 }).format(selectedBooking.amount)} />
                  <InfoRow label="Link Meeting" value={selectedBooking.meetingUrl || 'Chưa có'} />
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  {selectedBooking.status === 'pending_payment' || selectedBooking.status === 'confirmed' ? (
                    <Button variant="outline" onClick={() => setCancelOpen(true)}>
                      <XCircle className="mr-2 h-4 w-4" />
                      Hủy booking
                    </Button>
                  ) : null}
                  {selectedBooking.status === 'confirmed' && canUseSimulator ? (
                    <Button variant="outline" onClick={() => void handleSimulateComplete()} disabled={actionLoading}>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Simulate complete
                    </Button>
                  ) : null}
                  {selectedBooking.status === 'completed' ? (
                    <Button onClick={() => setReviewOpen(true)}>
                      <Star className="mr-2 h-4 w-4" />
                      Viết review
                    </Button>
                  ) : null}
                </div>
              </>
            ) : (
              <div className="rounded-2xl border border-dashed border-gray-200 dark:border-slate-800 p-6 text-center text-sm text-gray-500 dark:text-gray-400">
                Chọn một booking để xem chi tiết.
              </div>
            )}
          </Card>
        </div>
      )}

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hủy lịch đặt cố vấn</DialogTitle>
            <DialogDescription>Chỉ hủy khi đang pending_payment hoặc confirmed và chưa tới giờ hẹn.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Textarea value={cancelReason} onChange={(event) => setCancelReason(event.target.value)} placeholder="Lý do hủy" rows={4} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelOpen(false)}>Đóng</Button>
            <Button onClick={() => void handleCancel()} disabled={actionLoading || !cancelReason.trim()}>
              {actionLoading ? 'Đang xử lý...' : 'Xác nhận hủy'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gửi đánh giá mentor</DialogTitle>
            <DialogDescription>Chỉ gửi một lần cho booking đã completed.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Rating</Label>
              <Select value={reviewRating} onValueChange={setReviewRating}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn số sao" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 sao</SelectItem>
                  <SelectItem value="4">4 sao</SelectItem>
                  <SelectItem value="3">3 sao</SelectItem>
                  <SelectItem value="2">2 sao</SelectItem>
                  <SelectItem value="1">1 sao</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Comment</Label>
              <Textarea value={reviewComment} onChange={(event) => setReviewComment(event.target.value)} rows={5} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewOpen(false)}>Đóng</Button>
            <Button onClick={() => void handleReview()} disabled={actionLoading || !reviewComment.trim()}>
              {actionLoading ? 'Đang gửi...' : 'Gửi review'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const InfoRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="rounded-xl border border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50 px-4 py-3">
    <p className="text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500">{label}</p>
    <p className="mt-1 break-words font-medium text-gray-900 dark:text-gray-100">{value}</p>
  </div>
);

export default MentorBookingsPage;

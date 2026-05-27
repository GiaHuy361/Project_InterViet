import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Search,
  XCircle,
  RefreshCw,
  Video,
  User,
  Loader2,
  DollarSign
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../../components/ui/dialog';
import mentorWorkspaceService from '../../../services/mentorWorkspaceService';
import type { MentorWorkspaceBookingItem } from '../../../lib/api/publicTypes';

const statusLabel: Record<string, string> = {
  pending_payment: 'Chờ thanh toán',
  confirmed: 'Sắp diễn ra',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
};

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline' | 'success'> = {
  pending_payment: 'outline',
  confirmed: 'default',
  completed: 'success',
  cancelled: 'destructive',
};

export const MentorWorkspaceBookingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<MentorWorkspaceBookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;

  // Selected Booking for Details
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [detailData, setDetailData] = useState<MentorWorkspaceBookingItem | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Cancel action state
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const loadBookings = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    else setRefreshing(true);

    try {
      const response = await mentorWorkspaceService.getMentorBookings({
        search: searchQuery.trim() || undefined,
        status: filterStatus === 'all' ? undefined : filterStatus,
        page,
        pageSize,
      });
      setBookings(response.items || []);
      setTotal(response.total || 0);
    } catch (err) {
      console.error(err);
      toast.error('Không thể tải lịch hẹn.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadBookings(true);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [filterStatus, page]); // Re-fetch on filter or page change

  const handleOpenDetail = async (id: string) => {
    setSelectedBookingId(id);
    setDetailLoading(true);
    try {
      const data = await mentorWorkspaceService.getMentorBookingDetail(id);
      setDetailData(data);
    } catch (err) {
      toast.error('Không thể tải chi tiết lịch hẹn.');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCloseDetail = () => {
    setSelectedBookingId(null);
    setDetailData(null);
    setCancelOpen(false);
    setCancelReason('');
  };

  const handleComplete = async () => {
    if (!detailData) return;
    setActionLoading(true);
    try {
      await mentorWorkspaceService.updateMentorBookingStatus(detailData.id, { status: 'completed' });
      toast.success('Đã đánh dấu hoàn thành lịch hẹn.');
      await loadBookings(false);
      handleOpenDetail(detailData.id); // reload detail
    } catch (err) {
      toast.error('Không thể cập nhật trạng thái.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!detailData) return;
    if (!cancelReason.trim()) {
      toast.error('Vui lòng nhập lý do hủy lịch.');
      return;
    }
    setActionLoading(true);
    try {
      await mentorWorkspaceService.updateMentorBookingStatus(detailData.id, {
        status: 'cancelled',
        cancelReason: cancelReason.trim()
      });
      toast.success('Đã hủy lịch hẹn thành công.');
      setCancelOpen(false);
      await loadBookings(false);
      handleOpenDetail(detailData.id); // reload detail
    } catch (err) {
      toast.error('Không thể hủy lịch hẹn.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Quản lý Lịch hẹn</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400">Xem và xử lý các yêu cầu đặt lịch từ ứng viên</p>
        </div>
        <Button variant="outline" onClick={() => loadBookings(true)} disabled={loading || refreshing}>
          <RefreshCw className={`mr-2 h-4 w-4 ${(loading || refreshing) ? 'animate-spin' : ''}`} />
          Làm mới
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm theo tên hoặc email ứng viên..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadBookings(true)}
            className="w-full rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 py-2.5 pl-9 pr-4 text-sm focus:border-cyan-500 focus:bg-white dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-colors"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-2.5 px-4 text-sm focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="pending_payment">Chờ thanh toán</option>
          <option value="confirmed">Sắp diễn ra (Đã chốt)</option>
          <option value="completed">Hoàn thành</option>
          <option value="cancelled">Đã hủy</option>
        </select>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-3xl border border-gray-100 bg-white dark:bg-slate-900">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
        </div>
      ) : bookings.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-3xl border border-gray-100 bg-white dark:bg-slate-900 text-center shadow-sm">
          <CalendarDays className="mb-4 h-12 w-12 text-gray-300" />
          <p className="text-lg font-medium text-gray-900 dark:text-slate-100">Không tìm thấy lịch hẹn nào</p>
          <p className="text-sm text-gray-500 dark:text-slate-400">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bookings.map(booking => (
            <div
              key={booking.id}
              onClick={() => handleOpenDetail(booking.id)}
              className="cursor-pointer rounded-2xl border border-gray-100 bg-white dark:bg-slate-900 p-5 shadow-sm transition-all hover:border-cyan-300 hover:shadow-md"
            >
              <div className="flex justify-between items-start mb-4">
                <Badge variant={statusVariant[booking.status] || 'outline'}>
                  {statusLabel[booking.status] || booking.status}
                </Badge>
                <span className="text-xs text-gray-400">
                  {new Date(booking.createdAt || '').toLocaleDateString('vi-VN')}
                </span>
              </div>

              <div className="flex items-center gap-3 mb-4">
                {booking.candidateAvatarUrl ? (
                  <img src={booking.candidateAvatarUrl} alt="Avatar" className="w-10 h-10 rounded-full border border-gray-200 dark:border-slate-800 object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-cyan-100 dark:bg-cyan-900/40 flex items-center justify-center text-cyan-600 dark:text-cyan-400 font-bold border border-cyan-200 dark:border-cyan-800">
                    {booking.candidateName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="overflow-hidden">
                  <p className="font-semibold text-gray-900 dark:text-slate-100 truncate">{booking.candidateName}</p>
                  <p className="text-xs text-gray-500 dark:text-slate-400 truncate">{booking.serviceType}</p>
                </div>
              </div>

              <div className="space-y-2 mt-4 pt-4 border-t border-gray-100 text-sm">
                <div className="flex items-center text-gray-600 dark:text-slate-400">
                  <Clock3 className="w-4 h-4 mr-2 text-cyan-600 dark:text-cyan-400" />
                  {booking.scheduledStartsAt ? (
                    <span>
                      {new Date(booking.scheduledStartsAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      {' - '}
                      {new Date(booking.scheduledStartsAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </span>
                  ) : 'Chưa xếp lịch'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {total > pageSize && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Trang trước</Button>
          <span className="text-sm text-gray-600 dark:text-slate-400">Trang {page} / {Math.ceil(total / pageSize)}</span>
          <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(Math.ceil(total / pageSize), p + 1))} disabled={page >= Math.ceil(total / pageSize)}>Trang sau</Button>
        </div>
      )}

      {/* Booking Detail Modal */}
      <Dialog open={!!selectedBookingId} onOpenChange={(open) => !open && handleCloseDetail()}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Chi tiết lịch hẹn</DialogTitle>
          </DialogHeader>

          {detailLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
            </div>
          ) : detailData ? (
            <div className="space-y-6">
              {/* Candidate Info */}
              <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-slate-950 rounded-2xl border border-gray-100">
                {detailData.candidateAvatarUrl ? (
                  <img src={detailData.candidateAvatarUrl} alt="Avatar" className="w-16 h-16 rounded-full border-2 border-white shadow-sm object-cover" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-cyan-100 dark:bg-cyan-900/40 flex items-center justify-center text-cyan-600 dark:text-cyan-400 font-bold text-xl border-2 border-white shadow-sm">
                    {detailData.candidateName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100">{detailData.candidateName}</h3>
                  <div className="flex items-center text-sm text-gray-500 dark:text-slate-400 mt-1">
                    <User className="w-3.5 h-3.5 mr-1" /> {detailData.candidateEmail}
                  </div>
                  <div className="mt-2">
                    <Badge variant={statusVariant[detailData.status] || 'outline'}>
                      {statusLabel[detailData.status] || detailData.status}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Booking Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-800">
                  <p className="text-xs text-gray-500 dark:text-slate-400 font-medium uppercase mb-1">Dịch vụ</p>
                  <p className="font-semibold">{detailData.serviceType}</p>
                </div>
                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-800">
                  <p className="text-xs text-gray-500 dark:text-slate-400 font-medium uppercase mb-1">Giá trị</p>
                  <p className="font-semibold flex items-center text-green-600 dark:text-green-400">
                    <DollarSign className="w-4 h-4 mr-0.5" />
                    {new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(detailData.amount)} {detailData.currencyCode}
                  </p>
                </div>
              </div>

              {/* Time & Meeting */}
              <div className="space-y-3 p-4 bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800">
                <div className="flex items-start gap-3">
                  <Clock3 className="w-5 h-5 text-cyan-600 dark:text-cyan-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-slate-100">Thời gian diễn ra</p>
                    <p className="text-sm text-gray-600 dark:text-slate-400">
                      {detailData.scheduledStartsAt ? (
                        <>
                          {new Date(detailData.scheduledStartsAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - {new Date(detailData.scheduledEndsAt || '').toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                          <br />
                          {new Date(detailData.scheduledStartsAt).toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </>
                      ) : 'Chưa xếp lịch'}
                    </p>
                  </div>
                </div>

                {detailData.meetingUrl && detailData.status === 'confirmed' && (
                  <div className="flex items-start gap-3 pt-3 border-t border-gray-100">
                    <Video className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-slate-100">Link cuộc họp (Google Meet/Zoom)</p>
                      <a href={detailData.meetingUrl} target="_blank" rel="noreferrer" className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline break-all">
                        {detailData.meetingUrl}
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Candidate Notes */}
              <div className="p-4 bg-amber-50 dark:bg-amber-900/30 rounded-xl border border-amber-100 dark:border-amber-800/50">
                <p className="text-xs text-amber-700 dark:text-amber-400 font-bold uppercase mb-2">Ghi chú từ ứng viên</p>
                <p className="text-sm text-amber-900 whitespace-pre-wrap">
                  {detailData.candidateNotes || <span className="italic text-amber-700 dark:text-amber-400/60">Không có ghi chú.</span>}
                </p>
              </div>

              {/* Cancel Info */}
              {detailData.status === 'cancelled' && (
                <div className="p-4 bg-red-50 dark:bg-red-900/30 rounded-xl border border-red-100 dark:border-red-800/50">
                  <p className="text-xs text-red-700 dark:text-red-400 font-bold uppercase mb-2">Lý do hủy</p>
                  <p className="text-sm text-red-900 whitespace-pre-wrap">
                    {detailData.cancelReason || 'Không rõ lý do.'}
                  </p>
                </div>
              )}

              {/* Actions Area */}
              {detailData.status === 'confirmed' && (
                <div className="pt-4 border-t border-gray-100 flex flex-col gap-3">
                  {!cancelOpen ? (
                    <div className="flex gap-3 justify-end">
                      <Button variant="outline" className="text-red-600 dark:text-red-400 hover:text-red-700 dark:text-red-400 hover:bg-red-50 dark:bg-red-900/30" onClick={() => setCancelOpen(true)}>
                        <XCircle className="w-4 h-4 mr-2" /> Hủy lịch hẹn
                      </Button>
                      <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleComplete} disabled={actionLoading}>
                        {actionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                        Đánh dấu hoàn thành
                      </Button>
                    </div>
                  ) : (
                    <div className="bg-red-50 dark:bg-red-900/30 p-4 rounded-xl border border-red-200 dark:border-red-800">
                      <h4 className="font-semibold text-red-800 dark:text-red-300 mb-2">Xác nhận hủy lịch hẹn</h4>
                      <p className="text-sm text-red-700 dark:text-red-400 mb-3">Ứng viên sẽ được thông báo và slot này sẽ được mở lại.</p>
                      <textarea
                        className="w-full text-sm p-3 border border-red-200 dark:border-red-800 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                        rows={3}
                        placeholder="Vui lòng nhập lý do hủy lịch..."
                        value={cancelReason}
                        onChange={e => setCancelReason(e.target.value)}
                      />
                      <div className="flex gap-2 justify-end">
                        <Button variant="outline" size="sm" onClick={() => setCancelOpen(false)}>Quay lại</Button>
                        <Button variant="destructive" size="sm" onClick={handleCancel} disabled={actionLoading}>
                          {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Xác nhận hủy'}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MentorWorkspaceBookingsPage;

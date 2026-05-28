import React, { useEffect, useState } from 'react';
import { Card } from '../../components/ui/card';
import { 
  LayoutDashboard, 
  CalendarCheck, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Star,
  Banknote,
  Calendar,
  Loader2,
  RefreshCw,
  ChevronRight
} from 'lucide-react';
import mentorWorkspaceService from '../../../services/mentorWorkspaceService';
import type { MentorWorkspaceDashboardSummary } from '../../../lib/api/publicTypes';
import { toast } from 'sonner';
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

export const MentorDashboardPage: React.FC = () => {
  const [data, setData] = useState<MentorWorkspaceDashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const loadDashboard = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const summary = await mentorWorkspaceService.getMentorDashboardSummary();
      setData(summary);
    } catch (error) {
      console.error('Failed to load mentor dashboard', error);
      toast.error('Không thể tải dữ liệu Dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading && !data) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-gray-500 dark:text-slate-400">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
          <p>Đang tải dữ liệu tổng quan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-200">
            <LayoutDashboard className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Mentor Dashboard</h1>
            <p className="text-sm text-gray-500 dark:text-slate-400">
              Tổng quan hoạt động và hiệu suất của bạn
            </p>
          </div>
        </div>
        
        <button
          className="flex items-center gap-2 rounded-xl bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-slate-300 shadow-sm border border-gray-200 dark:border-slate-800 transition-colors hover:bg-gray-50 dark:hover:bg-slate-800 dark:bg-slate-950"
          onClick={() => loadDashboard(true)}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Làm mới
        </button>
      </div>

      {/* Main Stats Row */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Pending */}
        <div className="group relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-slate-400">Chờ xác nhận</p>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-slate-100">{data?.pendingBookingsCount || 0}</p>
            </div>
            <div className="rounded-2xl bg-amber-50 dark:bg-amber-900/30 p-3">
              <Clock className="h-6 w-6 text-amber-500" />
            </div>
          </div>
        </div>

        {/* Confirmed */}
        <div className="group relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-slate-400">Sắp diễn ra</p>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-slate-100">{data?.confirmedBookingsCount || 0}</p>
            </div>
            <div className="rounded-2xl bg-blue-50 dark:bg-blue-900/30 p-3">
              <CalendarCheck className="h-6 w-6 text-blue-500" />
            </div>
          </div>
        </div>

        {/* Completed */}
        <div className="group relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-slate-400">Đã hoàn thành</p>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-slate-100">{data?.completedBookingsCount || 0}</p>
            </div>
            <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 p-3">
              <CheckCircle2 className="h-6 w-6 text-emerald-500" />
            </div>
          </div>
        </div>

        {/* Cancelled */}
        <div className="group relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-slate-400">Đã hủy</p>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-slate-100">{data?.cancelledBookingsCount || 0}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 dark:bg-slate-950 p-3">
              <XCircle className="h-6 w-6 text-slate-500 dark:text-slate-400" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Performance & Revenue */}
        <div className="space-y-6 lg:col-span-1">
          <div className="rounded-3xl bg-gradient-to-br from-gray-900 to-gray-800 p-6 text-white shadow-xl relative overflow-hidden">
            <div className="absolute right-0 top-0 -mt-8 -mr-8 h-32 w-32 rounded-full bg-white dark:bg-slate-900/10 blur-2xl"></div>
            <p className="text-sm font-medium text-gray-400">Tổng thu nhập</p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-4xl font-bold tracking-tight">
                {new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(data?.totalEarningsAmount || 0)}
              </span>
              <span className="text-xl font-medium text-gray-400">{data?.currencyCode || 'VND'}</span>
            </div>
            <div className="mt-6 flex items-center gap-3 rounded-2xl bg-white dark:bg-slate-900/10 p-4 backdrop-blur-md">
              <Banknote className="h-5 w-5 text-emerald-400" />
              <p className="text-sm text-gray-300">Đã bao gồm tất cả các buổi đã hoàn thành.</p>
            </div>
          </div>

          <div className="rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-sm border border-gray-100">
            <p className="text-sm font-medium text-gray-500 dark:text-slate-400">Đánh giá trung bình</p>
            <div className="mt-2 flex items-center gap-3">
              <span className="text-4xl font-bold text-gray-900 dark:text-slate-100">{data?.averageRating?.toFixed(1) || '0.0'}</span>
              <div className="flex flex-col gap-1">
                <div className="flex text-amber-400">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className={`h-4 w-4 ${s <= (data?.averageRating || 0) ? 'fill-current' : 'text-gray-200'}`} />
                  ))}
                </div>
                <span className="text-xs text-gray-500 dark:text-slate-400">Dựa trên các lượt đánh giá</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Bookings */}
        <div className="lg:col-span-2">
          <div className="rounded-3xl bg-white dark:bg-slate-900 shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full">
            <div className="border-b border-gray-100 p-6 flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100">Lịch hẹn gần đây</h2>
              <button className="text-sm text-cyan-600 dark:text-cyan-400 font-medium hover:text-cyan-700 dark:text-cyan-400 flex items-center gap-1">
                Xem tất cả <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            
            <div className="p-6 flex-1">
              {(!data?.recentBookings || data.recentBookings.length === 0) ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-50 dark:bg-slate-950 mb-4">
                    <Calendar className="h-8 w-8 text-gray-300" />
                  </div>
                  <p className="text-sm font-medium text-gray-900 dark:text-slate-100">Chưa có lịch hẹn nào</p>
                  <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">Khi ứng viên đặt lịch, thông tin sẽ xuất hiện tại đây.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {data.recentBookings.map((booking) => (
                    <div key={booking.id} className="flex items-center gap-4 rounded-2xl border border-gray-100 p-4 transition-colors hover:bg-gray-50 dark:hover:bg-slate-800 dark:bg-slate-950">
                      <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-cyan-50 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400">
                        <span className="text-xs font-bold uppercase">{booking.scheduledStartsAt ? new Date(booking.scheduledStartsAt).toLocaleDateString('vi-VN', { month: 'short' }) : 'N/A'}</span>
                        <span className="text-lg font-black leading-none">{booking.scheduledStartsAt ? new Date(booking.scheduledStartsAt).getDate() : '--'}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-base font-semibold text-gray-900 dark:text-slate-100">{booking.serviceType || 'Dịch vụ Tư vấn'}</p>
                        <p className="truncate text-sm text-gray-500 dark:text-slate-400">
                          {booking.scheduledStartsAt ? new Date(booking.scheduledStartsAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : 'Chưa xếp lịch'} 
                          {' • '} 
                          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: booking.currencyCode, maximumFractionDigits: 0 }).format(booking.amount)}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium border ${statusColor[booking.status] || 'bg-gray-100 text-gray-800 dark:text-slate-200 border-transparent'}`}>
                          {statusLabel[booking.status] || booking.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MentorDashboardPage;

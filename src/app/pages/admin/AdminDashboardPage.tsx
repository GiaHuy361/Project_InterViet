/**
 * Admin Dashboard Page
 *
 * Overview dashboard for administrators.
 * Shows live system statistics, support status and system activity.
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  Shield,
  Users,
  CreditCard,
  Activity,
  FileText,
  Server,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  BarChart3,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { Button } from '../../components/ui/button';
import { useApp } from '../../contexts/AppContext';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import adminService, { AdminDashboardSummaryResponse } from '../../../services/adminManagementService';

const quickLinks = [
  { label: 'Quản lý người dùng', path: '/admin/users', icon: Users, description: 'Xem, tìm kiếm và quản lý tài khoản' },
  { label: 'Billing & Hóa đơn', path: '/admin/billing', icon: CreditCard, description: 'Quản lý thanh toán và hóa đơn' },
  { label: 'Audit Logs', path: '/admin/audit-logs', icon: Activity, description: 'Xem nhật ký hoạt động hệ thống' },
  { label: 'Health Check', path: '/admin/health', icon: FileText, description: 'Kiểm tra trạng thái dịch vụ' },
  { label: 'Support Tickets', path: '/support/tickets', icon: FileText, description: 'Quản lý ticket hỗ trợ' },
];

const summaryCards = [
  {
    key: 'totalUsers',
    label: 'Tổng người dùng',
    icon: Users,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-900/30',
  },
  {
    key: 'totalSubscriptionRevenue',
    label: 'Doanh thu Subscription',
    icon: CreditCard,
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-50 dark:bg-emerald-900/30',
  },
  {
    key: 'totalBookingRevenue',
    label: 'Doanh thu Mentor Booking',
    icon: FileText,
    color: 'text-violet-600 dark:text-violet-400',
    bgColor: 'bg-violet-50 dark:bg-violet-900/30',
  },
  {
    key: 'aiSessions',
    label: 'Tổng số phiên AI',
    icon: BarChart3,
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-900/30',
  },
];

export const AdminDashboardPage: React.FC = () => {
  const { state } = useApp();
  const navigate = useNavigate();
  const enableDevBootstrap = (import.meta.env.VITE_ENABLE_DEV_BOOTSTRAP === 'true') || import.meta.env.MODE !== 'production';
  const [summary, setSummary] = useState<AdminDashboardSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadSummary = async () => {
      setLoading(true);
      try {
        const data = await adminService.getAdminDashboardSummary();
        if (mounted) setSummary(data);
      } catch (err) {
        console.error('Failed to load admin dashboard summary', err);
        if (mounted) setSummary(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadSummary();
    return () => {
      mounted = false;
    };
  }, []);

  const supportTotal = useMemo(() => {
    const stats = summary?.supportTicketsByStatus;
    if (!stats) return 0;
    return stats.open + stats.in_progress + stats.resolved + stats.closed;
  }, [summary]);

  const formatCurrency = (value?: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value || 0);

  const formatNumber = (value?: number) => new Intl.NumberFormat('vi-VN').format(value || 0);

  const supportTicketPercentages = useMemo(() => {
    const stats = summary?.supportTicketsByStatus;
    if (!stats || supportTotal === 0) return [];
    return [
      { key: 'open', label: 'Open', value: stats.open, color: '#ef4444' },
      { key: 'in_progress', label: 'In progress', value: stats.in_progress, color: '#f59e0b' },
      { key: 'resolved', label: 'Resolved', value: stats.resolved, color: '#10b981' },
      { key: 'closed', label: 'Closed', value: stats.closed, color: '#64748b' },
    ].filter((item) => item.value > 0);
  }, [summary, supportTotal]);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-purple-200">
          <Shield className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Admin Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400">
            Xin chào, <span className="font-medium text-gray-700 dark:text-slate-300">{state.user?.name}</span> •{' '}
            <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 dark:bg-violet-900/40 px-2 py-0.5 text-xs font-semibold text-violet-700 dark:text-violet-400">
              <Shield className="h-3 w-3" />
              {state.user?.systemRole?.toUpperCase()}
            </span>
          </p>
        </div>
      </div>

      <div className="flex justify-end">
        {enableDevBootstrap && (
          <Button variant="ghost" onClick={() => navigate('/admin/json-samples')}>JSON Samples</Button>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((stat) => {
          const Icon = stat.icon;
          const value =
            stat.key === 'totalUsers'
              ? formatNumber(summary?.totalUsers)
              : stat.key === 'totalSubscriptionRevenue'
                ? formatCurrency(summary?.totalSubscriptionRevenue)
                : stat.key === 'totalBookingRevenue'
                  ? formatCurrency(summary?.totalBookingRevenue)
                  : stat.key === 'aiSessions'
                    ? formatNumber((summary?.totalMatchingSessions || 0) + (summary?.totalInterviewSessions || 0))
                    : '—';
          const trend =
            stat.key === 'totalUsers'
              ? `+${formatNumber(summary?.newUsersToday)} hôm nay`
              : stat.key === 'aiSessions'
                ? `${formatNumber(summary?.totalMatchingSessions)} Match • ${formatNumber(summary?.totalInterviewSessions)} Interview`
                : null;
          return (
            <div
              key={stat.label}
              className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white dark:bg-slate-900 p-6 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-slate-400">{stat.label}</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-slate-100">{loading ? 'Đang tải...' : value}</p>
                </div>
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${stat.bgColor}`}>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
              {trend && !loading && (
                <div className="mt-3 flex items-center gap-1 text-sm text-emerald-600 dark:text-emerald-400">
                  <TrendingUp className="h-4 w-4" />
                  <span>{trend}</span>
                </div>
              )}
              {/* Decorative gradient */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-gray-100 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">Trạng thái hỗ trợ</h2>
              <p className="text-sm text-gray-500 dark:text-slate-400">Phân bổ ticket theo trạng thái nghiệp vụ</p>
            </div>
            <Badge variant="outline" className="rounded-full bg-slate-50 dark:bg-slate-950 px-3 py-1 text-slate-700 dark:text-slate-300">
              {formatNumber(supportTotal)} tickets
            </Badge>
          </div>

          <div className="flex flex-col gap-6 md:flex-row md:items-center">
            <div
              className="mx-auto flex h-44 w-44 items-center justify-center rounded-full"
              style={{
                background: supportTicketPercentages.length
                  ? `conic-gradient(${supportTicketPercentages
                      .map((item, index) => {
                        const start = supportTicketPercentages
                          .slice(0, index)
                          .reduce((accumulator, current) => accumulator + current.value, 0);
                        const startPercent = (start / supportTotal) * 100;
                        const endPercent = ((start + item.value) / supportTotal) * 100;
                        return `${item.color} ${startPercent}% ${endPercent}%`;
                      })
                      .join(', ')})`
                  : 'conic-gradient(#e5e7eb 0% 100%)',
              }}
            >
              <div className="flex h-28 w-28 items-center justify-center rounded-full bg-white dark:bg-slate-900 shadow-inner">
                <div className="text-center">
                  <p className="text-xs uppercase tracking-wide text-gray-400">Support</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-slate-100">{formatNumber(supportTotal)}</p>
                </div>
              </div>
            </div>

            <div className="flex-1 space-y-3">
              {summary?.supportTicketsByStatus ? (
                Object.entries(summary.supportTicketsByStatus).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 dark:bg-slate-950 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{
                          backgroundColor:
                            key === 'open' ? '#ef4444' : key === 'in_progress' ? '#f59e0b' : key === 'resolved' ? '#10b981' : '#64748b',
                        }}
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-slate-300 capitalize">{key.replace('_', ' ')}</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-slate-100">{formatNumber(value)}</span>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-gray-200 dark:border-slate-800 p-6 text-center text-sm text-gray-500 dark:text-slate-400">
                  {loading ? 'Đang tải dữ liệu...' : 'Chưa có dữ liệu hỗ trợ'}
                </div>
              )}
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">Hoạt động hệ thống</h2>
            <p className="text-sm text-gray-500 dark:text-slate-400">Resume optimized và report sharing</p>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl bg-blue-50 dark:bg-blue-900/30 p-4">
              <p className="text-sm text-blue-700 dark:text-blue-400">Resume optimized</p>
              <p className="mt-1 text-3xl font-bold text-blue-900">{loading ? '...' : formatNumber(summary?.totalResumesOptimized)}</p>
            </div>
            <div className="rounded-2xl bg-violet-50 dark:bg-violet-900/30 p-4">
              <p className="text-sm text-violet-700 dark:text-violet-400">Report shares</p>
              <p className="mt-1 text-3xl font-bold text-violet-900">{loading ? '...' : formatNumber(summary?.totalReportShares)}</p>
            </div>
            <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 p-4">
              <p className="text-sm text-emerald-700 dark:text-emerald-400">Active subscriptions</p>
              <p className="mt-1 text-3xl font-bold text-emerald-900">{loading ? '...' : formatNumber(summary?.activeSubscriptions)}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* System Status Banner */}
      <div className="flex items-center gap-4 rounded-2xl border border-emerald-100 dark:border-emerald-800/50 bg-gradient-to-r from-emerald-50 to-teal-50 p-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/40">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-emerald-800 dark:text-emerald-300">Hệ thống hoạt động bình thường</p>
          <p className="text-sm text-emerald-600 dark:text-emerald-400">Tất cả dịch vụ đang online. Cập nhật lần cuối: vừa xong</p>
        </div>
        <Link
          to="/admin/health"
          className="rounded-xl bg-white dark:bg-slate-900 px-4 py-2 text-sm font-medium text-emerald-700 dark:text-emerald-400 shadow-sm transition-colors hover:bg-emerald-50 dark:bg-emerald-900/30"
        >
          Chi tiết
        </Link>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-slate-100">Truy cập nhanh</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quickLinks
            .filter((link) => {
              // Core business rule: only admin role can access billing/config links
              if (link.path === '/admin/billing' && state.user?.systemRole !== 'admin') return false;
              return true;
            })
            .map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.path}
                to={link.path}
                className="group flex items-start gap-4 rounded-2xl border border-gray-100 bg-white dark:bg-slate-900 p-5 shadow-sm transition-all duration-300 hover:border-violet-200 dark:border-violet-800 hover:shadow-md hover:-translate-y-0.5"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 transition-colors group-hover:bg-violet-100 dark:bg-violet-900/40">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-slate-100 group-hover:text-violet-700 dark:text-violet-400">{link.label}</p>
                  <p className="mt-0.5 text-sm text-gray-500 dark:text-slate-400">{link.description}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Placeholder: Recent Activity */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-slate-100">Hoạt động gần đây</h2>
        <div className="rounded-2xl border border-gray-100 bg-white dark:bg-slate-900 p-8 text-center shadow-sm">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-50 dark:bg-slate-950">
            <Clock className="h-6 w-6 text-gray-400" />
          </div>
          <p className="font-medium text-gray-600 dark:text-slate-400">Chưa có widget audit logs</p>
          <p className="mt-1 text-sm text-gray-400">
              Sẽ hiển thị các hoạt động hệ thống quan trọng như đăng nhập, thay đổi cấu hình, v.v.  Đang trong quá trình phát triển.
          </p>
          <div className="mt-4">
            <Button variant="outline" disabled>
              Xem tất cả hoạt động
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

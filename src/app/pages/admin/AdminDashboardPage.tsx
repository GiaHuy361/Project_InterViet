/**
 * Admin Dashboard Page
 *
 * Overview dashboard for administrators.
 * Shows system statistics, user counts, and quick actions.
 */

import React from 'react';
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
} from 'lucide-react';
import { Link } from 'react-router';
import { useApp } from '../../contexts/AppContext';

// Mock stats for placeholder — will be replaced with real API data
const systemStats = [
  {
    label: 'Tổng người dùng',
    value: '—',
    icon: Users,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    trend: null,
  },
  {
    label: 'Thanh toán hôm nay',
    value: '—',
    icon: CreditCard,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    trend: null,
  },
  {
    label: 'Ticket đang mở',
    value: '—',
    icon: FileText,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    trend: null,
  },
  {
    label: 'Hệ thống',
    value: 'Online',
    icon: Server,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    trend: null,
  },
];

const quickLinks = [
  { label: 'Quản lý người dùng', path: '/admin/users', icon: Users, description: 'Xem, tìm kiếm và quản lý tài khoản' },
  { label: 'Billing & Hóa đơn', path: '/admin/billing', icon: CreditCard, description: 'Quản lý thanh toán và hóa đơn' },
  { label: 'Audit Logs', path: '/admin/audit-logs', icon: Activity, description: 'Xem nhật ký hoạt động hệ thống' },
  { label: 'Health Check', path: '/admin/health', icon: Server, description: 'Kiểm tra trạng thái dịch vụ' },
  { label: 'Support Tickets', path: '/support/tickets', icon: FileText, description: 'Quản lý ticket hỗ trợ' },
];

export const AdminDashboardPage: React.FC = () => {
  const { state } = useApp();

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-purple-200">
          <Shield className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-sm text-gray-500">
            Xin chào, <span className="font-medium text-gray-700">{state.user?.name}</span> •{' '}
            <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-xs font-semibold text-violet-700">
              <Shield className="h-3 w-3" />
              {state.user?.systemRole?.toUpperCase()}
            </span>
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {systemStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${stat.bgColor}`}>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
              {stat.trend && (
                <div className="mt-3 flex items-center gap-1 text-sm text-emerald-600">
                  <TrendingUp className="h-4 w-4" />
                  <span>{stat.trend}</span>
                </div>
              )}
              {/* Decorative gradient */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-gray-100 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
          );
        })}
      </div>

      {/* System Status Banner */}
      <div className="flex items-center gap-4 rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50 p-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-emerald-800">Hệ thống hoạt động bình thường</p>
          <p className="text-sm text-emerald-600">Tất cả dịch vụ đang online. Cập nhật lần cuối: vừa xong</p>
        </div>
        <Link
          to="/admin/health"
          className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-emerald-700 shadow-sm transition-colors hover:bg-emerald-50"
        >
          Chi tiết
        </Link>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Truy cập nhanh</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.path}
                to={link.path}
                className="group flex items-start gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all duration-300 hover:border-violet-200 hover:shadow-md hover:-translate-y-0.5"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600 transition-colors group-hover:bg-violet-100">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 group-hover:text-violet-700">{link.label}</p>
                  <p className="mt-0.5 text-sm text-gray-500">{link.description}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Placeholder: Recent Activity */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Hoạt động gần đây</h2>
        <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-50">
            <Clock className="h-6 w-6 text-gray-400" />
          </div>
          <p className="font-medium text-gray-600">Chưa có dữ liệu</p>
          <p className="mt-1 text-sm text-gray-400">
            Hoạt động hệ thống sẽ hiển thị ở đây khi kết nối API audit logs.
          </p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="flex items-start gap-3 rounded-2xl border border-amber-100 bg-amber-50 p-5">
        <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500 mt-0.5" />
        <div>
          <p className="font-medium text-amber-800">Trang quản trị đang trong quá trình phát triển</p>
          <p className="mt-1 text-sm text-amber-600">
            Các tính năng như quản lý người dùng, billing logs, audit logs sẽ được kết nối API trong các phase tiếp theo.
          </p>
        </div>
      </div>
    </div>
  );
};

/**
 * Admin Users Page
 *
 * User management for administrators.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Users,
  Search,
  Filter,
  Mail,
  Shield,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  ChevronRight,
  Loader2,
  FileText,
  CreditCard,
  GraduationCap,
  Wallet,
} from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import adminService, { AdminUserDetailResponse, AdminUserSummary } from '../../../services/adminManagementService';

type UserStatus = 'active' | 'suspended' | 'disabled';
type EmailVerifiedFilter = 'all' | 'true' | 'false';

const roleOptions = ['admin', 'support', 'mentor', 'candidate'] as const;
const statusOptions: UserStatus[] = ['active', 'suspended', 'disabled'];

const roleBadgeClass: Record<string, string> = {
  admin: 'bg-violet-100 text-violet-700 border-violet-200',
  support: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  mentor: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  candidate: 'bg-blue-100 text-blue-700 border-blue-200',
};

const statusBadgeClass: Record<UserStatus, string> = {
  active: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  suspended: 'bg-amber-100 text-amber-700 border-amber-200',
  disabled: 'bg-red-100 text-red-700 border-red-200',
};

const statusToneClass: Record<UserStatus, string> = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  suspended: 'bg-amber-50 text-amber-700 border-amber-100',
  disabled: 'bg-red-50 text-red-700 border-red-100',
};

const statusLabel: Record<UserStatus, string> = {
  active: 'Active',
  suspended: 'Suspended',
  disabled: 'Disabled',
};

const formatCurrency = (value?: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value || 0);

const formatDateTime = (value?: string | null) => (value ? new Date(value).toLocaleString('vi-VN') : '—');

const formatYearsOfExperience = (value?: string | number | null) => {
  if (value == null || value === '') return '—';
  return `${value} năm`;
};

export const AdminUsersPage: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | (typeof roleOptions)[number]>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | UserStatus>('all');
  const [emailVerifiedFilter, setEmailVerifiedFilter] = useState<EmailVerifiedFilter>('all');
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailUser, setDetailUser] = useState<AdminUserDetailResponse | null>(null);
  const [statusUpdating, setStatusUpdating] = useState<UserStatus | null>(null);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await adminService.listAdminUsers({
        search: searchQuery || undefined,
        role: roleFilter === 'all' ? undefined : roleFilter,
        status: statusFilter === 'all' ? undefined : statusFilter,
        emailVerified:
          emailVerifiedFilter === 'all' ? undefined : emailVerifiedFilter === 'true',
        page,
        pageSize,
      });
      setUsers(response.items || []);
      setTotal(response.total || 0);
    } catch (error) {
      console.error('Failed to load admin users', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, roleFilter, statusFilter, emailVerifiedFilter]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (page !== 1) {
        setPage(1);
        return;
      }
      void loadUsers();
    }, 300);

    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const openDetail = async (userId: string) => {
    setDetailOpen(true);
    setDetailLoading(true);
    setDetailUser(null);

    try {
      const response = await adminService.getAdminUserDetail(userId);
      setDetailUser(response);
    } catch (error) {
      console.error('Failed to load user detail', error);
      setDetailUser(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setDetailOpen(false);
    setDetailUser(null);
    setStatusUpdating(null);
  };

  const refreshCurrentUserDetail = async () => {
    if (!detailUser?.userSummary.id) return;
    const response = await adminService.getAdminUserDetail(detailUser.userSummary.id);
    setDetailUser(response);
  };

  const updateStatus = async (status: UserStatus) => {
    if (!detailUser?.userSummary.id) return;
    setStatusUpdating(status);
    try {
      await adminService.updateAdminUserStatus(detailUser.userSummary.id, status);
      await refreshCurrentUserDetail();
      await loadUsers();
    } catch (error) {
      console.error('Failed to update user status', error);
      alert('Không thể cập nhật trạng thái người dùng');
    } finally {
      setStatusUpdating(null);
    }
  };

  const totals = useMemo(() => {
    const active = users.filter((user) => user.status === 'active').length;
    const suspended = users.filter((user) => user.status === 'suspended').length;
    const disabled = users.filter((user) => user.status === 'disabled').length;
    const verified = users.filter((user) => user.emailVerified).length;
    return { active, suspended, disabled, verified };
  }, [users]);

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 shadow-lg shadow-blue-200">
            <Users className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin User Management</h1>
            <p className="text-sm text-gray-500">Tìm kiếm, lọc và quản lý trạng thái tài khoản hệ thống</p>
          </div>
        </div>

        <Button variant="outline" onClick={() => void navigate('/admin/dashboard')}>
          Quay lại dashboard
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: 'Tổng', value: total, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Active', value: totals.active, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Suspended', value: totals.suspended, icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Verified', value: totals.verified, icon: Shield, color: 'text-violet-600', bg: 'bg-violet-50' },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">{loading ? '...' : stat.value}</p>
                </div>
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${stat.bg}`}>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Bộ lọc người dùng</h2>
            <p className="text-sm text-gray-500">Tìm kiếm người dùng theo tên, email hoặc các tiêu chí khác</p>
          </div>
          <Button variant="outline" onClick={() => void loadUsers()} disabled={loading}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Làm mới
          </Button>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-4">
          <div className="relative lg:col-span-2">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Tìm theo tên hoặc email"
              className="pl-11"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value as typeof roleFilter)}
            className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <option value="all">Tất cả vai trò</option>
            {roleOptions.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
            className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <option value="all">Tất cả trạng thái</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>

          <select
            value={emailVerifiedFilter}
            onChange={(event) => setEmailVerifiedFilter(event.target.value as EmailVerifiedFilter)}
            className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 lg:col-span-2"
          >
            <option value="all">Tất cả trạng thái xác minh</option>
            <option value="true">Đã xác minh</option>
            <option value="false">Chưa xác minh</option>
          </select>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="border-b border-gray-100 px-6 py-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Danh sách người dùng</h2>
              <p className="text-sm text-gray-500">{loading ? 'Đang tải...' : `${total} kết quả`}</p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50/70">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Người dùng</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Vai trò</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Trạng thái</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Xác minh</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Đăng nhập lần cuối</th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-500">
                    Đang tải danh sách người dùng...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-500">
                    Không tìm thấy người dùng phù hợp.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-gray-900">{user.fullName}</p>
                        <p className="mt-1 text-sm text-gray-500">{user.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className={`${roleBadgeClass[user.role] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                        {user.role}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className={`${statusBadgeClass[user.status as UserStatus] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                        {user.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{user.emailVerified ? 'Đã xác minh' : 'Chưa xác minh'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{formatDateTime(user.lastLoginAt)}</td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="outline" size="sm" onClick={() => void openDetail(user.id)}>
                        Chi tiết
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-gray-100 px-6 py-4">
          <Button variant="outline" size="sm" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page <= 1 || loading}>
            Trước
          </Button>
          <div className="text-sm text-gray-600">
            {page} / {Math.max(1, Math.ceil(total / pageSize))}
          </div>
          <Button variant="outline" size="sm" onClick={() => setPage((current) => Math.min(Math.ceil(total / pageSize), current + 1))} disabled={page >= Math.ceil(total / pageSize) || loading}>
            Sau
          </Button>
        </div>
      </Card>

      <Dialog open={detailOpen} onOpenChange={(open) => (open ? setDetailOpen(true) : closeDetail())}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Chi tiết người dùng</DialogTitle>
            <DialogDescription>
              {detailUser ? detailUser.userSummary.email : 'Đang tải hồ sơ người dùng...'}
            </DialogDescription>
          </DialogHeader>

          {detailLoading ? (
            <div className="flex items-center justify-center rounded-2xl border border-gray-100 bg-white p-10 text-sm text-gray-500">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Đang tải chi tiết...
            </div>
          ) : detailUser?.userSummary ? (
            <div className="space-y-6">
              {detailUser.userSummary.status !== 'active' && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                    <div>
                      <p className="font-semibold">Tài khoản đang bị hạn chế</p>
                      <p className="text-sm text-red-700">
                        Trạng thái hiện tại là {detailUser.userSummary.status}. Các form thao tác quan trọng nên được chặn cho đến khi tài khoản trở về active.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Card className={`p-4 ${statusToneClass[detailUser.userSummary.status as UserStatus] || 'bg-white'}`}>
                  <p className="text-xs uppercase tracking-wide opacity-70">Tài khoản</p>
                  <p className="mt-1 text-lg font-semibold">{detailUser.userSummary.fullName}</p>
                  <p className="text-sm opacity-80">{detailUser.userSummary.email}</p>
                </Card>
                <Card className="p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Role / Status</p>
                  <p className="mt-1 text-lg font-semibold text-gray-900">{detailUser.userSummary.role}</p>
                  <p className="text-sm text-gray-600">{detailUser.userSummary.status}</p>
                </Card>
                <Card className="p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Xác minh email</p>
                  <p className="mt-1 text-lg font-semibold text-gray-900">{detailUser.userSummary.emailVerified ? 'Verified' : 'Unverified'}</p>
                  <p className="text-sm text-gray-600">Last login: {formatDateTime(detailUser.userSummary.lastLoginAt)}</p>
                </Card>
                <Card className="p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Support tickets</p>
                  <p className="mt-1 text-lg font-semibold text-gray-900">{detailUser.supportTicketCount ?? 0}</p>
                  <p className="text-sm text-gray-600">Created: {formatDateTime(detailUser.userSummary.createdAt)}</p>
                </Card>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <Card className="p-5">
                  <div className="mb-4 flex items-center gap-2">
                    <Shield className="h-4 w-4 text-violet-600" />
                    <h3 className="font-semibold text-gray-900">Profile summary</h3>
                  </div>
                  {detailUser.profileSummary ? (
                    <div className="space-y-3 text-sm text-gray-600">
                      <p><span className="font-medium text-gray-700">Headline:</span> {detailUser.profileSummary.headline || '—'}</p>
                      <p><span className="font-medium text-gray-700">Bio:</span> {detailUser.profileSummary.bio || '—'}</p>
                      <p><span className="font-medium text-gray-700">Years of experience:</span> {formatYearsOfExperience(detailUser.profileSummary.yearsOfExperience)}</p>
                      <p><span className="font-medium text-gray-700">Skills:</span> {detailUser.profileSummary.skills?.length ? detailUser.profileSummary.skills.join(', ') : '—'}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Chưa có profile summary.</p>
                  )}
                </Card>

                <Card className="p-5">
                  <div className="mb-4 flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-emerald-600" />
                    <h3 className="font-semibold text-gray-900">Subscription & quota</h3>
                  </div>
                  <div className="space-y-3 text-sm text-gray-600">
                    <p>
                      <span className="font-medium text-gray-700">Subscription:</span>{' '}
                      {detailUser.currentSubscription ? `${detailUser.currentSubscription.planKey} (${detailUser.currentSubscription.status})` : '—'}
                    </p>
                    <p>
                      <span className="font-medium text-gray-700">Valid:</span>{' '}
                      {detailUser.currentSubscription
                        ? `${formatDateTime(detailUser.currentSubscription.startsAt)} → ${formatDateTime(detailUser.currentSubscription.endsAt)}`
                        : '—'}
                    </p>
                    <p>
                      <span className="font-medium text-gray-700">Quota:</span>{' '}
                      M {detailUser.quotaSummary?.dailyMatchUsed ?? 0}/{detailUser.quotaSummary?.dailyMatchLimit ?? 0},
                      I {detailUser.quotaSummary?.dailyInterviewUsed ?? 0}/{detailUser.quotaSummary?.dailyInterviewLimit ?? 0},
                      O {detailUser.quotaSummary?.dailyOptimizeUsed ?? 0}/{detailUser.quotaSummary?.dailyOptimizeLimit ?? 0}
                    </p>
                  </div>
                </Card>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <Card className="p-5">
                  <div className="mb-4 flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-blue-600" />
                    <h3 className="font-semibold text-gray-900">Recent payments</h3>
                  </div>
                  <div className="space-y-3">
                    {detailUser.recentPayments?.length ? detailUser.recentPayments.map((payment) => (
                      <div key={payment.paymentId} className="rounded-xl border border-gray-100 bg-gray-50 p-3 text-sm">
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-medium text-gray-900">{formatCurrency(payment.amount)}</p>
                          <Badge variant="outline" className="bg-white">{payment.status}</Badge>
                        </div>
                        <p className="mt-1 text-gray-600">{payment.purpose || 'payment'}</p>
                        <p className="text-xs text-gray-500">{formatDateTime(payment.createdAt)}</p>
                      </div>
                    )) : <p className="text-sm text-gray-500">Không có giao dịch gần đây.</p>}
                  </div>
                </Card>

                <Card className="p-5">
                  <div className="mb-4 flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-violet-600" />
                    <h3 className="font-semibold text-gray-900">Recent bookings</h3>
                  </div>
                  <div className="space-y-3">
                    {detailUser.recentBookings?.length ? detailUser.recentBookings.map((booking) => (
                      <div key={booking.bookingId} className="rounded-xl border border-gray-100 bg-gray-50 p-3 text-sm">
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-medium text-gray-900">{booking.mentorName}</p>
                          <Badge variant="outline" className="bg-white">{booking.status}</Badge>
                        </div>
                        <p className="mt-1 text-gray-600">{booking.serviceType}</p>
                        <p className="text-xs text-gray-500">{formatCurrency(booking.amount)} • {formatDateTime(booking.startsAt)}</p>
                      </div>
                    )) : <p className="text-sm text-gray-500">Không có booking gần đây.</p>}
                  </div>
                </Card>
              </div>

              <Card className="p-5">
                <div className="mb-4 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gray-600" />
                  <h3 className="font-semibold text-gray-900">Cập nhật trạng thái</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {statusOptions.map((status) => (
                    <Button
                      key={status}
                      type="button"
                      variant={detailUser.userSummary.status === status ? 'default' : 'outline'}
                      onClick={() => void updateStatus(status)}
                      disabled={statusUpdating !== null}
                    >
                      {statusUpdating === status ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      {statusLabel[status]}
                    </Button>
                  ))}
                </div>
              </Card>
            </div>
          ) : (
            <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center text-sm text-gray-500">
              Không có dữ liệu chi tiết cho người dùng này.
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeDetail}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsersPage;
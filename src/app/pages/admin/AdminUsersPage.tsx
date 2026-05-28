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
import mentorSpecialtyService, { MentorSpecialtyDto } from '../../../services/mentorSpecialtyService';
import { toast } from 'sonner';

type UserStatus = 'active' | 'suspended' | 'disabled';
type EmailVerifiedFilter = 'all' | 'true' | 'false';

const roleOptions = ['admin', 'support', 'mentor', 'candidate'] as const;
const statusOptions: UserStatus[] = ['active', 'suspended', 'disabled'];

const roleBadgeClass: Record<string, string> = {
  admin: 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-400 border-violet-200 dark:border-violet-800',
  support: 'bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800',
  mentor: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
  candidate: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800',
};

const statusBadgeClass: Record<UserStatus, string> = {
  active: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
  suspended: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800',
  disabled: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800',
};

const statusToneClass: Record<UserStatus, string> = {
  active: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800/50',
  suspended: 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-800/50',
  disabled: 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-100 dark:border-red-800/50',
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
  const [roleUpdating, setRoleUpdating] = useState<string | null>(null);

  // Specialties assign states
  const [specialtiesAssignOpen, setSpecialtiesAssignOpen] = useState(false);
  const [availableSpecialties, setAvailableSpecialties] = useState<MentorSpecialtyDto[]>([]);
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [specialtiesSaving, setSpecialtiesSaving] = useState(false);

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
      toast.error('Không thể cập nhật trạng thái người dùng');
    } finally {
      setStatusUpdating(null);
    }
  };

  const updateRole = async (role: string) => {
    if (!detailUser?.userSummary.id) return;
    setRoleUpdating(role);
    try {
      await adminService.updateAdminUserRoles(detailUser.userSummary.id, [role]);
      await refreshCurrentUserDetail();
      await loadUsers();
      toast.success(`Đã cập nhật vai trò thành ${role}`);
    } catch (error) {
      console.error('Failed to update user role', error);
      toast.error('Không thể cập nhật vai trò người dùng');
    } finally {
      setRoleUpdating(null);
    }
  };

  const openSpecialtiesModal = async () => {
    if (!detailUser?.userSummary.id) return;
    setSpecialtiesAssignOpen(true);
    try {
      const { data } = await mentorSpecialtyService.getAdminSpecialties();
      setAvailableSpecialties(data || []);
      const existingIds = detailUser.profileSummary?.specialties?.map((s: any) => s.id) || [];
      setSelectedSpecialties(existingIds);
    } catch (error) {
      console.error('Failed to load specialties', error);
      toast.error('Không thể tải danh sách chuyên môn');
    }
  };

  const handleAssignSpecialties = async () => {
    if (!detailUser?.userSummary.id) return;
    setSpecialtiesSaving(true);
    try {
      await mentorSpecialtyService.adminAssignSpecialties(detailUser.userSummary.id, selectedSpecialties);
      toast.success('Đã cập nhật chuyên môn cho Mentor');
      setSpecialtiesAssignOpen(false);
      await refreshCurrentUserDetail();
    } catch (error) {
      console.error('Failed to assign specialties', error);
      toast.error('Có lỗi xảy ra khi gán chuyên môn');
    } finally {
      setSpecialtiesSaving(false);
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Admin User Management</h1>
            <p className="text-sm text-gray-500 dark:text-slate-400">Tìm kiếm, lọc và quản lý trạng thái tài khoản hệ thống</p>
          </div>
        </div>

        <Button variant="outline" onClick={() => void navigate('/admin/dashboard')}>
          Quay lại dashboard
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: 'Tổng', value: total, icon: Users, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/30' },
          { label: 'Active', value: totals.active, icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/30' },
          { label: 'Suspended', value: totals.suspended, icon: AlertTriangle, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/30' },
          { label: 'Verified', value: totals.verified, icon: Shield, color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-900/30' },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-slate-400">{stat.label}</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-slate-100">{loading ? '...' : stat.value}</p>
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
            <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">Bộ lọc người dùng</h2>
            <p className="text-sm text-gray-500 dark:text-slate-400">Tìm kiếm người dùng theo tên, email hoặc các tiêu chí khác</p>
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
            className="flex h-10 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 shadow-sm outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
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
            className="flex h-10 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 shadow-sm outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
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
            className="flex h-10 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 shadow-sm outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 lg:col-span-2"
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
              <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">Danh sách người dùng</h2>
              <p className="text-sm text-gray-500 dark:text-slate-400">{loading ? 'Đang tải...' : `${total} kết quả`}</p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50 dark:bg-slate-950/70">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">Người dùng</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">Vai trò</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">Trạng thái</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">Xác minh</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">Đăng nhập lần cuối</th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white dark:bg-slate-900">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-500 dark:text-slate-400">
                    Đang tải danh sách người dùng...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-500 dark:text-slate-400">
                    Không tìm thấy người dùng phù hợp.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-slate-800 dark:bg-slate-950">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-slate-100">{user.fullName}</p>
                        <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">{user.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className={`${roleBadgeClass[user.role] || 'bg-gray-100 text-gray-700 dark:text-slate-300 border-gray-200 dark:border-slate-800'}`}>
                        {user.role}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className={`${statusBadgeClass[user.status as UserStatus] || 'bg-gray-100 text-gray-700 dark:text-slate-300 border-gray-200 dark:border-slate-800'}`}>
                        {user.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-slate-400">{user.emailVerified ? 'Đã xác minh' : 'Chưa xác minh'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-slate-400">{formatDateTime(user.lastLoginAt)}</td>
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
          <div className="text-sm text-gray-600 dark:text-slate-400">
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
            <div className="flex items-center justify-center rounded-2xl border border-gray-100 bg-white dark:bg-slate-900 p-10 text-sm text-gray-500 dark:text-slate-400">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Đang tải chi tiết...
            </div>
          ) : detailUser?.userSummary ? (
            <div className="space-y-6">
              {detailUser.userSummary.status !== 'active' && (
                <div className="rounded-2xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30 p-4 text-red-800 dark:text-red-300">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                    <div>
                      <p className="font-semibold">Tài khoản đang bị hạn chế</p>
                      <p className="text-sm text-red-700 dark:text-red-400">
                        Trạng thái hiện tại là {detailUser.userSummary.status}. Các form thao tác quan trọng nên được chặn cho đến khi tài khoản trở về active.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Card className={`p-4 ${statusToneClass[detailUser.userSummary.status as UserStatus] || 'bg-white dark:bg-slate-900'}`}>
                  <p className="text-xs uppercase tracking-wide opacity-70">Tài khoản</p>
                  <p className="mt-1 text-lg font-semibold">{detailUser.userSummary.fullName}</p>
                  <p className="text-sm opacity-80">{detailUser.userSummary.email}</p>
                </Card>
                <Card className="p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-slate-400">Role / Status</p>
                  <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-slate-100">{detailUser.userSummary.role}</p>
                  <p className="text-sm text-gray-600 dark:text-slate-400">{detailUser.userSummary.status}</p>
                </Card>
                <Card className="p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-slate-400">Xác minh email</p>
                  <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-slate-100">{detailUser.userSummary.emailVerified ? 'Verified' : 'Unverified'}</p>
                  <p className="text-sm text-gray-600 dark:text-slate-400">Last login: {formatDateTime(detailUser.userSummary.lastLoginAt)}</p>
                </Card>
                <Card className="p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-slate-400">Support tickets</p>
                  <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-slate-100">{detailUser.supportTicketCount ?? 0}</p>
                  <p className="text-sm text-gray-600 dark:text-slate-400">Created: {formatDateTime(detailUser.userSummary.createdAt)}</p>
                </Card>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <Card className="p-5">
                  <div className="mb-4 flex items-center gap-2">
                    <Shield className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                    <h3 className="font-semibold text-gray-900 dark:text-slate-100">Profile summary</h3>
                  </div>
                  {detailUser.profileSummary ? (
                    <div className="space-y-3 text-sm text-gray-600 dark:text-slate-400">
                      <p><span className="font-medium text-gray-700 dark:text-slate-300">Headline:</span> {detailUser.profileSummary.headline || '—'}</p>
                      <p><span className="font-medium text-gray-700 dark:text-slate-300">Bio:</span> {detailUser.profileSummary.bio || '—'}</p>
                      <p><span className="font-medium text-gray-700 dark:text-slate-300">Years of experience:</span> {formatYearsOfExperience(detailUser.profileSummary.yearsOfExperience)}</p>
                      <p><span className="font-medium text-gray-700 dark:text-slate-300">Skills:</span> {detailUser.profileSummary.skills?.length ? detailUser.profileSummary.skills.join(', ') : '—'}</p>
                      {detailUser.userSummary.role === 'mentor' && (
                        <div className="pt-2 border-t border-gray-100 dark:border-slate-800">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-gray-700 dark:text-slate-300">Chuyên môn:</span>
                            <Button variant="outline" size="sm" onClick={openSpecialtiesModal} className="h-7 text-xs">Sửa</Button>
                          </div>
                          {detailUser.profileSummary.specialties?.length ? (
                            <div className="flex flex-wrap gap-1">
                              {detailUser.profileSummary.specialties.map((spec: any) => (
                                <Badge key={spec.id} variant="secondary" className="bg-cyan-50 text-cyan-700 hover:bg-cyan-100 dark:bg-cyan-900/30 dark:text-cyan-300">
                                  {spec.name}
                                </Badge>
                              ))}
                            </div>
                          ) : <span className="text-gray-500">Chưa gán chuyên môn</span>}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-slate-400">Chưa có profile summary.</p>
                  )}
                </Card>

                <Card className="p-5">
                  <div className="mb-4 flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <h3 className="font-semibold text-gray-900 dark:text-slate-100">Subscription & quota</h3>
                  </div>
                  <div className="space-y-3 text-sm text-gray-600 dark:text-slate-400">
                    <p>
                      <span className="font-medium text-gray-700 dark:text-slate-300">Subscription:</span>{' '}
                      {detailUser.currentSubscription ? `${detailUser.currentSubscription.planKey} (${detailUser.currentSubscription.status})` : '—'}
                    </p>
                    <p>
                      <span className="font-medium text-gray-700 dark:text-slate-300">Valid:</span>{' '}
                      {detailUser.currentSubscription
                        ? `${formatDateTime(detailUser.currentSubscription.startsAt)} → ${formatDateTime(detailUser.currentSubscription.endsAt)}`
                        : '—'}
                    </p>
                    <p>
                      <span className="font-medium text-gray-700 dark:text-slate-300">Quota:</span>{' '}
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
                    <CreditCard className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <h3 className="font-semibold text-gray-900 dark:text-slate-100">Recent payments</h3>
                  </div>
                  <div className="space-y-3">
                    {detailUser.recentPayments?.length ? detailUser.recentPayments.map((payment) => (
                      <div key={payment.paymentId} className="rounded-xl border border-gray-100 bg-gray-50 dark:bg-slate-950 p-3 text-sm">
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-medium text-gray-900 dark:text-slate-100">{formatCurrency(payment.amount)}</p>
                          <Badge variant="outline" className="bg-white dark:bg-slate-900">{payment.status}</Badge>
                        </div>
                        <p className="mt-1 text-gray-600 dark:text-slate-400">{payment.purpose || 'payment'}</p>
                        <p className="text-xs text-gray-500 dark:text-slate-400">{formatDateTime(payment.createdAt)}</p>
                      </div>
                    )) : <p className="text-sm text-gray-500 dark:text-slate-400">Không có giao dịch gần đây.</p>}
                  </div>
                </Card>

                <Card className="p-5">
                  <div className="mb-4 flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                    <h3 className="font-semibold text-gray-900 dark:text-slate-100">Recent bookings</h3>
                  </div>
                  <div className="space-y-3">
                    {detailUser.recentBookings?.length ? detailUser.recentBookings.map((booking) => (
                      <div key={booking.bookingId} className="rounded-xl border border-gray-100 bg-gray-50 dark:bg-slate-950 p-3 text-sm">
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-medium text-gray-900 dark:text-slate-100">{booking.mentorName}</p>
                          <Badge variant="outline" className="bg-white dark:bg-slate-900">{booking.status}</Badge>
                        </div>
                        <p className="mt-1 text-gray-600 dark:text-slate-400">{booking.serviceType}</p>
                        <p className="text-xs text-gray-500 dark:text-slate-400">{formatCurrency(booking.amount)} • {formatDateTime(booking.startsAt)}</p>
                      </div>
                    )) : <p className="text-sm text-gray-500 dark:text-slate-400">Không có booking gần đây.</p>}
                  </div>
                </Card>
              </div>

              <Card className="p-5">
                <div className="mb-4 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gray-600 dark:text-slate-400" />
                  <h3 className="font-semibold text-gray-900 dark:text-slate-100">Cập nhật trạng thái</h3>
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

              <Card className="p-5 mt-4 border-t border-gray-100">
                <div className="mb-4 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-gray-600 dark:text-slate-400" />
                  <h3 className="font-semibold text-gray-900 dark:text-slate-100">Cập nhật vai trò (Role)</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {roleOptions.map((role) => (
                    <Button
                      key={role}
                      type="button"
                      variant={detailUser.userSummary.role?.toLowerCase() === role ? 'default' : 'outline'}
                      onClick={() => void updateRole(role)}
                      disabled={roleUpdating !== null}
                    >
                      {roleUpdating === role ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      <span className="capitalize">{role}</span>
                    </Button>
                  ))}
                </div>
              </Card>
            </div>
          ) : (
            <div className="rounded-2xl border border-gray-100 bg-white dark:bg-slate-900 p-8 text-center text-sm text-gray-500 dark:text-slate-400">
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

      {/* Specialties Assignment Modal */}
      <Dialog open={specialtiesAssignOpen} onOpenChange={setSpecialtiesAssignOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Gán chuyên môn cho Mentor</DialogTitle>
            <DialogDescription>
              Chọn các danh mục chuyên môn phù hợp cho {detailUser?.userSummary.fullName}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto space-y-2 py-4">
            {availableSpecialties.length === 0 ? (
              <div className="text-center text-sm text-gray-500 py-4">Chưa có danh mục chuyên môn nào trong hệ thống.</div>
            ) : (
              availableSpecialties.map(spec => {
                const isSelected = selectedSpecialties.includes(spec.id);
                return (
                  <label key={spec.id} className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${isSelected ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20' : 'border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800'}`}>
                    <div className="flex h-5 items-center mt-0.5">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 text-cyan-600 rounded border-gray-300"
                        checked={isSelected}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedSpecialties(prev => [...prev, spec.id]);
                          else setSelectedSpecialties(prev => prev.filter(id => id !== spec.id));
                        }}
                      />
                    </div>
                    <div>
                      <div className={`text-sm font-medium ${isSelected ? 'text-cyan-700 dark:text-cyan-400' : 'text-gray-900 dark:text-slate-100'}`}>{spec.name}</div>
                      {spec.description && <div className="text-xs text-gray-500">{spec.description}</div>}
                    </div>
                  </label>
                );
              })
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSpecialtiesAssignOpen(false)}>Hủy</Button>
            <Button onClick={handleAssignSpecialties} disabled={specialtiesSaving} className="bg-cyan-600 hover:bg-cyan-700 text-white">
              {specialtiesSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Lưu thay đổi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsersPage;
import React, { useEffect, useState, useMemo } from 'react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import {
  Users,
  Search,
  RefreshCw,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  UserCheck,
  Eye,
  Star,
  Shield,
  FileText
} from 'lucide-react';
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from '../../components/ui/tooltip';
import adminMentorService, { AdminMentorSummary } from '../../../services/adminMentorService';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import adminManagementService, { AdminUserDetailResponse } from '@/services/adminManagementService';

type MentorStatusFilter = 'all' | 'active' | 'inactive';
type VerifyFilter = 'all' | 'true' | 'false';

export const AdminMentorsPage: React.FC = () => {
  const [mentors, setMentors] = useState<AdminMentorSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  const [statusFilter, setStatusFilter] = useState<MentorStatusFilter>('all');
  const [verifyFilter, setVerifyFilter] = useState<VerifyFilter>('all');

  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const [detailLoading, setDetailLoading] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState<AdminMentorSummary | null>(null);

  const [mentorDetail, setMentorDetail] = useState<AdminUserDetailResponse | null>(null);

  const openDetail = async (mentor: AdminMentorSummary) => {
    setSelectedMentor(mentor);
    setDetailOpen(true);
    setMentorDetail(await loadMentorDetail(mentor.userId));
  };

  const loadMentorDetail = async (userId: string) => {
    setDetailLoading(true);
    try {
      const response = await adminManagementService.getAdminUserDetail(userId);
      return response;
    } catch (error) {
      console.error('Failed to load mentor detail', error);
      toast.error('Không thể tải chi tiết hồ sơ Mentor');
      return null;
    } finally {
      setDetailLoading(false);
    }
  };

  const loadMentors = async () => {
    setLoading(true);
    try {
      const isVerified = verifyFilter === 'all' ? undefined : verifyFilter === 'true';
      const response = await adminMentorService.listAdminMentors({
        search: searchQuery || undefined,
        isVerified,
        page,
        pageSize,
      });
      // Lọc thêm trên frontend nếu backend chưa hỗ trợ status, do backend API 22 không có status param
      let filteredItems = response.items || [];
      if (statusFilter !== 'all') {
        filteredItems = filteredItems.filter(m => m.status === statusFilter);
      }
      setMentors(filteredItems);
      setTotal(response.total || 0); // Có thể không chính xác nếu lọc client, nhưng tạm chấp nhận
    } catch (error) {
      console.error('Failed to load mentors', error);
      toast.error('Không thể tải danh sách Mentor');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadMentors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, verifyFilter, statusFilter]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (page !== 1) {
        setPage(1);
        return;
      }
      void loadMentors();
    }, 300);

    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const handleVerify = async (id: string, verify: boolean) => {
    setActionLoadingId(id + '_verify');
    try {
      await adminMentorService.verifyMentor(id, verify);
      toast.success(verify ? 'Đã phê duyệt Mentor' : 'Đã hủy phê duyệt Mentor');
      await loadMentors();
      setSelectedMentor((prev) => prev && prev.id === id ? { ...prev, isVerified: verify } : prev);
    } catch (error) {
      console.error('Verify error', error);
      toast.error('Có lỗi xảy ra khi cập nhật phê duyệt');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleStatusChange = async (id: string, newStatus: 'active' | 'inactive') => {
    setActionLoadingId(id + '_status');
    try {
      await adminMentorService.updateMentorStatus(id, newStatus);
      toast.success(`Đã chuyển trạng thái thành ${newStatus === 'active' ? 'Hoạt động' : 'Tạm khóa'}`);
      await loadMentors();
      setSelectedMentor((prev) => prev && prev.id === id ? { ...prev, status: newStatus } : prev);
    } catch (error) {
      console.error('Status error', error);
      toast.error('Có lỗi xảy ra khi cập nhật trạng thái');
    } finally {
      setActionLoadingId(null);
    }
  };

  const totals = useMemo(() => {
    const verified = mentors.filter(m => m.isVerified).length;
    const unverified = mentors.filter(m => !m.isVerified).length;
    return { verified, unverified };
  }, [mentors]);

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 shadow-lg shadow-violet-200">
            <UserCheck className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Kiểm duyệt Mentor</h1>
            <p className="text-sm text-gray-500 dark:text-slate-400">Quản lý hồ sơ, phê duyệt và trạng thái hoạt động của chuyên gia</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-slate-400">Tổng số hồ sơ đang hiển thị</p>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-slate-100">{mentors.length}</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/30">
              <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-slate-400">Đã phê duyệt (Verified)</p>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-slate-100">{totals.verified}</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-900/30">
              <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-slate-400">Chờ phê duyệt</p>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-slate-100">{totals.unverified}</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-900/30">
              <RefreshCw className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">Bộ lọc hồ sơ</h2>
            <p className="text-sm text-gray-500 dark:text-slate-400">Tìm kiếm theo tên và lọc theo trạng thái</p>
          </div>
          <Button variant="outline" onClick={() => void loadMentors()} disabled={loading}>
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
              placeholder="Tìm theo tên Mentor..."
              className="pl-11"
            />
          </div>

          <select
            value={verifyFilter}
            onChange={(event) => setVerifyFilter(event.target.value as VerifyFilter)}
            className="flex h-10 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 shadow-sm outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <option value="all">Tất cả tình trạng duyệt</option>
            <option value="true">Đã phê duyệt (Verified)</option>
            <option value="false">Chưa duyệt (Unverified)</option>
          </select>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as MentorStatusFilter)}
            className="flex h-10 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 shadow-sm outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <option value="all">Tất cả trạng thái hoạt động</option>
            <option value="active">Đang hoạt động (Active)</option>
            <option value="inactive">Tạm khóa (Inactive)</option>
          </select>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100 dark:divide-slate-800">
            <thead className="bg-gray-50 dark:bg-slate-950/70">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Mentor</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Kinh nghiệm</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Phê duyệt</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Trạng thái</th>
                <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-500">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-violet-500 mb-2" />
                    Đang tải danh sách...
                  </td>
                </tr>
              ) : mentors.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-500">
                    Không tìm thấy Mentor nào phù hợp.
                  </td>
                </tr>
              ) : (
                mentors.map((mentor) => (
                  <tr key={mentor.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {mentor.avatarUrl ? (
                          <img src={mentor.avatarUrl} alt="" className="h-10 w-10 rounded-full object-cover" />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 text-violet-600 font-bold dark:bg-violet-900/50 dark:text-violet-400">
                            {mentor.fullName.charAt(0)}
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-slate-100">{mentor.fullName}</p>
                          <p className="text-xs text-gray-500 dark:text-slate-400 max-w-[200px] truncate">{mentor.headline || 'Chưa cập nhật Headline'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-slate-300">
                      {mentor.yearsOfExperience != null ? `${mentor.yearsOfExperience} năm` : '—'}
                    </td>
                    <td className="px-6 py-4">
                      {mentor.isVerified ? (
                        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Đã duyệt
                        </Badge>
                      ) : (
                        <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200">
                          <RefreshCw className="w-3 h-3 mr-1" /> Chờ duyệt
                        </Badge>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className={mentor.status === 'active' ? 'text-blue-600 border-blue-200 bg-blue-50 dark:bg-blue-900/20' : 'text-gray-500'}>
                        {mentor.status === 'active' ? 'Hoạt động' : mentor.status === 'inactive' ? 'Tạm khóa' : mentor.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDetail(mentor)}
                          className="text-gray-600 hover:text-blue-600 hover:bg-blue-50 dark:text-gray-400 dark:hover:bg-blue-900/30"
                        >
                          <Eye className="h-4 w-4 mr-1" /> Chi tiết
                        </Button>
                        {/* Verify Toggle Button */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleVerify(mentor.id, !mentor.isVerified)}
                          disabled={actionLoadingId === mentor.id + '_verify'}
                          className={mentor.isVerified ? 'text-amber-600 hover:text-amber-700 hover:bg-amber-50' : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50'}
                        >
                          {actionLoadingId === mentor.id + '_verify' ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : mentor.isVerified ? (
                            'Hủy duyệt'
                          ) : (
                            'Phê duyệt'
                          )}
                        </Button>

                        {/* Status Toggle Button */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusChange(mentor.id, mentor.status === 'active' ? 'inactive' : 'active')}
                          disabled={actionLoadingId === mentor.id + '_status'}
                        >
                          {actionLoadingId === mentor.id + '_status' ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : mentor.status === 'active' ? (
                            'Khóa'
                          ) : (
                            'Mở khóa'
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-gray-100 dark:border-slate-800 px-6 py-4 bg-gray-50 dark:bg-slate-950/50">
          <Button variant="outline" size="sm" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page <= 1 || loading}>
            Trước
          </Button>
          <div className="text-sm text-gray-600 dark:text-slate-400">
            {page}
          </div>
          <Button variant="outline" size="sm" onClick={() => setPage((current) => current + 1)} disabled={mentors.length < pageSize || loading}>
            Sau
          </Button>
        </div>
      </Card>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chi tiết Hồ sơ Mentor</DialogTitle>
            <DialogDescription>
              {mentorDetail?.userSummary.email}
            </DialogDescription>
          </DialogHeader>

          {detailLoading ? (
            <div className="flex h-[40vh] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            </div>
          ) : mentorDetail ? (
            <div className="space-y-6 mt-4">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Card className="p-4 bg-white dark:bg-slate-900">
                  <p className="text-xs uppercase tracking-wide opacity-70">Tài khoản</p>
                  <div className="flex items-center gap-3 mt-2">
                    {mentorDetail.userSummary.avatarUrl ? (
                      <img src={mentorDetail.userSummary.avatarUrl} alt="" className="h-10 w-10 rounded-full object-cover shadow-sm border border-gray-100 dark:border-slate-800" />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 text-violet-600 font-bold dark:bg-violet-900/50 dark:text-violet-400">
                        {mentorDetail.userSummary.fullName.charAt(0)}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-lg font-semibold leading-tight truncate" title={mentorDetail.userSummary.fullName}>{mentorDetail.userSummary.fullName}</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-slate-400">Kiểm duyệt / Status</p>
                  <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-slate-100">
                    {selectedMentor?.isVerified ? <span className="text-emerald-600 dark:text-emerald-400">Đã phê duyệt</span> : <span className="text-amber-600 dark:text-amber-400">Chờ phê duyệt</span>}
                  </p>
                  <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-slate-100">
                    {selectedMentor?.status === 'active' ? <span className="text-emerald-600 dark:text-emerald-400">Đang hoạt động</span> : selectedMentor?.status === 'inactive' ? <span className="text-amber-600 dark:text-amber-400">Tạm khóa</span> : selectedMentor?.status}
                  </p>
                </Card>

                <Card className="p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-slate-400">Đánh giá (Rating)</p>
                  <div className="mt-1 flex items-center gap-1 text-lg font-semibold text-gray-900 dark:text-slate-100">
                    <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                    {selectedMentor?.ratingAverage > 0 ? selectedMentor.ratingAverage.toFixed(1) : 'N/A'}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-slate-400">
                    {selectedMentor?.ratingCount || 0} lượt đánh giá
                  </p>
                </Card>

                <Card className="p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-slate-400">Kinh nghiệm</p>
                  <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-slate-100">
                    {selectedMentor?.yearsOfExperience != null ? `${selectedMentor?.yearsOfExperience} năm` : '—'}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-slate-400">Số năm làm việc</p>
                </Card>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <Card className="p-5">
                  <div className="mb-4 flex items-center gap-2">
                    <Shield className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                    <h3 className="font-semibold text-gray-900 dark:text-slate-100">Profile summary</h3>
                  </div>
                  <div className="space-y-3 text-sm text-gray-600 dark:text-slate-400">
                    <p><span className="font-medium text-gray-700 dark:text-slate-300">Headline:</span> {mentorDetail?.profileSummary?.headline || selectedMentor?.headline || '—'}</p>
                    <p><span className="font-medium text-gray-700 dark:text-slate-300">Bio:</span> {mentorDetail?.profileSummary?.bio || selectedMentor?.bio || '—'}</p>
                    <p><span className="font-medium text-gray-700 dark:text-slate-300">Years of experience:</span> {mentorDetail?.profileSummary?.yearsOfExperience ?? selectedMentor?.yearsOfExperience != null ? `${mentorDetail?.profileSummary?.yearsOfExperience ?? selectedMentor?.yearsOfExperience} năm` : '—'}</p>

                    <div className="pt-2 border-t border-gray-100 dark:border-slate-800 mt-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-700 dark:text-slate-300">Chuyên môn (Specialties):</span>
                      </div>
                      {(mentorDetail?.profileSummary?.specialties?.length || 0) > 0 || (selectedMentor.specialties?.length || 0) > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {(mentorDetail?.profileSummary?.specialties || selectedMentor.specialties || []).map(spec => (
                            <Badge key={spec.id} variant="secondary" className="bg-cyan-50 text-cyan-700 hover:bg-cyan-100 dark:bg-cyan-900/30 dark:text-cyan-300">
                              {spec.name}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-500 italic">Chưa gán chuyên môn</span>
                      )}
                    </div>

                    {mentorDetail?.profileSummary?.skills && mentorDetail.profileSummary.skills.length > 0 && (
                      <div className="pt-2 border-t border-gray-100 dark:border-slate-800 mt-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-700 dark:text-slate-300">Kỹ năng (Skills):</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {mentorDetail.profileSummary.skills.map(skill => (
                            <Badge key={skill} variant="outline" className="bg-gray-50">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </Card>

                <Card className="p-5">
                  <div className="mb-4 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <h3 className="font-semibold text-gray-900 dark:text-slate-100">Cập nhật trạng thái</h3>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Trạng thái phê duyệt (Verify)</p>
                      <Button
                        variant={selectedMentor.isVerified ? "outline" : "default"}
                        size="sm"
                        onClick={() => {
                          handleVerify(selectedMentor.id, !selectedMentor.isVerified);
                        }}
                        className={!selectedMentor.isVerified ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "text-amber-600 hover:text-amber-700 hover:bg-amber-50"}
                      >
                        {selectedMentor.isVerified ? 'Hủy phê duyệt' : 'Phê duyệt Mentor'}
                      </Button>
                    </div>

                    <div className="pt-2 border-t border-gray-100 dark:border-slate-800">
                      <p className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-2 mt-2">Trạng thái hoạt động (Active)</p>
                      <div className="flex gap-2">
                        {selectedMentor.status === 'inactive' ?
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => {
                              handleStatusChange(selectedMentor.id, 'active');
                            }}
                          >
                            Mở khóa (Active)
                          </Button>
                          :
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              handleStatusChange(selectedMentor.id, 'inactive');
                            }}
                          >
                            Tạm khóa (Inactive)
                          </Button>
                        }

                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          ) : null}

          <DialogFooter className="mt-6 border-t pt-4 dark:border-slate-800">
            <Button variant="outline" onClick={() => setDetailOpen(false)}>Đóng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminMentorsPage;

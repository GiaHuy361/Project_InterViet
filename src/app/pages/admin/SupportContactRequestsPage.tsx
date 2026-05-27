import React, { useEffect, useState } from 'react';
import {
  Mail,
  Search,
  CheckCircle2,
  XCircle,
  Loader2,
  ChevronRight,
  RefreshCw,
  Clock,
  User,
  Phone,
  Tag
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import supportWorkspaceService from '../../../services/supportWorkspaceService';
import type { SupportWorkspaceContactRequest } from '../../../lib/api/publicTypes';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';

type ContactRequestStatus = 'pending' | 'processed' | 'ignored';

const statusConfig: Record<ContactRequestStatus, { label: string; color: string; bg: string; icon: React.ComponentType<{ className?: string }> }> = {
  pending: { label: 'Chờ xử lý', color: 'text-amber-500', bg: 'bg-amber-500/10 border-amber-200', icon: Clock },
  processed: { label: 'Đã tiếp nhận', color: 'text-emerald-500', bg: 'bg-emerald-500/10 border-emerald-200', icon: CheckCircle2 },
  ignored: { label: 'Bỏ qua', color: 'text-slate-500', bg: 'bg-slate-500/10 border-slate-200', icon: XCircle },
};

export const SupportContactRequestsPage: React.FC = () => {
  const { state } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<ContactRequestStatus | 'all'>('all');
  const [requests, setRequests] = useState<SupportWorkspaceContactRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);

  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [detailData, setDetailData] = useState<SupportWorkspaceContactRequest | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const res = await supportWorkspaceService.getContactRequests({
        status: filterStatus === 'all' ? undefined : filterStatus,
        search: searchQuery || undefined,
        page,
        pageSize,
      });
      setRequests(res.items || []);
      setTotal(res.total || 0);
    } catch (err) {
      console.error('Failed to load contact requests', err);
      toast.error('Không thể tải danh sách liên hệ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [filterStatus, page, pageSize]);

  const filteredRequests = requests.filter((req) => {
    if (filterStatus !== 'all' && req.status !== filterStatus) return false;
    if (searchQuery && !req.subject.toLowerCase().includes(searchQuery.toLowerCase()) && !req.email.toLowerCase().includes(searchQuery.toLowerCase()) && !req.fullName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  function timeAgo(date?: string | null) {
    if (!date) return '';
    const diff = Date.now() - new Date(date).getTime();
    const s = Math.floor(diff / 1000);
    if (s < 60) return `${s}s trước`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m} phút trước`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} giờ trước`;
    const d = Math.floor(h / 24);
    return `${d} ngày trước`;
  }

  const handleSetStatus = async (id: string, newStatus: string) => {
    try {
      await supportWorkspaceService.updateContactRequestStatus(id, newStatus);
      toast.success('Đã cập nhật trạng thái');
      await loadRequests();
      if (detailId === id) {
        openDetailDialog(id);
      }
    } catch (err) {
      console.error('Set status failed', err);
      toast.error('Cập nhật trạng thái thất bại');
    }
  };

  const openDetailDialog = async (id: string) => {
    setDetailId(id);
    setDetailDialogOpen(true);
    setDetailLoading(true);
    setDetailData(null);

    try {
      const data = await supportWorkspaceService.getContactRequestDetail(id);
      setDetailData(data);
    } catch (err) {
      console.error('Failed to load detail', err);
      toast.error('Không thể tải chi tiết liên hệ');
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetailDialog = () => {
    setDetailDialogOpen(false);
    setDetailId(null);
    setDetailData(null);
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-200">
            <Mail className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Liên hệ Khách hàng</h1>
            <p className="text-sm text-gray-500">
              Tiếp nhận lời nhắn từ khách vãng lai •{' '}
              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700">
                Support Workspace
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm border border-gray-200 transition-colors hover:bg-gray-50"
            onClick={() => loadRequests()}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
          <div className="text-sm text-gray-500">{loading ? 'Đang tải...' : `${total} kết quả`}</div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {Object.entries(statusConfig).map(([key, config]) => {
          const Icon = config.icon;
          const count = requests.filter((r) => r.status === key).length;
          return (
            <button
              key={key}
              onClick={() => setFilterStatus(key === filterStatus ? 'all' : (key as ContactRequestStatus))}
              className={`flex items-center gap-3 rounded-2xl border p-4 transition-all duration-200 hover:shadow-sm ${
                filterStatus === key ? config.bg : 'border-gray-100 bg-white'
              }`}
            >
              <Icon className={`h-5 w-5 ${config.color}`} />
              <div className="text-left">
                <p className="text-xl font-bold text-gray-900">{count}</p>
                <p className="text-xs text-gray-500">{config.label}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Tìm kiếm theo tên, email, chủ đề..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && loadRequests()}
          className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-11 pr-4 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
        />
      </div>

      {/* List */}
      {loading ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center shadow-sm">
          <p className="text-sm text-gray-500">Đang tải dữ liệu...</p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50">
            <Mail className="h-7 w-7 text-indigo-400" />
          </div>
          <p className="text-lg font-semibold text-gray-700">Chưa có liên hệ nào</p>
          <p className="mt-2 text-sm text-gray-400 max-w-md mx-auto">
            Không tìm thấy kết quả khớp với bộ lọc hiện tại.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRequests.map((req) => {
            const reqStatus = (statusConfig[req.status as ContactRequestStatus] ? req.status : 'pending') as ContactRequestStatus;
            const status = statusConfig[reqStatus];
            const StatusIcon = status.icon;

            return (
              <div
                key={req.id}
                className="group flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all duration-200 hover:border-indigo-200 hover:shadow-md cursor-pointer"
                onClick={() => openDetailDialog(req.id)}
              >
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${status.bg}`}>
                  <StatusIcon className={`h-5 w-5 ${status.color}`} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-900 truncate">{req.subject}</p>
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                      {req.category}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <User className="h-3.5 w-3.5" />
                      {req.fullName} ({req.email})
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {timeAgo(req.createdAt)}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${status.bg} ${status.color}`}>
                      {status.label}
                    </span>
                    <ChevronRight className="h-5 w-5 text-gray-300 transition-colors group-hover:text-indigo-500" />
                  </div>

                  <div className="flex items-center gap-2">
                    {reqStatus === 'pending' && (
                      <>
                        <button onClick={(event) => { event.stopPropagation(); handleSetStatus(req.id, 'processed'); }} className="rounded-md bg-emerald-50 px-3 py-1 text-sm text-emerald-700 border hover:bg-emerald-100">Tiếp nhận</button>
                        <button onClick={(event) => { event.stopPropagation(); handleSetStatus(req.id, 'ignored'); }} className="rounded-md bg-slate-50 px-3 py-1 text-sm text-slate-700 border hover:bg-slate-100">Bỏ qua</button>
                      </>
                    )}
                    {(reqStatus === 'processed' || reqStatus === 'ignored') && (
                      <button onClick={(event) => { event.stopPropagation(); handleSetStatus(req.id, 'pending'); }} className="rounded-md bg-white px-3 py-1 text-sm border hover:bg-gray-50">
                        Hoàn tác
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Pagination */}
          {total > pageSize && (
            <div className="flex items-center justify-end gap-2 pt-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded px-3 py-1 border bg-white disabled:opacity-50"
              >Trước</button>
              <div className="text-sm text-gray-600">{page} / {Math.ceil(total / pageSize)}</div>
              <button
                onClick={() => setPage((p) => Math.min(Math.ceil(total / pageSize), p + 1))}
                disabled={page >= Math.ceil(total / pageSize)}
                className="rounded px-3 py-1 border bg-white disabled:opacity-50"
              >Sau</button>
            </div>
          )}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={(open) => (open ? setDetailDialogOpen(true) : closeDetailDialog())}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chi tiết yêu cầu liên hệ</DialogTitle>
            <DialogDescription>
              {detailData ? `Gửi lúc: ${new Date(detailData.createdAt).toLocaleString('vi-VN')}` : 'Đang tải...'}
            </DialogDescription>
          </DialogHeader>

          {detailLoading ? (
            <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center text-sm text-gray-500 flex flex-col items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
              Đang tải chi tiết...
            </div>
          ) : detailData ? (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Người gửi</p>
                  <p className="mt-1 font-semibold text-gray-900 flex items-center gap-2"><User className="h-4 w-4" />{detailData.fullName}</p>
                </div>
                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Email</p>
                  <p className="mt-1 font-semibold text-gray-900 flex items-center gap-2"><Mail className="h-4 w-4" />{detailData.email}</p>
                </div>
                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Số điện thoại</p>
                  <p className="mt-1 font-semibold text-gray-900 flex items-center gap-2"><Phone className="h-4 w-4" />{detailData.phone || 'Không cung cấp'}</p>
                </div>
                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Phân loại / Trạng thái</p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-gray-200 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                      <Tag className="h-3 w-3" /> {detailData.category}
                    </span>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusConfig[detailData.status as ContactRequestStatus]?.bg} ${statusConfig[detailData.status as ContactRequestStatus]?.color}`}>
                      {statusConfig[detailData.status as ContactRequestStatus]?.label || detailData.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">Chủ đề</p>
                <p className="font-semibold text-gray-900 text-lg mb-4">{detailData.subject}</p>
                
                <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">Nội dung tin nhắn</p>
                <div className="rounded-xl bg-gray-50 p-4 text-sm leading-relaxed text-gray-700 border border-gray-100 whitespace-pre-wrap">
                  {detailData.message || 'Không có nội dung.'}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center text-sm text-gray-500">
              Không có dữ liệu chi tiết.
            </div>
          )}

          <DialogFooter className="mt-4 gap-2">
            <Button type="button" variant="outline" onClick={closeDetailDialog}>
              Đóng
            </Button>
            {detailData?.status === 'pending' && (
              <>
                <Button variant="secondary" onClick={() => handleSetStatus(detailData.id, 'ignored')}>
                  Bỏ qua
                </Button>
                <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={() => handleSetStatus(detailData.id, 'processed')}>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Tiếp nhận xử lý
                </Button>
              </>
            )}
            {detailData && (detailData.status === 'processed' || detailData.status === 'ignored') && (
              <Button variant="outline" onClick={() => handleSetStatus(detailData.id, 'pending')}>
                Hoàn tác trạng thái
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SupportContactRequestsPage;

import React, { useEffect, useState } from 'react';
import {
  Headphones,
  Search,
  Filter,
  MessageSquare,
  Clock,
  User,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Loader2,
  ChevronRight,
  RefreshCw,
  Lock,
  Globe2
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import supportWorkspaceService from '../../../services/supportWorkspaceService';
import type { SupportWorkspaceTicket } from '../../../lib/api/publicTypes';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { toast } from 'sonner';

type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

const statusConfig: Record<TicketStatus, { label: string; color: string; bg: string; icon: React.ComponentType<{ className?: string }> }> = {
  open: { label: 'Đang mở', color: 'text-red-500', bg: 'bg-red-500/10 border-red-200', icon: AlertCircle },
  in_progress: { label: 'Đang xử lý', color: 'text-amber-500', bg: 'bg-amber-500/10 border-amber-200', icon: Loader2 },
  resolved: { label: 'Đã giải quyết', color: 'text-emerald-500', bg: 'bg-emerald-500/10 border-emerald-200', icon: CheckCircle2 },
  closed: { label: 'Đã đóng', color: 'text-slate-500', bg: 'bg-slate-500/10 border-slate-200', icon: XCircle },
};

const priorityConfig = {
  low: { label: 'Thấp', color: 'text-gray-600 bg-gray-100' },
  medium: { label: 'Trung bình', color: 'text-blue-600 bg-blue-100' },
  high: { label: 'Cao', color: 'text-orange-600 bg-orange-100' },
  urgent: { label: 'Khẩn cấp', color: 'text-red-600 bg-red-100' },
};

export const SupportTicketsPage: React.FC = () => {
  const { state } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<TicketStatus | 'all'>('all');
  const [assignedToMe, setAssignedToMe] = useState(false);
  const [tickets, setTickets] = useState<SupportWorkspaceTicket[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);

  const [assignLoading, setAssignLoading] = useState<string | null>(null);

  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [replyTicketId, setReplyTicketId] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [replyIsInternal, setReplyIsInternal] = useState(false);
  const [replyLoading, setReplyLoading] = useState(false);

  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [detailTicketId, setDetailTicketId] = useState<string | null>(null);
  const [detailTicket, setDetailTicket] = useState<SupportWorkspaceTicket | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const res = await supportWorkspaceService.getSupportTickets({
        status: filterStatus === 'all' ? undefined : filterStatus,
        assignedToMe: assignedToMe ? true : undefined,
        search: searchQuery || undefined,
        page,
        pageSize,
      });
      // sort by lastMessageAt desc (most recent first)
      const items = (res.items || []).slice().sort((a, b) => {
        const ta = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : new Date(a.createdAt).getTime();
        const tb = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : new Date(b.createdAt).getTime();
        return tb - ta;
      });
      setTickets(items);
      setTotal(res.total || 0);
    } catch (err) {
      console.error('Failed to load tickets', err);
      toast.error('Không thể tải danh sách ticket');
    } finally {
      setLoading(false);
    }
  };

  const isActionAllowed = {
    assign: (status: TicketStatus) => status === 'open',
    statusChange: (status: TicketStatus) => status !== 'closed',
    close: (status: TicketStatus) => status === 'open' || status === 'in_progress' || status === 'resolved',
  };

  useEffect(() => {
    loadTickets();
  }, [filterStatus, assignedToMe, page, pageSize]); // intentionally skipping searchQuery for manual refresh

  // We can also implement auto-search with debounce, but let's keep it simple and filter client-side if no API search is triggered, 
  // actually API search is passed when loadTickets is called. Let's add a search button or trigger loadTickets on Enter.

  const filteredTickets = tickets.filter((ticket) => {
    if (filterStatus !== 'all' && ticket.status !== filterStatus) return false;
    if (searchQuery && !ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) && !ticket.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase())) return false;
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

  const handleAssignSelf = async (ticketId: string) => {
    setAssignLoading(ticketId);
    try {
      await supportWorkspaceService.assignTicketToSelf(ticketId);
      toast.success('Đã nhận xử lý ticket');
      await loadTickets();
      if (detailTicketId === ticketId) {
        openDetailDialog(ticketId);
      }
    } catch (err) {
      console.error('Assign failed', err);
      toast.error('Không thể nhận ticket. Vui lòng thử lại.');
    } finally {
      setAssignLoading(null);
    }
  };

  const openReplyDialog = (ticketId: string) => {
    setReplyTicketId(ticketId);
    setReplyMessage('');
    setReplyIsInternal(false);
    setReplyDialogOpen(true);
  };

  const closeReplyDialog = () => {
    setReplyDialogOpen(false);
    setReplyTicketId(null);
    setReplyMessage('');
    setReplyIsInternal(false);
  };

  const handleReplySubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!replyTicketId || !replyMessage.trim()) return;

    setReplyLoading(true);
    try {
      await supportWorkspaceService.addTicketMessage(replyTicketId, { messageBody: replyMessage.trim(), isInternalNote: replyIsInternal });
      toast.success(replyIsInternal ? 'Đã thêm ghi chú nội bộ' : 'Đã gửi phản hồi');
      closeReplyDialog();
      await loadTickets();
      if (detailTicketId === replyTicketId) {
        openDetailDialog(replyTicketId);
      }
    } catch (err) {
      console.error('Send message failed', err);
      toast.error('Gửi tin nhắn thất bại');
    } finally {
      setReplyLoading(false);
    }
  };

  const handleSetStatus = async (ticketId: string, status: TicketStatus) => {
    try {
      await supportWorkspaceService.updateTicketStatus(ticketId, status);
      toast.success('Đã cập nhật trạng thái');
      await loadTickets();
      if (detailTicketId === ticketId) {
        openDetailDialog(ticketId);
      }
    } catch (err) {
      console.error('Set status failed', err);
      toast.error('Cập nhật trạng thái thất bại');
    }
  };

  const openDetailDialog = async (ticketId: string) => {
    setDetailTicketId(ticketId);
    setDetailDialogOpen(true);
    setDetailLoading(true);
    setDetailTicket(null);

    try {
      const ticketDetail = await supportWorkspaceService.getSupportTicketDetail(ticketId);
      setDetailTicket(ticketDetail);
    } catch (err) {
      console.error('Failed to load ticket detail', err);
      toast.error('Không thể tải chi tiết ticket');
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetailDialog = () => {
    setDetailDialogOpen(false);
    setDetailTicketId(null);
    setDetailTicket(null);
  };

  const formatDateTime = (date?: string | null) => {
    if (!date) return '—';
    return new Date(date).toLocaleString('vi-VN');
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 shadow-lg shadow-teal-200">
            <Headphones className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Quản lý Hỗ trợ</h1>
            <p className="text-sm text-gray-500">
              Tiếp nhận và xử lý yêu cầu hỗ trợ •{' '}
              <span className="inline-flex items-center gap-1 rounded-full bg-teal-100 px-2 py-0.5 text-xs font-semibold text-teal-700">
                Support Workspace
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm border border-gray-200 transition-colors hover:bg-gray-50"
            onClick={() => loadTickets()}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
          <div className="text-sm text-gray-500">{loading ? 'Đang tải...' : `${total} kết quả`}</div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Object.entries(statusConfig).map(([key, config]) => {
          const Icon = config.icon;
          const count = tickets.filter((t) => t.status === key).length;
          return (
            <button
              key={key}
              onClick={() => setFilterStatus(key === filterStatus ? 'all' : (key as TicketStatus))}
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

      {/* Search and Filter Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm ticket theo ID, Tiêu đề..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadTickets()}
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-11 pr-4 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-100"
          />
        </div>
        <label className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 cursor-pointer transition-colors hover:bg-gray-50">
          <input 
            type="checkbox" 
            checked={assignedToMe} 
            onChange={(e) => setAssignedToMe(e.target.checked)}
            className="rounded border-gray-300 text-teal-600 focus:ring-teal-500 h-4 w-4"
          />
          Chỉ xem Ticket của tôi
        </label>
      </div>

      {/* Tickets List */}
      {loading ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center shadow-sm">
          <p className="text-sm text-gray-500">Đang tải danh sách ticket...</p>
        </div>
      ) : filteredTickets.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-50">
            <MessageSquare className="h-7 w-7 text-teal-400" />
          </div>
          <p className="text-lg font-semibold text-gray-700">Chưa có ticket nào</p>
          <p className="mt-2 text-sm text-gray-400 max-w-md mx-auto">
            Không tìm thấy ticket nào khớp với bộ lọc hiện tại.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTickets.map((ticket) => {
            const ticketStatus = (statusConfig[ticket.status as TicketStatus] ? ticket.status : 'open') as TicketStatus;
            const status = statusConfig[ticketStatus];
            const priority = priorityConfig[ticket.priority as keyof typeof priorityConfig] || priorityConfig.medium;
            const StatusIcon = status.icon;
            const allowAssign = isActionAllowed.assign(ticketStatus) && !ticket.assignedTo;
            const allowStatusChange = isActionAllowed.statusChange(ticketStatus);
            const allowClose = isActionAllowed.close(ticketStatus);

            return (
              <div
                key={ticket.id}
                className="group flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all duration-200 hover:border-teal-200 hover:shadow-md cursor-pointer"
                onClick={() => openDetailDialog(ticket.id)}
              >
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${status.bg}`}>
                  <StatusIcon className={`h-5 w-5 ${status.color}`} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-900 truncate">{ticket.subject}</p>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${priority.color}`}>
                      {priority.label}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-sm text-gray-500">
                    <span className="flex items-center gap-1 font-mono text-xs text-gray-400">
                      {ticket.ticketNumber}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="h-3.5 w-3.5" />
                      {ticket.assignedTo || 'Chưa gán'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {new Date(ticket.createdAt).toLocaleString('vi-VN')}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${status.bg} ${status.color}`}>
                      {status.label}
                    </span>
                    <ChevronRight className="h-5 w-5 text-gray-300 transition-colors group-hover:text-teal-500" />
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Assign Self */}
                    {allowAssign && (
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          handleAssignSelf(ticket.id);
                        }}
                        disabled={assignLoading === ticket.id}
                        className="rounded-md bg-teal-50 px-3 py-1 text-sm font-medium text-teal-700 border border-teal-200 hover:bg-teal-100 transition-colors disabled:opacity-50"
                      >
                        {assignLoading === ticket.id ? 'Đang nhận...' : 'Tự nhận xử lý'}
                      </button>
                    )}

                    {/* Chat */}
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        openReplyDialog(ticket.id);
                      }}
                      className="rounded-md bg-white px-3 py-1 text-sm border hover:bg-gray-50 transition-colors"
                    >Trả lời</button>

                    {/* Status actions */}
                    {allowStatusChange && ticketStatus === 'open' && (
                      <>
                        <button onClick={(event) => { event.stopPropagation(); handleSetStatus(ticket.id, 'in_progress'); }} className="rounded-md bg-amber-50 px-3 py-1 text-sm text-amber-700 border hover:bg-amber-100">Bắt đầu</button>
                        <button onClick={(event) => { event.stopPropagation(); handleSetStatus(ticket.id, 'resolved'); }} className="rounded-md bg-emerald-50 px-3 py-1 text-sm text-emerald-700 border hover:bg-emerald-100">Đã giải quyết</button>
                      </>
                    )}

                    {allowStatusChange && ticketStatus === 'in_progress' && (
                      <>
                        <button onClick={(event) => { event.stopPropagation(); handleSetStatus(ticket.id, 'resolved'); }} className="rounded-md bg-emerald-50 px-3 py-1 text-sm text-emerald-700 border hover:bg-emerald-100">Đã giải quyết</button>
                        {allowClose && <button onClick={(event) => { event.stopPropagation(); handleSetStatus(ticket.id, 'closed'); }} className="rounded-md bg-slate-50 px-3 py-1 text-sm text-slate-700 border hover:bg-slate-100">Đóng</button>}
                      </>
                    )}

                    {allowStatusChange && ticketStatus === 'resolved' && (
                      <>
                        <button onClick={(event) => { event.stopPropagation(); handleSetStatus(ticket.id, 'open'); }} className="rounded-md bg-red-50 px-3 py-1 text-sm text-red-700 border hover:bg-red-100">Mở lại</button>
                        {allowClose && <button onClick={(event) => { event.stopPropagation(); handleSetStatus(ticket.id, 'closed'); }} className="rounded-md bg-slate-50 px-3 py-1 text-sm text-slate-700 border hover:bg-slate-100">Đóng</button>}
                      </>
                    )}

                    {ticketStatus === 'closed' && (
                      <button onClick={(event) => { event.stopPropagation(); handleSetStatus(ticket.id, 'open'); }} className="rounded-md bg-white px-3 py-1 text-sm border hover:bg-gray-50">
                        Mở lại
                      </button>
                    )}
                  </div>
                  <div className="text-xs text-gray-400">Hoạt động {timeAgo(ticket.lastMessageAt || ticket.createdAt)}</div>
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

      {/* Reply Dialog */}
      <Dialog open={replyDialogOpen} onOpenChange={(open) => (open ? setReplyDialogOpen(true) : closeReplyDialog())}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Gửi tin nhắn / Ghi chú</DialogTitle>
            <DialogDescription>
              Bạn có thể gửi phản hồi công khai cho ứng viên hoặc để lại ghi chú nội bộ chỉ Support mới thấy.
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleReplySubmit}>
            <div className="space-y-2">
              <Label htmlFor="reply-message">Nội dung</Label>
              <Textarea
                id="reply-message"
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder="Nhập nội dung..."
                rows={5}
                className={replyIsInternal ? 'bg-amber-50/50 border-amber-200' : ''}
              />
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50 p-3">
              <input
                type="checkbox"
                id="internal-note"
                checked={replyIsInternal}
                onChange={(e) => setReplyIsInternal(e.target.checked)}
                className="rounded border-gray-300 text-amber-500 focus:ring-amber-500 h-4 w-4"
              />
              <Label htmlFor="internal-note" className="text-sm cursor-pointer text-gray-700">
                Lưu làm ghi chú nội bộ (Ẩn với ứng viên)
              </Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeReplyDialog} disabled={replyLoading}>
                Hủy
              </Button>
              <Button type="submit" disabled={replyLoading || !replyMessage.trim()} variant={replyIsInternal ? 'secondary' : 'default'} className={replyIsInternal ? 'bg-amber-100 text-amber-900 hover:bg-amber-200' : ''}>
                {replyLoading ? 'Đang gửi...' : (replyIsInternal ? 'Lưu ghi chú' : 'Gửi phản hồi')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={(open) => (open ? setDetailDialogOpen(true) : closeDetailDialog())}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chi tiết ticket</DialogTitle>
            <DialogDescription>
              {detailTicket ? `${detailTicket.ticketNumber} • ${detailTicket.subject}` : 'Đang tải chi tiết ticket...'}
            </DialogDescription>
          </DialogHeader>

          {detailLoading ? (
            <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center text-sm text-gray-500 flex flex-col items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-teal-500" />
              Đang tải chi tiết ticket...
            </div>
          ) : detailTicket ? (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Ticket number</p>
                  <p className="mt-1 font-mono font-semibold text-gray-900">{detailTicket.ticketNumber}</p>
                </div>
                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Trạng thái</p>
                  <p className="mt-1 font-semibold text-gray-900">{statusConfig[detailTicket.status as TicketStatus]?.label || detailTicket.status}</p>
                </div>
                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Danh mục</p>
                  <p className="mt-1 font-semibold text-gray-900">{detailTicket.category || '—'}</p>
                </div>
                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Ưu tiên</p>
                  <p className="mt-1 font-semibold text-gray-900">{priorityConfig[detailTicket.priority as keyof typeof priorityConfig]?.label || detailTicket.priority}</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-gray-100 bg-white p-4 flex flex-col justify-center">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Người được gán</p>
                  <div className="mt-2 flex items-center justify-between">
                    <p className="font-semibold text-gray-900 flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400" />
                      {detailTicket.assignedTo || 'Chưa gán cho ai'}
                    </p>
                    {!detailTicket.assignedTo && detailTicket.status === 'open' && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleAssignSelf(detailTicket.id)}
                        disabled={assignLoading === detailTicket.id}
                      >
                        Nhận ticket
                      </Button>
                    )}
                  </div>
                </div>
                <div className="rounded-2xl border border-gray-100 bg-white p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Thời gian</p>
                  <div className="mt-2 space-y-1 text-sm text-gray-700">
                    <p>Tạo: <span className="font-medium">{formatDateTime(detailTicket.createdAt)}</span></p>
                    <p>Hoạt động: <span className="font-medium">{formatDateTime(detailTicket.lastMessageAt || detailTicket.createdAt)}</span></p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">Mô tả ban đầu</p>
                <div className="rounded-xl bg-gray-50 p-4 text-sm leading-relaxed text-gray-700 border border-gray-100">
                  {detailTicket.description || 'Không có mô tả.'}
                </div>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Lịch sử trao đổi</p>
                  <span className="inline-flex items-center justify-center rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-medium text-teal-700">
                    {detailTicket.messages?.length || 0} tin nhắn
                  </span>
                </div>
                <div className="space-y-4">
                  {detailTicket.messages?.length ? (
                    detailTicket.messages.map((message) => {
                      const isInternal = message.isInternalNote;
                      const isStaff = message.senderType === 'support' || message.senderType === 'admin';
                      return (
                        <div 
                          key={message.id} 
                          className={`rounded-xl border p-4 transition-colors ${
                            isInternal 
                              ? 'bg-amber-50/50 border-amber-200 shadow-sm shadow-amber-100/50' 
                              : isStaff 
                                ? 'bg-teal-50/30 border-teal-100' 
                                : 'bg-gray-50 border-gray-100'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2">
                              {isStaff ? (
                                <div className={`flex h-6 w-6 items-center justify-center rounded-full ${isInternal ? 'bg-amber-100' : 'bg-teal-100'}`}>
                                  <Headphones className={`h-3 w-3 ${isInternal ? 'text-amber-600' : 'text-teal-600'}`} />
                                </div>
                              ) : (
                                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200">
                                  <User className="h-3 w-3 text-gray-500" />
                                </div>
                              )}
                              <span className={`text-xs font-semibold ${isInternal ? 'text-amber-700' : 'text-gray-700'}`}>
                                {isInternal ? 'GHI CHÚ NỘI BỘ' : (isStaff ? 'Đội ngũ Hỗ trợ' : 'Khách hàng / Ứng viên')}
                              </span>
                              {isInternal && <Lock className="h-3 w-3 text-amber-500" />}
                              {!isInternal && <Globe2 className="h-3 w-3 text-teal-400" />}
                            </div>
                            <span className="text-xs text-gray-500">{formatDateTime(message.createdAt)}</span>
                          </div>
                          <p className={`whitespace-pre-wrap text-sm leading-relaxed ${isInternal ? 'text-amber-900' : 'text-gray-800'}`}>
                            {message.messageBody}
                          </p>
                        </div>
                      );
                    })
                  ) : (
                    <div className="rounded-xl border border-dashed border-gray-200 py-8 text-center text-sm text-gray-500">
                      Chưa có trao đổi nào.
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center text-sm text-gray-500">
              Không có dữ liệu chi tiết cho ticket này.
            </div>
          )}

          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={closeDetailDialog}>
              Đóng
            </Button>
            {detailTicketId && (
              <Button type="button" onClick={() => openReplyDialog(detailTicketId)} className="bg-teal-600 hover:bg-teal-700">
                <MessageSquare className="mr-2 h-4 w-4" />
                Trả lời / Ghi chú
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SupportTicketsPage;

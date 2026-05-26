/**
 * Support Tickets Page
 *
 * Ticket management for Support Staff and Admins.
 * Policy: AdminOrSupport — accessible by 'admin' and 'support' roles.
 */

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
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import adminService, { AdminSupportTicket } from '../../../services/adminSupportTicketService';

type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

const statusConfig: Record<TicketStatus, { label: string; color: string; bg: string; icon: React.ComponentType<{ className?: string }> }> = {
  open: { label: 'Mới', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200', icon: AlertCircle },
  in_progress: { label: 'Đang xử lý', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', icon: Loader2 },
  resolved: { label: 'Đã giải quyết', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', icon: CheckCircle2 },
  closed: { label: 'Đã đóng', color: 'text-gray-600', bg: 'bg-gray-50 border-gray-200', icon: XCircle },
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
  const [tickets, setTickets] = useState<AdminSupportTicket[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const loadTickets = async () => {
    setLoading(true);
    try {
      const res = await adminService.listAdminSupportTickets({
        status: filterStatus === 'all' ? undefined : filterStatus,
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, [filterStatus, page, pageSize]);

  const filteredTickets = tickets.filter((ticket) => {
    if (filterStatus !== 'all' && ticket.status !== filterStatus) return false;
    if (searchQuery && !ticket.subject.toLowerCase().includes(searchQuery.toLowerCase())) return false;
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

  const handleAssign = async (ticketId: string) => {
    const assignedTo = window.prompt('Gán cho userId (ví dụ: user_123)');
    if (!assignedTo) return;
    try {
      await adminService.assignAdminSupportTicket(ticketId, assignedTo);
      await loadTickets();
    } catch (err) {
      console.error('Assign failed', err);
      alert('Gán thất bại');
    }
  };

  const handleSendPublicMessage = async (ticketId: string) => {
    const msg = window.prompt('Nội dung trả lời công khai:');
    if (!msg) return;
    try {
      await adminService.postAdminSupportMessage(ticketId, { messageBody: msg, isInternalNote: false });
      // backend will update lastMessageAt and may change status; refresh
      await loadTickets();
    } catch (err) {
      console.error('Send message failed', err);
      alert('Gửi tin nhắn thất bại');
    }
  };

  const handleSetStatus = async (ticketId: string, status: string) => {
    try {
      await adminService.overrideAdminSupportTicketStatus(ticketId, status);
      await loadTickets();
    } catch (err) {
      console.error('Set status failed', err);
      alert('Cập nhật trạng thái thất bại');
    }
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
            <h1 className="text-2xl font-bold text-gray-900">Support Tickets</h1>
            <p className="text-sm text-gray-500">
              Quản lý ticket hỗ trợ khách hàng •{' '}
              <span className="inline-flex items-center gap-1 rounded-full bg-teal-100 px-2 py-0.5 text-xs font-semibold text-teal-700">
                {state.user?.systemRole === 'admin' ? 'Admin' : 'Support'}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm border border-gray-200 transition-colors hover:bg-gray-50"
            onClick={() => setPage(1)}
            disabled={loading}
          >
            <RefreshCw className="h-4 w-4" />
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
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm ticket theo tiêu đề..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-11 pr-4 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-100"
          />
        </div>
        <button className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">
          <Filter className="h-4 w-4" />
          Bộ lọc
        </button>
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
            Ticket hỗ trợ từ khách hàng sẽ hiển thị ở đây khi kết nối API <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-mono">/api/v1/admin/support/tickets</code>.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTickets.map((ticket) => {
            const status = statusConfig[ticket.status as TicketStatus];
            const priority = priorityConfig[ticket.priority as keyof typeof priorityConfig] || priorityConfig.medium;
            const StatusIcon = status.icon;

            return (
              <div
                key={ticket.id}
                className="group flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all duration-200 hover:border-teal-200 hover:shadow-md cursor-pointer"
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
                    <span className="flex items-center gap-1">
                      <User className="h-3.5 w-3.5" />
                      {ticket.assignedTo || '—'}
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
                    {/* Chat: allowed for all, but when closed it will reopen on backend */}
                    <button
                      onClick={() => handleSendPublicMessage(ticket.id)}
                      className="rounded-md bg-white px-3 py-1 text-sm border"
                    >Trả lời</button>

                    {/* Assign: only allowed when not closed */}
                    <button
                      onClick={() => handleAssign(ticket.id)}
                      disabled={ticket.status === 'closed'}
                      className="rounded-md bg-white px-3 py-1 text-sm border disabled:opacity-50"
                    >Gán</button>

                    {/* Status actions */}
                    {ticket.status === 'open' && (
                      <>
                        <button onClick={() => handleSetStatus(ticket.id, 'in_progress')} className="rounded-md bg-amber-50 px-3 py-1 text-sm text-amber-700 border">Bắt đầu</button>
                        <button onClick={() => handleSetStatus(ticket.id, 'resolved')} className="rounded-md bg-emerald-50 px-3 py-1 text-sm text-emerald-700 border">Đã giải quyết</button>
                      </>
                    )}

                    {ticket.status === 'in_progress' && (
                      <>
                        <button onClick={() => handleSetStatus(ticket.id, 'resolved')} className="rounded-md bg-emerald-50 px-3 py-1 text-sm text-emerald-700 border">Đã giải quyết</button>
                        <button onClick={() => handleSetStatus(ticket.id, 'closed')} className="rounded-md bg-slate-50 px-3 py-1 text-sm text-slate-700 border">Đóng</button>
                      </>
                    )}

                    {ticket.status === 'resolved' && (
                      <>
                        <button onClick={() => handleSetStatus(ticket.id, 'open')} className="rounded-md bg-red-50 px-3 py-1 text-sm text-red-700 border">Mở lại</button>
                        <button onClick={() => handleSetStatus(ticket.id, 'closed')} className="rounded-md bg-slate-50 px-3 py-1 text-sm text-slate-700 border">Đóng</button>
                      </>
                    )}

                    {ticket.status === 'closed' && (
                      <span className="text-xs text-gray-400">Đã đóng</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400">{timeAgo(ticket.lastMessageAt || ticket.createdAt)}</div>
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
                className="rounded px-3 py-1 border bg-white"
              >Trước</button>
              <div className="text-sm text-gray-600">{page} / {Math.ceil(total / pageSize)}</div>
              <button
                onClick={() => setPage((p) => Math.min(Math.ceil(total / pageSize), p + 1))}
                disabled={page >= Math.ceil(total / pageSize)}
                className="rounded px-3 py-1 border bg-white"
              >Sau</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SupportTicketsPage;

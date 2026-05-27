import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { Search, FileText, Loader2 } from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import adminSystemService, { AdminAuditLogRecord, AdminPaginatedResponse } from '../../../services/adminSystemService';
import AdminDevPromoteModal from './AdminDevPromoteModal';

const actionLabelMap: Record<string, string> = {
  'support.ticket_created': 'Tạo ticket',
  'support.ticket_replied': 'Trả lời ticket',
  'support.ticket_status_updated': 'Cập nhật trạng thái ticket',
  'support.ticket_assigned': 'Gán ticket',
  'admin.user_status_updated': 'Cập nhật trạng thái người dùng',
  'admin.notification_broadcast': 'Phát thông báo',
  'admin.dev_promote': 'Thăng quyền (dev tool)',
};

export const AdminAuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AdminAuditLogRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [loading, setLoading] = useState(false);
  const [actorRole, setActorRole] = useState('__all__');
  const [action, setAction] = useState('__all__');
  const [resource, setResource] = useState('');
  const [resourceId, setResourceId] = useState('');
  const [search, setSearch] = useState('');

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailJson, setDetailJson] = useState<string>('');
  const [devModalOpen, setDevModalOpen] = useState(false);
  const enableDevBootstrap = (import.meta.env.VITE_ENABLE_DEV_BOOTSTRAP === 'true') || import.meta.env.MODE !== 'production';
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    try {
      const resp = await adminSystemService.listAdminAuditLogs({
        search: search || undefined,
        actorRole: actorRole && actorRole !== '__all__' ? actorRole : undefined,
        action: action && action !== '__all__' ? action : undefined,
        resource: resource || undefined,
        resourceId: resourceId || undefined,
        page,
        pageSize,
      });
      setLogs(resp.items || []);
      setTotal(resp.total || 0);
    } catch (err) {
      console.error('Failed to load audit logs', err);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const openDetail = (metadataJson?: string | null) => {
    try {
      const pretty = metadataJson ? JSON.stringify(JSON.parse(metadataJson), null, 2) : '{}';
      setDetailJson(pretty);
    } catch (e) {
      setDetailJson(metadataJson || '');
    }
    setDetailOpen(true);
  };

  const actionLabel = (act: string) => actionLabelMap[act] || act;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
          <p className="text-sm text-gray-500">Lịch sử hành động hệ thống quan trọng</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => void load()}>Làm mới</Button>
          {enableDevBootstrap && (
            <>
              <Button variant="secondary" onClick={() => setDevModalOpen(true)}>Dev Promote</Button>
              <Button variant="ghost" onClick={() => navigate('/admin/json-samples')}>JSON Samples</Button>
            </>
          )}
        </div>
      </div>

      <Card className="p-6">
        <div className="grid gap-3 lg:grid-cols-5">
          <Input placeholder="Tên / Mô tả" value={search} onChange={(e) => setSearch(e.target.value)} />
          <Select value={actorRole} onValueChange={setActorRole}>
              <SelectTrigger className="file:text-foreground placeholder:text-slate-400 selection:bg-primary selection:text-primary-foreground flex h-10 w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-base text-slate-900 shadow-sm transition-[color,box-shadow] outline-none md:text-sm">
                <SelectValue>{actorRole && actorRole !== '__all__' ? actorRole : 'Tất cả vai trò'}</SelectValue>
              </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Tất cả vai trò</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="support">Support</SelectItem>
              <SelectItem value="mentor">Mentor</SelectItem>
              <SelectItem value="candidate">Candidate</SelectItem>
              <SelectItem value="system">System</SelectItem>
            </SelectContent>
          </Select>

          <Select value={action} onValueChange={setAction}>
            <SelectTrigger className="file:text-foreground placeholder:text-slate-400 selection:bg-primary selection:text-primary-foreground flex h-10 w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-base text-slate-900 shadow-sm transition-[color,box-shadow] outline-none md:text-sm">
              <SelectValue>{action && action !== '__all__' ? actionLabel(action) : 'Tất cả hành động'}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Tất cả hành động</SelectItem>
              {Object.keys(actionLabelMap).map((k) => (
                <SelectItem key={k} value={k}>{actionLabelMap[k]}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input placeholder="Resource" value={resource} onChange={(e) => setResource(e.target.value)} />
          <div className="flex items-center">
            <Button variant="default" onClick={() => { setPage(1); void load(); }} className="w-full">Tìm</Button>
          </div>
        </div>
        <div className="mt-3">
          <Input placeholder="Resource ID" value={resourceId} onChange={(e) => setResourceId(e.target.value)} />
        </div>
      </Card>

      <Card className="p-0">
        <div className="border-b border-gray-100 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Nhật ký</h2>
            <div className="text-sm text-gray-500">{loading ? 'Đang tải...' : `${total} kết quả`}</div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-12 text-sm text-gray-500">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Đang tải dữ liệu...
          </div>
        ) : (
          <Table className="table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead className="text-center">Thời gian</TableHead>
                <TableHead className="text-center">Tác nhân</TableHead>
                <TableHead className="text-center">Hành động</TableHead>
                <TableHead className="text-center">Đối tượng</TableHead>
                <TableHead className="text-center">Chi tiết</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length ? logs.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="text-center">{new Date(l.createdAt).toLocaleString('vi-VN')}</TableCell>
                  <TableCell className="text-center">{l.actorEmail} <span className="text-xs text-gray-400">({l.actorRole})</span></TableCell>
                  <TableCell className="text-center">{actionLabel(l.action)}</TableCell>
                  <TableCell className="text-center">{l.resource} {l.resourceId ? `(${l.resourceId})` : ''}</TableCell>
                  <TableCell className="text-center">
                    <Button variant="outline" size="sm" onClick={() => openDetail(l.metadataJson)}>
                      Xem
                    </Button>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={5} className="p-6 text-center text-gray-500">Không có bản ghi.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}

        <div className="flex items-center justify-between gap-3 border-t border-gray-100 px-6 py-4">
          <div className="text-sm text-gray-500">Hiển thị {logs.length} / {total}</div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>Trước</Button>
            <div className="text-sm text-gray-600">{page} / {Math.max(1, Math.ceil(total / pageSize))}</div>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page >= Math.ceil(total / pageSize)}>Sau</Button>
          </div>
        </div>
      </Card>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chi tiết metadata</DialogTitle>
          </DialogHeader>
          <pre className="max-h-[60vh] overflow-auto rounded-md bg-slate-100 p-4 text-sm">{detailJson}</pre>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailOpen(false)}>Đóng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {enableDevBootstrap && <AdminDevPromoteModal open={devModalOpen} onOpenChange={setDevModalOpen} />}
    </div>
  );
};

export default AdminAuditLogsPage;

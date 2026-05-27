import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { FileSearch } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { AppPageHeader } from '../components/design-system/AppPageHeader';
import { cvMatchService, type JobDescriptionItem } from '../../services/cvMatchService';
import { formatLocalDate } from '../../utils/formatters';

export const JDHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<JobDescriptionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selected, setSelected] = useState<JobDescriptionItem | null>(null);

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await cvMatchService.listJobDescriptions();
      setItems(resp.items ?? []);
    } catch {
      setItems([]);
      setError('Không tải được danh sách JD.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  const openDetail = (item: JobDescriptionItem) => {
    setSelected(item);
    setDetailOpen(true);
  };

  const promptDelete = (item: JobDescriptionItem) => {
    setSelected(item);
    setDeleteOpen(true);
  };

  const handleCloseDetail = (open: boolean) => {
    setDetailOpen(open);
    if (!open) {
      setSelected(null);
    }
  };

  const handleCloseDelete = (open: boolean) => {
    setDeleteOpen(open);
    if (!open) {
      setDeleting(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;

    setDeleting(true);
    try {
      await cvMatchService.deleteJobDescription(selected.id);
      setItems((current) => current.filter((item) => item.id !== selected.id));
      setDeleteOpen(false);
      setDetailOpen(false);
      setSelected(null);
    } catch {
      setError('Không xóa được JD.');
      setDeleteOpen(false);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <AppPageHeader
        title="Quản lý JD"
        subtitle="Xem và quản lý các Job Description đã lưu."
        icon={FileSearch}
        iconGradient="from-violet-500 to-purple-600"
        actions={(
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate(-1)}>
              Quay lại
            </Button>
            <Button onClick={() => navigate('/cv-matching')}>Tạo JD mới</Button>
          </div>
        )}
      />

      {error ? (
        <Card className="glass-card p-10 text-center">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </Card>
      ) : loading ? (
        <Card className="glass-card p-10 text-center">
          <p className="text-sm text-slate-500">Đang tải danh sách JD...</p>
        </Card>
      ) : items.length === 0 ? (
        <Card className="glass-card p-12 text-center">
          <FileSearch className="mx-auto mb-4 h-16 w-16 text-gray-400" />
          <h3 className="mb-2 text-xl font-bold">Chưa có JD nào</h3>
          <p className="mb-6 text-gray-600">Tạo Job Description để bắt đầu</p>
          <Button onClick={() => navigate('/cv-matching')}>Tạo JD mới</Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <Card key={item.id} className="glass-card hover-lift p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <h3 className="truncate font-bold">{item.title}</h3>
                    <span className="rounded-full bg-violet-100 dark:bg-violet-900/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-700 dark:text-violet-400 dark:bg-violet-900/40 dark:text-violet-300">
                      JD
                    </span>
                  </div>
                  <p className="truncate text-sm text-gray-600">{item.companyName} • {item.location}</p>
                  <p className="mt-1 text-sm text-gray-600">Ngày tạo: {formatLocalDate(item.createdAt)}</p>
                  <p className="mt-1 text-sm text-gray-600">Cập nhật lần cuối: {formatLocalDate(item.updatedAt)}</p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <Button variant="outline" size="sm" onClick={() => openDetail(item)}>
                    Xem chi tiết
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 dark:text-red-400 hover:text-red-700 dark:text-red-400"
                    onClick={() => promptDelete(item)}
                  >
                    Xóa
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={detailOpen} onOpenChange={handleCloseDetail}>
        <DialogContent className="max-h-[85vh] min-w-[40vw] max-w-4xl overflow-hidden">
          <DialogHeader>
            <DialogTitle>Chi tiết JD</DialogTitle>
            <DialogDescription>{selected?.title || '—'}</DialogDescription>
          </DialogHeader>

          <div className="max-h-[65vh] space-y-4 overflow-y-auto pr-1">
            {selected ? (
              <div className="grid gap-3 rounded-xl border border-slate-200 p-4 text-sm dark:border-slate-700">
                <DetailRow label="Tiêu đề" value={selected.title} />
                <DetailRow label="Công ty" value={selected.companyName} />
                <DetailRow label="Vị trí" value={selected.location} />
                <DetailRow label="Mức lương" value={selected.salaryText || '—'} />
                <DetailRow label="Source URL" value={selected.sourceUrl || '—'} />
                <DetailRow label="Ngày đăng" value={selected.postedAt ? formatLocalDate(selected.postedAt) : '—'} />
                <div className="grid gap-1 sm:grid-cols-[140px_minmax(0,1fr)] sm:items-start">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Nội dung
                  </span>
                  <pre
                    style={{ fontFamily: 'Inter, sans-serif', lineHeight: '1.5', fontWeight: '100' }}
                    className="max-h-[40vh] overflow-auto whitespace-pre-wrap break-words rounded border p-3 text-sm text-slate-800 dark:text-slate-100"
                  >
                    {selected.rawText}
                  </pre>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500">Không có dữ liệu.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={handleCloseDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa JD?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này sẽ xóa vĩnh viễn Job Description này khỏi hệ thống.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-600"
              onClick={() => void handleDelete()}
              disabled={deleting}
            >
              {deleting ? 'Đang xóa...' : 'Xóa'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

const DetailRow: React.FC<{
  label: string;
  value: string;
}> = ({ label, value }) => (
  <div className="grid gap-1 sm:grid-cols-[140px_minmax(0,1fr)] sm:items-start">
    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
      {label}
    </span>
    <span className="break-all text-sm text-slate-800 dark:text-slate-100">{value}</span>
  </div>
);

export default JDHistoryPage;

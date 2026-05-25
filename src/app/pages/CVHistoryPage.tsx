import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, ChevronLeft, ChevronRight, FileText, RefreshCw, SlidersHorizontal } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { AppPageHeader } from '../components/design-system/AppPageHeader';
import { formatLocalDate } from '../../utils/formatters';
import {
  cvMatchService,
  type ParseStatus,
  type ResumeDetail,
  type ResumeItem,
} from '../../services/cvMatchService';

type ActiveFilter = 'all' | 'true' | 'false';

const PAGE_SIZE_OPTIONS = [5, 10, 20] as const;
const STATUS_OPTIONS: Array<{ value: 'all' | ParseStatus; label: string }> = [
  { value: 'all', label: 'Tất cả' },
  { value: 'Queued', label: 'Queued' },
  { value: 'Processing', label: 'Processing' },
  { value: 'Parsed', label: 'Parsed' },
  { value: 'Failed', label: 'Failed' },
];

function formatStatusLabel(status?: string): string {
  if (!status) return 'Unknown';
  return status
    .replace(/_/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function formatFileSize(bytes: number): string {
  if (!bytes || Number.isNaN(bytes)) return '0 KB';
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function getActiveLabel(value: boolean): string {
  return value ? 'Đang dùng' : 'Không dùng';
}

export const CVHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [resumes, setResumes] = useState<ResumeItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZE_OPTIONS)[number]>(10);
  const [status, setStatus] = useState<'all' | ParseStatus>('all');
  const [isActive, setIsActive] = useState<ActiveFilter>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [resumeDetail, setResumeDetail] = useState<ResumeDetail | null>(null);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(totalCount / pageSize)), [pageSize, totalCount]);

  const loadResumes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await cvMatchService.listResumes({
        page,
        pageSize,
        status: status === 'all' ? undefined : status,
        isActive:
          isActive === 'all' ? undefined : isActive === 'true',
      });
      setResumes(response.items ?? []);
      setTotalCount(response.totalCount ?? response.items?.length ?? 0);
      if (response.page && response.page !== page) {
        setPage(response.page);
      }
    } catch {
      setResumes([]);
      setTotalCount(0);
      setError('Không tải được danh sách CV.');
    } finally {
      setLoading(false);
    }
  }, [isActive, page, pageSize, status]);

  useEffect(() => {
    void loadResumes();
  }, [loadResumes]);

  const handleFilterChange = useCallback(() => {
    setPage(1);
  }, []);

  const setStatusAndReset = (nextStatus: 'all' | ParseStatus) => {
    setStatus(nextStatus);
    handleFilterChange();
  };

  const setActiveAndReset = (nextValue: ActiveFilter) => {
    setIsActive(nextValue);
    handleFilterChange();
  };

  const setPageSizeAndReset = (nextSize: (typeof PAGE_SIZE_OPTIONS)[number]) => {
    setPageSize(nextSize);
    setPage(1);
  };

  const handleViewDetail = useCallback(async (resumeId: string) => {
    setDetailOpen(true);
    setDetailLoading(true);
    setDetailError(null);
    setResumeDetail(null);

    try {
      const data = await cvMatchService.getResumeDetail(resumeId);
      setResumeDetail(data);
    } catch {
      setDetailError('Không tải được chi tiết CV.');
    } finally {
      setDetailLoading(false);
    }
  }, []);

  return (
    <div className="space-y-6 pb-12">
      <AppPageHeader
        title="Lịch sử CV"
        subtitle="Xem, lọc và quản lý các CV đã tải lên theo trạng thái xử lý"
        icon={FileText}
        iconGradient="from-blue-500 to-cyan-500"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate(-1)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Quay lại
            </Button>
            <Button onClick={() => navigate('/cv-matching')}>Tối ưu CV mới</Button>
          </div>
        }
      />

      <Card className="gap-0 glass-card overflow-hidden border-slate-200/80 p-0 dark:border-slate-800/80">
        <div className="border-b border-slate-200/70 bg-gradient-to-r from-slate-50 via-white to-blue-50/70 px-5 py-4 dark:border-slate-800 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-md shadow-blue-500/20">
                  <SlidersHorizontal className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Bộ lọc CV
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Lọc theo trạng thái parse, active và số dòng hiển thị
                  </p>
                </div>
              </div>
            </div>
            <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white dark:bg-white dark:text-slate-900">
              {totalCount} kết quả
            </span>
          </div>
        </div>

        <div className="grid gap-4 px-5 py-5 md:grid-cols-2 xl:grid-cols-[repeat(3,minmax(0,1fr))_auto] xl:items-end">
          <FilterSelect
            label="Trạng thái parse"
            value={status}
            onChange={(value) => setStatusAndReset(value as 'all' | ParseStatus)}
            options={STATUS_OPTIONS}
          />

          <FilterSelect
            label="Trạng thái active"
            value={isActive}
            onChange={(value) => setActiveAndReset(value as ActiveFilter)}
            options={[
              { value: 'all', label: 'Tất cả' },
              { value: 'true', label: 'Đang dùng' },
              { value: 'false', label: 'Không dùng' },
            ]}
          />

          <FilterSelect
            label="Số dòng / trang"
            value={String(pageSize)}
            onChange={(value) => setPageSizeAndReset(Number(value) as (typeof PAGE_SIZE_OPTIONS)[number])}
            options={PAGE_SIZE_OPTIONS.map((option) => ({ value: String(option), label: `${option}` }))}
          />

          <Button
            variant="outline"
            className="h-11 gap-2 rounded-xl border-slate-200 bg-white px-5 shadow-sm transition-all hover:border-primary hover:bg-primary/5 dark:border-slate-700 dark:bg-slate-900"
            onClick={() => void loadResumes()}
            disabled={loading}
          >
            <RefreshCw className="h-4 w-4" />
            Làm mới
          </Button>
        </div>
      </Card>

      {error ? (
        <Card className="glass-card p-10 text-center">
          <p className="text-sm text-red-600">{error}</p>
        </Card>
      ) : loading ? (
        <Card className="glass-card p-10 text-center">
          <p className="text-sm text-slate-500">Đang tải danh sách CV...</p>
        </Card>
      ) : resumes.length === 0 ? (
        <Card className="glass-card p-12 text-center">
          <FileText className="mx-auto mb-4 h-16 w-16 text-gray-400" />
          <h3 className="mb-2 text-xl font-bold">Chưa có CV nào</h3>
          <p className="mb-6 text-gray-600">Bắt đầu tối ưu CV đầu tiên của bạn</p>
          <Button onClick={() => navigate('/cv-matching')}>Tối ưu CV ngay</Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {resumes.map((resume) => (
            <Card key={resume.resumeId} className="glass-card hover-lift p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <h3 className="truncate font-bold">{resume.title}</h3>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${resume.isActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>
                      {getActiveLabel(resume.isActive)}
                    </span>
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                      {formatStatusLabel(resume.parseStatus)}
                    </span>
                  </div>
                  <p className="truncate text-sm text-gray-600">{resume.originalFileName}</p>
                  <p className="mt-1 text-sm text-gray-600">
                    Tạo {formatLocalDate(resume.createdAt)} • Cập nhật {formatLocalDate(resume.updatedAt)}
                  </p>
                  <p className="mt-1 text-sm text-gray-600">
                    {formatFileSize(resume.fileSizeBytes)} • {resume.resumeId}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <Button variant="outline" size="sm" onClick={() => void handleViewDetail(resume.resumeId)}>
                    Xem chi tiết
                  </Button>
                </div>
              </div>
            </Card>
          ))}

          <Card className="glass-card p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Trang {page} / {totalPages} • {totalCount} CV
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={page <= 1 || loading}
                >
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Trước
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                  disabled={page >= totalPages || loading}
                >
                  Sau
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-hidden">
          <DialogHeader>
            <DialogTitle>Chi tiết CV</DialogTitle>
            <DialogDescription>
              Thông tin chi tiết CV: {resumeDetail?.title || '—'}
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[65vh] space-y-4 overflow-y-auto pr-1">
            {detailLoading ? (
              <p className="text-sm text-slate-500">Đang tải chi tiết CV...</p>
            ) : detailError ? (
              <p className="text-sm text-red-600">{detailError}</p>
            ) : resumeDetail ? (
              <>
                <div className="grid gap-3 rounded-xl border border-slate-200 p-4 text-sm dark:border-slate-700">
                  <DetailRow label="Tiêu đề" value={resumeDetail.title} />
                  <DetailRow label="Tên file gốc" value={resumeDetail.originalFileName} />
                  <DetailRow label="Version" value={String(resumeDetail.versionNumber ?? '—')} />
                  <DetailRow label="Trạng thái parse" value={formatStatusLabel(resumeDetail.parseStatus)} />
                  <DetailRow label="Active" value={getActiveLabel(resumeDetail.isActive)} />
                  <DetailRow label="Định dạng file" value={resumeDetail.fileExtension ?? '—'} />
                  <DetailRow label="Kích thước" value={formatFileSize(resumeDetail.fileSizeBytes)} />
                  <DetailRow label="Tạo lúc" value={formatLocalDate(resumeDetail.createdAt)} />
                  <DetailRow label="Cập nhật lúc" value={formatLocalDate(resumeDetail.updatedAt)} />
                  <DetailRow label="Lỗi xử lý" value={resumeDetail.processingError ?? '—'} />
                </div>

                {resumeDetail.latestParseJob && (
                  <div className="space-y-2 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      Latest Parse Job
                    </h4>
                    <div className="grid gap-2 text-sm">
                      <DetailRow label="Status" value={formatStatusLabel(resumeDetail.latestParseJob.status)} />
                      <DetailRow label="Error code" value={resumeDetail.latestParseJob.errorCode ?? '—'} />
                      <DetailRow label="Error message" value={resumeDetail.latestParseJob.errorMessage ?? '—'} />
                      <DetailRow label="Retry count" value={String(resumeDetail.latestParseJob.retryCount ?? 0)} />
                      <DetailRow label="Requested at" value={formatLocalDate(resumeDetail.latestParseJob.requestedAt)} />
                      <DetailRow label="Completed at" value={formatLocalDate(resumeDetail.latestParseJob.completedAt)} />
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-slate-500">Không có dữ liệu chi tiết.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const DetailRow: React.FC<{
  label: string;
  value: string;
  mono?: boolean;
}> = ({ label, value, mono = false }) => (
  <div className="grid gap-1 sm:grid-cols-[140px_minmax(0,1fr)] sm:items-start">
    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
      {label}
    </span>
    <span className={`break-all text-slate-800 dark:text-slate-100 ${mono ? 'font-mono text-xs' : 'text-sm'}`}>
      {value}
    </span>
  </div>
);

const FilterSelect: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}> = ({ label, value, onChange, options }) => (
  <label className="space-y-2 text-sm font-medium text-slate-700 dark:text-slate-200">
    <span className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
      {label}
    </span>
    <div className="relative">
      <select
        className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 pr-10 text-sm text-slate-900 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400">
        <ChevronRight className="h-4 w-4 rotate-90" />
      </div>
    </div>
  </label>
);
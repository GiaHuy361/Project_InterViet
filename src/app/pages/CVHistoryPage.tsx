import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { ArrowRight, CheckCircle2, FileText, RefreshCw, Search, Sparkles, Upload, Eye } from 'lucide-react';
import { AppPageHeader } from '../components/design-system/AppPageHeader';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import * as resumeService from '../../services/resumeService';
import { getPhase3UserMessage } from '../../lib/api/phase3Errors';

const STATUS_META: Record<string, { label: string; className: string }> = {
  active: { label: 'active', className: 'bg-emerald-100 text-emerald-700 ring-emerald-200' },
  parsed: { label: 'parsed', className: 'bg-blue-100 text-blue-700 ring-blue-200' },
  pending: { label: 'pending', className: 'bg-amber-100 text-amber-700 ring-amber-200' },
  processing: { label: 'pending', className: 'bg-amber-100 text-amber-700 ring-amber-200' },
  queued: { label: 'pending', className: 'bg-amber-100 text-amber-700 ring-amber-200' },
  failed: { label: 'failed', className: 'bg-rose-100 text-rose-700 ring-rose-200' },
};

function normalizeStatus(status?: string | null) {
  return String(status ?? '').trim().toLowerCase();
}

function formatDate(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('vi-VN');
}

export const CVHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [resumes, setResumes] = useState<resumeService.ResumeSummary[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      setResumes(await resumeService.safeGetResumes());
    } catch (err) {
      toast.error(getPhase3UserMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return resumes;
    return resumes.filter((resume) => {
      const haystack = [resume.title, resume.originalFileName, resume.fileName, resume.parseStatus, resume.resumeId]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [query, resumes]);

  return (
    <div className="space-y-6 pb-12">
      <AppPageHeader
        title="Lịch sử CV"
        subtitle="Danh sách CV đã tải lên, đồng bộ cùng style dashboard mới"
        icon={FileText}
        iconGradient="from-blue-500 to-cyan-500"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => void load()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Làm mới
            </Button>
            <Button onClick={() => navigate('/cv-matching/cv')}>
              <Upload className="mr-2 h-4 w-4" />
              Tải CV mới
            </Button>
          </div>
        }
      />

      <Card className="overflow-hidden border-slate-200/80 bg-white/90 p-0 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur">
        <div className="border-b border-slate-200/80 bg-gradient-to-r from-blue-50 via-white to-cyan-50 px-6 py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Resume library</h2>
              <p className="text-sm text-slate-500">Xem nhanh trạng thái từng CV và vào chi tiết khi cần.</p>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 shadow-sm">
              <Search className="h-4 w-4 text-slate-400" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm theo tên CV, file, trạng thái..."
                className="h-8 w-64 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
              />
            </div>
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="space-y-3">
              <div className="h-24 rounded-2xl bg-slate-100" />
              <div className="h-24 rounded-2xl bg-slate-100" />
              <div className="h-24 rounded-2xl bg-slate-100" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-6 py-14 text-center">
              <Sparkles className="mb-3 h-10 w-10 text-slate-300" />
              <h3 className="text-lg font-semibold text-slate-900">
                {resumes.length === 0 ? 'Chưa có CV nào' : 'Không tìm thấy CV phù hợp'}
              </h3>
              <p className="mt-2 max-w-md text-sm text-slate-500">
                {resumes.length === 0
                  ? 'Bạn chưa tải CV nào lên hệ thống. Hãy tải CV đầu tiên để bắt đầu tối ưu.'
                  : 'Thử đổi từ khóa tìm kiếm hoặc xem toàn bộ danh sách CV.'}
              </p>
              <div className="mt-6 flex gap-2">
                <Button variant="outline" onClick={() => setQuery('')}>Xóa bộ lọc</Button>
                <Button onClick={() => navigate('/cv-matching/cv')}>Tải CV mới</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((resume) => {
                const status = normalizeStatus(resume.parseStatus);
                const meta = STATUS_META[status] ?? { label: status || 'unknown', className: 'bg-slate-100 text-slate-700 ring-slate-200' };
                return (
                  <div
                    key={resume.resumeId}
                    className={`rounded-2xl border p-4 transition-all hover:-translate-y-0.5 hover:shadow-md ${resume.isActive ? 'border-emerald-200 bg-emerald-50/60' : 'border-slate-200 bg-white'}`}
                  >
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                      <div className="min-w-0 space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate text-base font-semibold text-slate-900">
                            {resume.title || resume.originalFileName || resume.fileName || resume.resumeId}
                          </h3>
                          {resume.isActive && (
                            <Badge className="rounded-full bg-emerald-600 px-2.5 py-0.5 text-white">active</Badge>
                          )}
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide ring-1 ${meta.className}`}>
                            {meta.label}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            {resume.isActive ? 'CV đang dùng' : 'CV lưu trong hệ thống'}
                          </span>
                          <span className="rounded-full bg-slate-100 px-2.5 py-1">{resume.originalFileName || resume.fileName || 'Không rõ tên file'}</span>
                          <span className="rounded-full bg-slate-100 px-2.5 py-1">{formatDate(resume.createdAt)}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <Button variant="outline" size="sm" className="rounded-xl" onClick={() => navigate('/cv-matching/cv')}>
                          <Eye className="mr-1 h-4 w-4" />
                          Xem chi tiết
                        </Button>
                        <Button variant="outline" size="sm" className="rounded-xl" onClick={() => navigate('/cv-matching/cv')}>
                          <CheckCircle2 className="mr-1 h-4 w-4" />
                          Active
                        </Button>
                        <Button variant="outline" size="sm" className="rounded-xl" onClick={() => navigate('/cv-matching/cv')}>
                          <RefreshCw className="mr-1 h-4 w-4" />
                          Reprocess
                        </Button>
                        <Button variant="outline" size="sm" className="rounded-xl" onClick={() => navigate('/cv-matching/cv')}>
                          <ArrowRight className="mr-1 h-4 w-4" />
                          Mở CV
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

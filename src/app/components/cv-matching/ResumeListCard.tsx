import React from 'react';
import { BadgeInfo, CheckCircle2, Download, Eye, FileUp, RefreshCw, Trash2, CircleCheckBig } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { PageState } from '../phase2/PageState';

interface ResumeListCardProps {
  loading: boolean;
  resumes: Array<{ resumeId: string; title?: string | null; originalFileName?: string | null; fileName?: string | null; isActive?: boolean; parseStatus?: string | null; contentType?: string | null; fileSizeBytes?: number | null }>;
  onSelect: (id: string) => void;
  onSetActive: (id: string) => void;
  onReprocess: (id: string) => void;
  onDownload: (id: string) => void;
  onDelete: (id: string) => void;
  statusLabel: (status?: string | null) => string;
}

export const ResumeListCard: React.FC<ResumeListCardProps> = ({ loading, resumes, onSelect, onSetActive, onReprocess, onDownload, onDelete, statusLabel }) => {
  return (
    <Card className="overflow-hidden border-slate-200 p-0 shadow-sm">
      <div className="border-b border-slate-200 bg-slate-50 px-6 py-4 flex items-center justify-between gap-3">
        <div><h2 className="text-lg font-semibold text-slate-900">Danh sách CV</h2><p className="text-sm text-slate-500">Quản lý CV đã tải lên và thao tác xử lý.</p></div>
        <Badge variant="outline" className="rounded-full px-3 py-1">{resumes.length} CV</Badge>
      </div>
      <div className="p-6">
        <PageState isLoading={loading}>
          <div className="space-y-3">
            {Array.isArray(resumes) && resumes.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center">
                <CircleCheckBig className="mb-3 h-10 w-10 text-slate-300" />
                <p className="text-sm font-medium text-slate-700">Bạn chưa tải lên CV nào.</p>
                <p className="mt-1 text-sm text-slate-500">Hãy tải lên CV đầu tiên để bắt đầu.</p>
              </div>
            ) : Array.isArray(resumes) ? resumes.map((resume) => (
              <div key={resume.resumeId} className={`rounded-2xl border p-4 transition-all hover:shadow-sm ${resume.isActive ? 'border-blue-200 bg-blue-50/40' : 'border-slate-200 bg-white'}`}>
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-base font-semibold text-slate-900">{resume.title || resume.originalFileName || resume.fileName || resume.resumeId}</h3>
                      {resume.isActive && <Badge className="rounded-full bg-blue-600 px-2.5 py-0.5 text-white">Đang dùng</Badge>}
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600">{statusLabel(resume.parseStatus)}</span>
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1"><FileUp className="h-3.5 w-3.5" />{resume.originalFileName || resume.fileName || 'Tệp không xác định'}</span>
                      <span>{resume.contentType || '—'}</span>
                      <span>{resume.fileSizeBytes ? `${Math.round(resume.fileSizeBytes / 1024)} KB` : '—'}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" className="rounded-xl" onClick={() => onSelect(resume.resumeId)}><Eye className="mr-1 h-4 w-4" />Xem</Button>
                    <Button variant="outline" size="sm" className="rounded-xl" onClick={() => onSetActive(resume.resumeId)}><CheckCircle2 className="mr-1 h-4 w-4" />Đặt dùng</Button>
                    <Button variant="outline" size="sm" className="rounded-xl" onClick={() => onReprocess(resume.resumeId)}><RefreshCw className="mr-1 h-4 w-4" />Phân tích lại</Button>
                    <Button variant="outline" size="sm" className="rounded-xl" onClick={() => onDownload(resume.resumeId)}><Download className="mr-1 h-4 w-4" />Tải xuống</Button>
                    <Button variant="destructive" size="sm" className="rounded-xl" onClick={() => onDelete(resume.resumeId)}><Trash2 className="mr-1 h-4 w-4" />Xóa</Button>
                  </div>
                </div>
              </div>
            )) : null}
          </div>
        </PageState>
      </div>
    </Card>
  );
};

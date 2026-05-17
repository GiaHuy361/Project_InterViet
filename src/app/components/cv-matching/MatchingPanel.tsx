import React from 'react';
import { FileSearch } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';

interface MatchingResultBase {
  totalScore?: number | null;
  technicalScore?: number | null;
  experienceScore?: number | null;
  educationScore?: number | null;
  languageScore?: number | null;
  matchBand?: string | null;
  summaryText?: string | null;
  matchedSkillsJson?: string | null;
  missingSkillsJson?: string | null;
  strengthsJson?: string | null;
  weaknessesJson?: string | null;
  suggestionsJson?: string | null;
  jobTitle?: string | null;
  companyName?: string | null;
  targetId?: string;
  id?: string;
  jobDescriptionId?: string;
  completedAt?: string | null;
  createdAt?: string | null;
  status?: string | null;
}

const renderList = (items: string[]) => {
  if (!items.length) return <p>-</p>;
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span key={item} className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-sm ring-1 ring-slate-200">
          {item}
        </span>
      ))}
    </div>
  );
};

const safeParseList = (value?: string | null): string[] => {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map((item) => String(item)) : [];
  } catch {
    return [];
  }
};

interface MatchingDetail {
  sessionId: string;
  sessionType?: string | null;
  status?: string | null;
  requestedAt?: string | null;
  completedAt?: string | null;
  targetCount?: number | null;
  completedCount?: number | null;
  failedCount?: number | null;
  bestScore?: number | null;
  averageScore?: number | null;
  result?: MatchingResultBase | null;
  targets?: MatchingResultBase[] | null;
}

const hasValue = (value?: string | number | null) => value !== null && value !== undefined && value !== '';

interface MatchingPanelProps {
  resumes: Array<{ resumeId: string; title?: string | null; originalFileName?: string | null; isActive?: boolean; parseStatus?: string | null }>;
  jobDescriptions: Array<{ id: string; title?: string | null; companyName?: string | null }>;
  selectedResumeId: string;
  selectedJdId: string;
  matchDetail: MatchingDetail | null;
  onSelectResume: (id: string) => void;
  onSelectJd: (id: string) => void;
  onStartMatch: () => void;
  statusLabel: (status?: string | null) => string;
}

export const MatchingPanel: React.FC<MatchingPanelProps> = ({
  resumes,
  jobDescriptions,
  selectedResumeId,
  selectedJdId,
  matchDetail,
  onSelectResume,
  onSelectJd,
  onStartMatch,
  statusLabel,
}) => {
  return (
    <Card className="overflow-hidden border-slate-200/80 bg-white/90 p-0 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur">
      <div className="border-b border-slate-200/80 bg-gradient-to-r from-sky-50 via-white to-violet-50 px-6 py-5"><h2 className="text-lg font-semibold text-slate-900">JD & Đối sánh</h2><p className="text-sm text-slate-500">Chọn CV, chọn JD và bắt đầu đối sánh.</p></div>
      <div className="space-y-4 p-6">
        <div>
          <label className="block text-lg font-bold tracking-tight text-slate-900">CV</label>
          <select className="mt-2 h-14 w-full rounded-2xl border border-slate-300 bg-white/95 px-5 text-base font-bold text-slate-950 shadow-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100" value={selectedResumeId} onChange={(e) => onSelectResume(e.target.value)}>
            {resumes.map((resume) => (<option key={resume.resumeId} value={resume.resumeId}>{resume.title || resume.originalFileName || resume.resumeId}{resume.isActive ? ' (active)' : ''}</option>))}
          </select>
        </div>
        <div>
          <label className="block text-base font-semibold text-slate-800">Mô tả công việc</label>
          <select className="mt-2 h-12 w-full rounded-2xl border border-slate-300 bg-white/90 px-4 text-[15px] font-semibold text-slate-900 shadow-sm outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100" value={selectedJdId} onChange={(e) => onSelectJd(e.target.value)}>
            <option value="">Chọn mô tả công việc</option>
            {jobDescriptions.map((jd) => <option key={jd.id} value={jd.id}>{jd.title} {jd.companyName ? `- ${jd.companyName}` : ''}</option>)}
          </select>
        </div>
        <div className="flex gap-2"><Button onClick={onStartMatch} className="h-11 w-full rounded-xl shadow-sm"><FileSearch className="mr-2 h-4 w-4" />Bắt đầu đối sánh</Button></div>
        {matchDetail && (
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Trạng thái</p>
                <p className="mt-2 text-base font-semibold text-slate-900">{statusLabel(matchDetail.status)}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Khởi tạo lúc</p>
                <p className="mt-2 text-base font-semibold text-slate-900">{(matchDetail as any).requestedAt ?? '-'}</p>
              </div>
            </div>

            <div className="space-y-4 text-sm text-slate-600">

              {Array.isArray(matchDetail.targets) && matchDetail.targets.map((target) => (
                <div key={target.targetId ?? target.id ?? target.jobDescriptionId} className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-bold text-slate-900">{target.jobTitle || target.companyName || 'Mô tả công việc'}</p>
                    </div>
                    <Badge variant="secondary" className="rounded-full px-3 py-1 text-sm font-semibold">{target.totalScore ?? '-'}</Badge>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    <div className="rounded-2xl bg-white p-4 shadow-sm">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Điểm tổng</p>
                      <p className="mt-2 text-base font-semibold text-slate-900">{target.totalScore ?? '-'}</p>
                    </div>
                    {hasValue(target.completedAt) && (
                      <div className="rounded-2xl bg-white p-4 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Hoàn thành lúc</p>
                        <p className="mt-2 text-base font-semibold text-slate-900">{target.completedAt ?? '-'}</p>
                      </div>
                    )}
                    {hasValue(target.summaryText) && (
                      <div className="rounded-2xl bg-white p-4 shadow-sm xl:col-span-1">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Tóm tắt</p>
                        <p className="mt-2 text-sm leading-6 text-slate-700">{target.summaryText}</p>
                      </div>
                    )}
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    {hasValue(target.technicalScore) && <p><strong>Kỹ năng:</strong> {target.technicalScore}</p>}
                    {hasValue(target.experienceScore) && <p><strong>Kinh nghiệm:</strong> {target.experienceScore}</p>}
                    {hasValue(target.educationScore) && <p><strong>Học vấn:</strong> {target.educationScore}</p>}
                    {hasValue(target.languageScore) && <p><strong>Ngoại ngữ:</strong> {target.languageScore}</p>}
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <p className="mb-2 font-medium text-slate-900">Kỹ năng phù hợp</p>
                      {renderList(safeParseList(target.matchedSkillsJson))}
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <p className="mb-2 font-medium text-slate-900">Kỹ năng còn thiếu</p>
                      {renderList(safeParseList(target.missingSkillsJson))}
                    </div>
                  </div>

                  {(safeParseList(target.strengthsJson).length || safeParseList(target.weaknessesJson).length || safeParseList(target.suggestionsJson).length) && (
                    <div className="grid gap-4 lg:grid-cols-3">
                      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                        <p className="mb-2 font-medium text-emerald-900">Điểm mạnh</p>
                        {safeParseList(target.strengthsJson).length ? safeParseList(target.strengthsJson).map((item) => <p key={item} className="mb-1 text-emerald-900">• {item}</p>) : <p className="text-emerald-700">Chưa có thông tin.</p>}
                      </div>
                      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
                        <p className="mb-2 font-medium text-rose-900">Điểm yếu</p>
                        {safeParseList(target.weaknessesJson).length ? safeParseList(target.weaknessesJson).map((item) => <p key={item} className="mb-1 text-rose-900">• {item}</p>) : <p className="text-rose-700">Chưa có thông tin.</p>}
                      </div>
                      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
                        <p className="mb-2 font-medium text-blue-900">Gợi ý cải thiện</p>
                        {safeParseList(target.suggestionsJson).length ? safeParseList(target.suggestionsJson).map((item) => <p key={item} className="mb-1 text-blue-900">• {item}</p>) : <p className="text-blue-700">Chưa có thông tin.</p>}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

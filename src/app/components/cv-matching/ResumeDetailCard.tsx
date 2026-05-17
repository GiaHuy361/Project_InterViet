import React from 'react';
import { Card } from '../ui/card';

interface ResumeDetailCardProps {
  resumeDetail: {
    title?: string | null;
    originalFileName?: string | null;
    fileName?: string | null;
    fileSizeBytes?: number | null;
    contentType?: string | null;
    createdAt?: string | null;
    uploadedAt?: string | null;
    parsedAt?: string | null;
    parseStatus?: string | null;
    parseConfidenceScore?: number | null;
    isActive?: boolean;
    failedReason?: string | null;
    rawText?: string | null;
    skillsJson?: unknown;
    experiencesJson?: unknown;
    educationsJson?: unknown;
    projectsJson?: unknown;
    certificationsJson?: unknown;
    languagesJson?: unknown;
    warningsJson?: unknown;
  };
  parsedSkills: string[];
  parsedExperiences: unknown[];
  parsedEducations: unknown[];
  parsedProjects: unknown[];
  parsedCertifications: unknown[];
  parsedLanguages: string[];
  parsedWarnings: string[];
  statusLabel: (status?: string | null) => string;
}

const renderList = (items: unknown[]) => {
  if (!items.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item, index) => (
        <span key={`${String(item)}-${index}`} className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-sm ring-1 ring-slate-200">
          {String(item)}
        </span>
      ))}
    </div>
  );
};

const renderBlock = (label: string, items: unknown[], emptyText: string, tone: 'slate' | 'amber' = 'slate') => {
  const hasItems = items.length > 0;
  const toneClass = tone === 'amber' ? 'border-amber-200 bg-amber-50 text-amber-900' : 'border-slate-200 bg-slate-50 text-slate-900';
  const emptyClass = tone === 'amber' ? 'text-amber-700' : 'text-slate-500';
  return (
    <div className={`rounded-2xl border p-4 xl:col-span-3 ${toneClass}`}>
      <div className="mb-2 flex items-center justify-between gap-3">
        <strong>{label}</strong>
        <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-500 ring-1 ring-slate-200">
          {hasItems ? `${items.length} mục` : 'Trống'}
        </span>
      </div>
      {hasItems ? renderList(items) : <p className={`text-sm ${emptyClass}`}>{emptyText}</p>}
    </div>
  );
};

export const ResumeDetailCard: React.FC<ResumeDetailCardProps> = ({
  resumeDetail,
  parsedSkills,
  parsedExperiences,
  parsedEducations,
  parsedProjects,
  parsedCertifications,
  parsedLanguages,
  parsedWarnings,
  statusLabel,
}) => {
  const showStructuredData = Boolean(parsedSkills.length || parsedExperiences.length || parsedEducations.length || parsedProjects.length || parsedCertifications.length || parsedLanguages.length || parsedWarnings.length || resumeDetail.failedReason);

  return (
    <Card className="overflow-hidden border-slate-200 p-0 shadow-sm">
      <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
        <h2 className="text-lg font-semibold text-slate-900">Thông tin CV</h2>
        <p className="text-sm text-slate-500">Dữ liệu CV hiện tại của bạn.</p>
      </div>
      <div className="space-y-6 p-6 text-sm">
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-4 text-amber-900 shadow-sm">
          <p className="mb-2 text-sm font-semibold">Cảnh báo</p>
          {parsedWarnings.length > 0 ? (
            <div className="space-y-1">
              {parsedWarnings.map((warning, index) => (
                <p key={`${warning}-${index}`} className="flex items-start gap-2 text-sm leading-6">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-amber-500" />
                  <span>{warning}</span>
                </p>
              ))}
            </div>
          ) : (
            <p className="text-sm leading-6 text-amber-800">Không có cảnh báo đặc biệt.</p>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-5 shadow-sm"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Trạng thái</p><p className="mt-2 text-base font-semibold text-slate-900">{statusLabel(resumeDetail.parseStatus)}</p></div>
          <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-5 shadow-sm"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Độ tin cậy</p><p className="mt-2 text-base font-semibold text-slate-900">{resumeDetail.parseConfidenceScore ?? '-'}</p></div>
          <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-5 shadow-sm"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Đang dùng</p><p className="mt-2 text-base font-semibold text-slate-900">{resumeDetail.isActive ? 'Có' : 'Không'}</p></div>
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Tên CV</p><p className="mt-2 font-medium text-slate-900">{resumeDetail.title || '-'}</p></div>
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Tên file gốc</p><p className="mt-2 font-medium text-slate-900">{resumeDetail.originalFileName || resumeDetail.fileName || '-'}</p></div>
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Kích thước file</p><p className="mt-2 font-medium text-slate-900">{resumeDetail.fileSizeBytes ? `${Math.round(resumeDetail.fileSizeBytes / 1024)} KB` : '-'}</p></div>
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Loại file</p><p className="mt-2 font-medium text-slate-900">{resumeDetail.contentType || '-'}</p></div>
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Thời điểm tạo</p><p className="mt-2 font-medium text-slate-900">{resumeDetail.createdAt || '-'}</p></div>
        </div>

        {showStructuredData && (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {parsedSkills.length > 0 && renderBlock('Kỹ năng', parsedSkills, 'Chưa có kỹ năng nào được nhận diện.', 'amber')}
            {parsedLanguages.length > 0 && renderBlock('Ngôn ngữ', parsedLanguages, 'Chưa có ngôn ngữ nào được nhận diện.')}
            {parsedExperiences.length > 0 && renderBlock('Kinh nghiệm', parsedExperiences, 'Chưa có kinh nghiệm làm việc được nhận diện.', 'amber')}
            {parsedEducations.length > 0 && renderBlock('Học vấn', parsedEducations, 'Chưa có thông tin học vấn được nhận diện.')}
            {parsedProjects.length > 0 && renderBlock('Dự án', parsedProjects, 'Chưa có dự án nào được nhận diện.', 'amber')}
            {parsedCertifications.length > 0 && renderBlock('Chứng chỉ', parsedCertifications, 'Chưa có chứng chỉ nào được nhận diện.')}
            {resumeDetail.failedReason && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700 xl:col-span-3"><strong>Lý do thất bại:</strong> {resumeDetail.failedReason}</div>}
          </div>
        )}

        {resumeDetail.rawText && (
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-0 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <p className="text-sm font-semibold text-slate-900">Nội dung gốc đã trích xuất</p>
                <p className="text-xs text-slate-500">Dữ liệu gốc AI trích xuất từ CV.</p>
              </div>
            </div>
            <div className="max-h-[420px] overflow-auto p-5">
              <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">{resumeDetail.rawText}</p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

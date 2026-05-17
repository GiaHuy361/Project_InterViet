import React from 'react';
import { Card } from '../ui/card';

interface MatchResultsCardProps {
  matchResults: any[];
}

const formatDate = (value?: string | null) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('vi-VN');
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

const renderChips = (items: string[]) => {
  if (!items.length) return <p className="text-slate-500">Chưa có dữ liệu.</p>;
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span key={item} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200">
          {item}
        </span>
      ))}
    </div>
  );
};

const hasValue = (value?: string | number | null) => value !== null && value !== undefined && value !== '';

const renderText = (value?: string | number | null) => {
  if (!hasValue(value)) return '-';
  return String(value);
};

export const MatchResultsCard: React.FC<MatchResultsCardProps> = ({ matchResults }) => {
  if (!matchResults.length) return null;

  return (
    <Card className="overflow-hidden border-slate-200/80 bg-white/90 p-0 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur">
      <div className="border-b border-slate-200/80 bg-gradient-to-r from-emerald-50 via-white to-cyan-50 px-6 py-5">
        <h2 className="text-lg font-semibold text-slate-900">Kết quả đối sánh</h2>
        <p className="text-sm text-slate-500">Kết quả do backend trả về, không tự tính điểm.</p>
      </div>
      <div className="space-y-4 p-6">
        {matchResults.map((result: any, index) => {
          const strengthItems = safeParseList(result.strengthsJson);
          const weaknessItems = safeParseList(result.weaknessesJson);
          const suggestionItems = safeParseList(result.suggestionsJson);

          return (
            <div key={result.targetId ?? result.id ?? index} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 bg-gradient-to-r from-white to-slate-50 px-5 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold text-slate-900">{result.jobTitle || result.companyName || result.jobDescriptionId || `Mô tả công việc ${index + 1}`}</p>
                    <p className="mt-1 text-sm text-slate-500">{renderText(result.companyName || result.jobDescriptionId || result.status)}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4 p-5 text-sm text-slate-600">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Điểm tổng</p>
                    <p className="mt-2 text-base font-semibold text-slate-900">{renderText(result.totalScore)}</p>
                  </div>
                  {hasValue(result.bestScore) && (
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Điểm cao nhất</p>
                      <p className="mt-2 text-base font-semibold text-slate-900">{renderText(result.bestScore)}</p>
                    </div>
                  )}
                  {hasValue(result.averageScore) && (
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Điểm trung bình</p>
                      <p className="mt-2 text-base font-semibold text-slate-900">{renderText(result.averageScore)}</p>
                    </div>
                  )}
                  {hasValue(result.completedAt ?? result.createdAt) && (
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Hoàn thành lúc</p>
                      <p className="mt-2 text-base font-semibold text-slate-900">{formatDate(result.completedAt ?? result.createdAt)}</p>
                    </div>
                  )}
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  {hasValue(result.technicalScore) && <p><strong>Kỹ năng:</strong> {renderText(result.technicalScore)}</p>}
                  {hasValue(result.experienceScore) && <p><strong>Kinh nghiệm:</strong> {renderText(result.experienceScore)}</p>}
                  {hasValue(result.educationScore) && <p><strong>Học vấn:</strong> {renderText(result.educationScore)}</p>}
                  {hasValue(result.languageScore) && <p><strong>Ngoại ngữ:</strong> {renderText(result.languageScore)}</p>}
                  {hasValue(result.summaryText) && <p className="md:col-span-2"><strong>Tóm tắt:</strong> {renderText(result.summaryText)}</p>}
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="mb-2 font-medium text-slate-900">Kỹ năng phù hợp</p>
                    {renderChips(safeParseList(result.matchedSkillsJson))}
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="mb-2 font-medium text-slate-900">Kỹ năng còn thiếu</p>
                    {renderChips(safeParseList(result.missingSkillsJson))}
                  </div>
                </div>

                {(strengthItems.length > 0 || weaknessItems.length > 0 || suggestionItems.length > 0) && (
                  <div className="grid gap-4 lg:grid-cols-3">
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                      <p className="mb-2 font-medium text-emerald-900">Điểm mạnh</p>
                      {strengthItems.length ? (
                        <div className="space-y-1 text-emerald-900">
                          {strengthItems.map((item) => <p key={item}>• {item}</p>)}
                        </div>
                      ) : <p className="text-emerald-700">Chưa có thông tin.</p>}
                    </div>
                    <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
                      <p className="mb-2 font-medium text-rose-900">Điểm yếu</p>
                      {weaknessItems.length ? (
                        <div className="space-y-1 text-rose-900">
                          {weaknessItems.map((item) => <p key={item}>• {item}</p>)}
                        </div>
                      ) : <p className="text-rose-700">Chưa có thông tin.</p>}
                    </div>
                    <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
                      <p className="mb-2 font-medium text-blue-900">Gợi ý cải thiện</p>
                      {suggestionItems.length ? (
                        <div className="space-y-1 text-blue-900">
                          {suggestionItems.map((item) => <p key={item}>• {item}</p>)}
                        </div>
                      ) : <p className="text-blue-700">Chưa có thông tin.</p>}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

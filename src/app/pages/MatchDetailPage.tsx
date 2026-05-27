import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router';
import { AppPageHeader } from '../components/design-system/AppPageHeader';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { FileText, Target, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { cvMatchService, type MatchSessionDetail, type MatchTarget } from '../../services/cvMatchService';
import { getTimeAgo } from '../utils/time';

function extractList(value?: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.map(String);
  } catch {
    // fall through
  }
  if (typeof value === 'string') {
    return value.split(',').map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

const renderTarget = (target: MatchTarget) => {
  const matched = extractList((target as any).matchedSkillsJson);
  const missing = extractList((target as any).missingSkillsJson);
  const strengths = extractList((target as any).strengthsJson);
  const weaknesses = extractList((target as any).weaknessesJson);

  return (
    <Card key={target.targetId} className="p-5 space-y-3 rounded-lg border">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-lg">{target.jobTitle || 'Không rõ tiêu đề JD'}</p>
          <p className="text-sm text-gray-500">{(target as any).companyName || 'Không rõ công ty'}</p>
        </div>
        <div className="flex-shrink-0">
          <div className="px-3 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 rounded-full text-sm font-medium">{((target.totalScore ?? 0)).toFixed(2)}%</div>
        </div>
      </div>

      {target.summaryText && <p className="text-sm text-gray-700">{target.summaryText}</p>}

      <div className="space-y-2">
        <p className="text-sm font-medium">Kỹ năng phù hợp</p>
        <div className="flex flex-wrap gap-2">
          {matched.length === 0 && <p className="text-sm text-gray-500">Không có dữ liệu</p>}
          {matched.map((s) => (
            <Badge key={s} className="bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300">{s}</Badge>
          ))}
        </div>

        <p className="text-sm font-medium pt-1">Kỹ năng còn thiếu</p>
        <div className="flex flex-wrap gap-2">
          {missing.length === 0 && <p className="text-sm text-gray-500">Không có dữ liệu</p>}
          {missing.map((s) => (
            <Badge key={s} className="bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-300">{s}</Badge>
          ))}
        </div>

        <p className="text-sm font-medium pt-1">Điểm mạnh</p>
        <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
          {strengths.length === 0 && <li>Không có dữ liệu</li>}
          {strengths.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>

        <p className="text-sm font-medium pt-1">Điểm yếu</p>
        <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
          {weaknesses.length === 0 && <li>Không có dữ liệu</li>}
          {weaknesses.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
    </Card>
  );
};

export const MatchDetailPage: React.FC = () => {
  const { sessionId } = useParams();
  const [detail, setDetail] = useState<MatchSessionDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    setLoading(true);
    cvMatchService.getMatchSessionDetail(sessionId)
      .then((res) => {
        if (cancelled) return;
        setDetail(res);
      })
      .catch((err) => {
        console.error(err);
        toast.error('Không tải được chi tiết phiên.');
      })
      .finally(() => setLoading(false));

    return () => { cancelled = true; };
  }, [sessionId]);

  const targets = detail?.targets ?? [];

  return (
    <div className="max-w-6xl mx-auto py-8 space-y-6">
      <AppPageHeader title={`Match ${sessionId ?? ''}`} subtitle="Chi tiết phiên matching" icon={Target} iconGradient="from-emerald-500 to-teal-600" />

      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Session ID</p>
            <p className="font-mono text-sm break-all">{detail?.sessionId ?? sessionId}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Trạng thái</p>
            <p className="font-semibold">{detail?.status ?? 'N/A'}</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-4 gap-3 mt-4">
          <Card className="p-3">
            <p className="text-xs text-gray-500">Số JD</p>
            <p className="font-semibold">{detail?.targetCount ?? 0}</p>
          </Card>
          <Card className="p-3">
            <p className="text-xs text-gray-500">Hoàn thành</p>
            <p className="font-semibold">{detail?.completedCount ?? 0}</p>
          </Card>
          <Card className="p-3">
            <p className="text-xs text-gray-500">Thất bại</p>
            <p className="font-semibold">{detail?.failedCount ?? 0}</p>
          </Card>
          <Card className="p-3">
            <p className="text-xs text-gray-500">Điểm tốt nhất</p>
            <p className="font-semibold">{detail?.bestScore ?? 0}</p>
          </Card>
        </div>

        <div className="mt-3 text-sm text-gray-600">
          <p>Yêu cầu: {detail?.requestedAt ? new Date(detail.requestedAt).toLocaleString('vi-VN') : '-'}</p>
          <p>Hoàn tất: {detail?.completedAt ? new Date(detail.completedAt).toLocaleString('vi-VN') : '-'}</p>
        </div>
      </Card>

      <div className="space-y-4">
        {loading && <Card className="p-4">Đang tải chi tiết...</Card>}
        {!loading && targets.length === 0 && <Card className="p-4">Không có mục nào.</Card>}
        {!loading && targets.map((t) => renderTarget(t))}
      </div>
    </div>
  );
};

export default MatchDetailPage;

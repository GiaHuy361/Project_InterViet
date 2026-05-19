import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { AppPageHeader } from '../components/design-system/AppPageHeader';
import { ApiError } from '../../lib/api/apiError';
import { getStats, type InterviewStatsResponse } from '../../services/interviewService';
import { BarChart3 } from 'lucide-react';

export const InterviewStatsPage: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<InterviewStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getStats();
        setStats(data);
      } catch (err) {
        const apiErr = err instanceof ApiError ? err : null;
        setError(apiErr?.getUserMessage() || 'Không thể tải thống kê.');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <AppPageHeader
        title="Thống kê phỏng vấn"
        subtitle="Tổng quan hiệu suất luyện phỏng vấn"
        icon={BarChart3}
        iconGradient="from-violet-500 to-purple-600"
        actions={<Button onClick={() => navigate('/bao-cao')}>Lịch sử</Button>}
      />

      {loading && <Card className="glass-card p-6">Đang tải thống kê...</Card>}

      {error && (
        <Card className="border-red-200 bg-red-50 text-red-700 p-4">
          <div className="flex items-center justify-between gap-4">
            <span>{error}</span>
            <Button variant="outline" onClick={() => navigate('/bao-cao')}>
              Quay lại
            </Button>
          </div>
        </Card>
      )}

      {!loading && !error && stats && (
        <Card className="p-6">
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center justify-between">
              <span>Total sessions</span>
              <strong>{stats.totalSessions}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span>Completed sessions</span>
              <strong>{stats.completedSessions}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span>Average score</span>
              <strong>{stats.averageScore ?? 'Chưa có dữ liệu'}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span>Best score</span>
              <strong>{stats.bestScore ?? 'Chưa có dữ liệu'}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span>Total answered questions</span>
              <strong>{stats.totalAnsweredQuestions ?? 'Chưa có dữ liệu'}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span>Practice minutes</span>
              <strong>{stats.totalPracticeMinutes ?? 'Chưa có dữ liệu'}</strong>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

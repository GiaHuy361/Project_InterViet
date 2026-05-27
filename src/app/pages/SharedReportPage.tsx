import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { Download, Share2, ShieldAlert } from 'lucide-react';
import { AppPageHeader } from '../components/design-system/AppPageHeader';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { ApiError } from '../../lib/api/apiError';
import { reportShareService, type SharedReportResponse } from '../../services/reportShareService';
import { notifyError } from '../utils/notify';

export const SharedReportPage: React.FC = () => {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<SharedReportResponse | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!token) {
        setError('Thiếu mã chia sẻ báo cáo.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const data = await reportShareService.getSharedReport(token);
        setReport(data);
      } catch {
        setReport(null);
        setError('Không thể tải báo cáo được chia sẻ.');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [token]);

  const handleDownloadPdf = async () => {
    if (!token) return;
    if (!report?.allowPdfDownload) {
      setPdfError('Liên kết này không cho phép tải PDF.');
      return;
    }

    setPdfLoading(true);
    setPdfError(null);
    try {
      const response = await reportShareService.exportSharedReportPdf(token);
      if (!response.ok) {
        throw new Error('Không thể tải PDF');
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `${report?.title || 'shared-report'}.pdf`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      if (error instanceof ApiError && error.status === 403) {
        setPdfError('Liên kết này không cho phép tải PDF.');
        return;
      }
      notifyError('Không thể tải file PDF.');
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <AppPageHeader
        title="Báo cáo được chia sẻ"
        subtitle="Xem báo cáo công khai từ liên kết bảo mật"
        icon={Share2}
        iconGradient="from-cyan-500 to-blue-600"
      />

      {loading ? (
        <Card className="glass-card p-10 text-center">
          <p className="text-sm text-slate-500">Đang tải báo cáo...</p>
        </Card>
      ) : error ? (
        <Card className="glass-card p-8 text-center">
          <ShieldAlert className="mx-auto mb-4 h-14 w-14 text-red-500" />
          <h3 className="mb-2 text-lg font-bold">Không thể mở báo cáo</h3>
          <p className="text-sm text-slate-600">{error}</p>
        </Card>
      ) : report ? (
        <div className="space-y-4">
          <Card className="glass-card p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold">{report.title}</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {report.description || 'Báo cáo được chia sẻ công khai'}
                </p>
              </div>
              {report.allowPdfDownload && (
                <Button onClick={() => void handleDownloadPdf()} disabled={pdfLoading}>
                  <Download className="mr-2 h-4 w-4" />
                  {pdfLoading ? 'Đang tải...' : 'Tải PDF'}
                </Button>
              )}
            </div>
            {pdfError && <p className="text-sm text-red-600 dark:text-red-400">{pdfError}</p>}
          </Card>

          <Card className="glass-card p-6">
            <h3 className="mb-4 font-bold">Tóm tắt</h3>
            <p className="text-sm leading-6 text-slate-700 dark:text-slate-300">
              {report.summary || 'Không có tóm tắt báo cáo.'}
            </p>
          </Card>

          <Card className="glass-card p-6">
            <h3 className="mb-4 font-bold">Thông tin link</h3>
            <div className="grid gap-3 text-sm sm:grid-cols-2">
              <Field label="Loại báo cáo" value={report.reportType} />
              <Field label="Lượt xem" value={String(report.viewCount ?? 0)} />
              <Field label="Ngày tạo" value={report.createdAt ? new Date(report.createdAt).toLocaleString('vi-VN') : '—'} />
              <Field label="Hết hạn" value={report.expiresAt ? new Date(report.expiresAt).toLocaleString('vi-VN') : '—'} />
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  );
};

const Field: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
    <p className="mt-1 break-words text-sm text-slate-800 dark:text-slate-100">{value}</p>
  </div>
);

export default SharedReportPage;

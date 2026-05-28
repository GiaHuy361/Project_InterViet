import React, { useEffect, useState } from 'react';
import { Card } from '../../components/ui/card';
import { Ticket, MessageSquare, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { getSupportDashboardSummary } from '../../../services/supportWorkspaceService';
import type { SupportDashboardSummary } from '../../../lib/api/publicTypes';

export const SupportDashboardPage: React.FC = () => {
  const [summary, setSummary] = useState<SupportDashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSupportDashboardSummary()
      .then(setSummary)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight lg:text-4xl text-gray-900">Support Workspace</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">Tổng quan tình hình tiếp nhận và xử lý yêu cầu hỗ trợ.</p>
        </div>
      </div>
      
      {loading ? (
        <Card className="p-12 text-center text-gray-500">Đang tải số liệu thống kê...</Card>
      ) : !summary ? (
        <Card className="p-12 text-center text-red-500 border-dashed border-2">Lỗi tải dữ liệu. Vui lòng thử lại sau.</Card>
      ) : (
        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Ticket className="text-blue-600" />
              Thống kê Ticket Hỗ trợ (Người dùng)
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <Card className="p-5 border-l-4 border-blue-500 bg-white hover:shadow-md transition-shadow">
                <p className="text-sm font-semibold text-slate-600">Tổng số Ticket</p>
                <p className="text-3xl font-bold mt-2 text-blue-700">{summary.totalTickets}</p>
              </Card>
              <Card className="p-5 border-l-4 border-red-500 bg-red-50/50 hover:shadow-md transition-shadow">
                <p className="text-sm font-semibold text-red-600 flex items-center gap-1"><AlertCircle size={14}/> Mở (Cần xử lý)</p>
                <p className="text-3xl font-bold mt-2 text-red-700">{summary.openTickets}</p>
              </Card>
              <Card className="p-5 border-l-4 border-amber-500 bg-amber-50/50 hover:shadow-md transition-shadow">
                <p className="text-sm font-semibold text-amber-600 flex items-center gap-1"><Clock size={14}/> Đang xử lý</p>
                <p className="text-3xl font-bold mt-2 text-amber-700">{summary.inProgressTickets}</p>
              </Card>
              <Card className="p-5 border-l-4 border-emerald-500 bg-emerald-50/50 hover:shadow-md transition-shadow">
                <p className="text-sm font-semibold text-emerald-600 flex items-center gap-1"><CheckCircle size={14}/> Đã giải quyết</p>
                <p className="text-3xl font-bold mt-2 text-emerald-700">{summary.resolvedTickets}</p>
              </Card>
              <Card className="p-5 border-l-4 border-gray-400 bg-gray-50 hover:shadow-md transition-shadow">
                <p className="text-sm font-semibold text-gray-600">Đã đóng</p>
                <p className="text-3xl font-bold mt-2 text-gray-700">{summary.closedTickets}</p>
              </Card>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <MessageSquare className="text-violet-600" />
              Yêu cầu Liên hệ (Khách vãng lai)
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="p-5 border-t-4 border-violet-500 bg-white hover:shadow-md transition-shadow">
                <p className="text-sm font-semibold text-slate-600">Tổng liên hệ nhận được</p>
                <p className="text-3xl font-bold mt-2 text-violet-700">{summary.totalContactRequests}</p>
              </Card>
              <Card className="p-5 border-t-4 border-orange-500 bg-orange-50/50 hover:shadow-md transition-shadow">
                <p className="text-sm font-semibold text-orange-600 flex items-center gap-1"><AlertCircle size={14}/> Chờ xử lý</p>
                <p className="text-3xl font-bold mt-2 text-orange-700">{summary.pendingContactRequests}</p>
              </Card>
              <Card className="p-5 border-t-4 border-teal-500 bg-teal-50/50 hover:shadow-md transition-shadow">
                <p className="text-sm font-semibold text-teal-600 flex items-center gap-1"><CheckCircle size={14}/> Đã xử lý</p>
                <p className="text-3xl font-bold mt-2 text-teal-700">{summary.processedContactRequests}</p>
              </Card>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default SupportDashboardPage;

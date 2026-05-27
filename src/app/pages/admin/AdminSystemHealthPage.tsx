import React, { useEffect, useState } from 'react';
import { Activity, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { getSystemHealth } from '../../../services/adminContentService';
import type { SystemHealthResponse } from '../../../lib/api/publicTypes';

export const AdminSystemHealthPage: React.FC = () => {
  const [health, setHealth] = useState<SystemHealthResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSystemHealth()
      .then(setHealth)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight lg:text-4xl text-gray-900">System Health Monitor</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">Chẩn đoán tức thời trạng thái kết nối các tài nguyên của hệ thống.</p>
        </div>
        <Button onClick={() => window.location.reload()} variant="outline">
          Làm mới (F5)
        </Button>
      </div>

      {loading ? (
        <Card className="p-12 text-center text-gray-500">Đang tải trạng thái hệ thống...</Card>
      ) : !health ? (
        <Card className="p-12 text-center text-red-500">Lỗi tải dữ liệu. Vui lòng thử lại sau.</Card>
      ) : (
        <Card className="p-6 shadow-sm border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-gray-100">
            <div className="flex items-center gap-4">
              <Activity size={36} className={
                health.status === 'Healthy' ? 'text-green-500' :
                health.status === 'Degraded' ? 'text-yellow-500' :
                'text-red-500'
              } />
              <div>
                <h2 className="text-2xl font-bold">Trạng thái Tổng thể</h2>
                <p className="text-sm text-gray-500">Cập nhật lúc: {new Date(health.timestamp).toLocaleString('vi-VN')}</p>
              </div>
            </div>
            <div className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-bold border-2 ${
              health.status === 'Healthy' ? 'bg-green-50 text-green-700 border-green-200' :
              health.status === 'Degraded' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
              'bg-red-50 text-red-700 border-red-200'
            }`}>
              {health.status === 'Healthy' && <CheckCircle2 size={20} />}
              {health.status === 'Degraded' && <AlertTriangle size={20} />}
              {(health.status === 'Unavailable' || health.status === 'Unhealthy') && <XCircle size={20} />}
              <span className="text-base uppercase tracking-wider">{health.status} SYSTEM</span>
            </div>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-6">
            {Object.entries(health.components).map(([key, comp]) => (
              <div key={key} className={`p-6 border rounded-xl border-l-8 shadow-sm flex items-start gap-4 transition-all hover:shadow-md ${
                comp.status === 'Healthy' ? 'border-l-green-500 bg-white border-gray-100' :
                comp.status === 'Degraded' ? 'border-l-yellow-500 bg-yellow-50/30 border-yellow-100' :
                'border-l-red-500 bg-red-50/30 border-red-100'
              }`}>
                <div className="mt-1 flex-shrink-0">
                  {comp.status === 'Healthy' && <CheckCircle2 size={28} className="text-green-500" />}
                  {comp.status === 'Degraded' && <AlertTriangle size={28} className="text-yellow-500" />}
                  {(comp.status === 'Unavailable' || comp.status === 'Unhealthy') && <XCircle size={28} className="text-red-500" />}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold capitalize text-lg flex items-center justify-between gap-2 mb-2">
                    {key}
                    <span className={`text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full font-bold ${
                      comp.status === 'Healthy' ? 'bg-green-100 text-green-800' :
                      comp.status === 'Degraded' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {comp.status}
                    </span>
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{comp.details}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default AdminSystemHealthPage;

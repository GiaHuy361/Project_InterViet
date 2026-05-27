import React, { useEffect, useState } from 'react';
import { Card } from '../../components/ui/card';
import { getAdminMentorBookings } from '../../../services/adminContentService';
import type { AdminMentorBooking } from '../../../lib/api/publicTypes';

export const AdminMentorBookingsPage: React.FC = () => {
  const [items, setItems] = useState<AdminMentorBooking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAdminMentorBookings().then(setItems).catch(console.error).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight lg:text-4xl text-gray-900">Quản lý Lịch Mentor</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">Theo dõi toàn bộ lịch hẹn Mentor trên toàn hệ thống.</p>
        </div>
      </div>
      
      {loading ? (
        <Card className="p-12 text-center text-gray-500">Đang tải danh sách đặt lịch...</Card>
      ) : (
        <Card className="p-6 shadow-sm border-gray-200">
          <div className="space-y-4">
            {Array.isArray(items) ? items.map(item => (
              <div key={item.bookingId} className="p-5 border rounded-xl flex flex-col sm:flex-row justify-between sm:items-center gap-4 transition-all hover:shadow-md bg-white border-l-4 border-l-blue-500">
                <div>
                  <p className="font-bold text-lg flex items-center flex-wrap gap-2">
                    <span className="text-slate-600 text-sm font-normal">Học viên:</span> 
                    <span className="text-blue-700">{item.candidateEmail}</span> 
                    <span className="text-gray-400">&rarr;</span> 
                    <span className="text-slate-600 text-sm font-normal">Mentor:</span>
                    <span className="text-violet-700">{item.mentorName}</span>
                  </p>
                  <p className="text-sm text-gray-600 mt-2">Dịch vụ: <span className="font-semibold text-gray-900">{item.serviceType}</span> <span className="mx-2 text-gray-300">|</span> Thời gian: <span className="font-semibold text-gray-900">{new Date(item.startsAt).toLocaleString('vi-VN')}</span></p>
                  <p className="text-sm mt-1">Giá trị: <span className="font-bold text-emerald-600">{item.priceAmount.toLocaleString()} {item.currencyCode}</span></p>
                </div>
                <div className="text-right flex flex-row sm:flex-col items-center sm:items-end gap-3">
                  <span className={`text-xs px-3 py-1.5 rounded-full font-bold uppercase tracking-wider ${
                    item.status === 'confirmed' ? 'bg-green-100 text-green-700' : 
                    item.status === 'pending_payment' ? 'bg-yellow-100 text-yellow-700' :
                    item.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {item.status}
                  </span>
                  <span className="text-xs px-3 py-1.5 rounded-full border bg-gray-50 text-gray-700 font-medium shadow-sm">
                    Thanh toán: <span className={item.paymentStatus === 'Paid' ? 'text-green-600 font-bold ml-1' : 'text-yellow-600 font-bold ml-1'}>{item.paymentStatus}</span>
                  </span>
                </div>
              </div>
            )) : null}
            {(!Array.isArray(items) || items.length === 0) && (
              <div className="py-16 text-center text-gray-500 bg-gray-50 border border-dashed border-gray-300 rounded-xl">
                Không có dữ liệu đặt lịch nào.
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

export default AdminMentorBookingsPage;

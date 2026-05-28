import React, { useEffect, useState } from 'react';
import { 
  CalendarDays, 
  Save, 
  Loader2, 
  Plus, 
  Trash2,
  Clock,
  Banknote
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';
import mentorWorkspaceService from '../../../services/mentorWorkspaceService';
import type { MentorAvailabilitySlot, UpdateMentorAvailabilityRequest } from '../../../lib/api/publicTypes';
import { Badge } from '../../components/ui/badge';

export const MentorAvailabilityPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [slots, setSlots] = useState<MentorAvailabilitySlot[]>([]);

  // Helper function to format date as local ISO string without Z (e.g., YYYY-MM-DDTHH:mm:ss)
  const toLocalISOString = (date: Date) => {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:00`;
  };

  // Form State cho Slot Mới
  const [newDate, setNewDate] = useState('');
  const [newStartTime, setNewStartTime] = useState('09:00');
  const [newEndTime, setNewEndTime] = useState('10:00');
  const [newPrice, setNewPrice] = useState<number>(300000);

  const loadAvailability = async () => {
    setLoading(true);
    try {
      const data = await mentorWorkspaceService.getMentorAvailability();
      // Sắp xếp theo thời gian
      const sorted = [...data].sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
      setSlots(sorted);
    } catch (error) {
      toast.error('Không thể tải lịch rảnh.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAvailability();
    // Set default date to tomorrow in local time
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yyyy = tomorrow.getFullYear();
    const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const dd = String(tomorrow.getDate()).padStart(2, '0');
    setNewDate(`${yyyy}-${mm}-${dd}`);
  }, []);

  const handleAddSlot = () => {
    if (!newDate || !newStartTime || !newEndTime) {
      toast.error('Vui lòng chọn đầy đủ Ngày và Giờ.');
      return;
    }

    const [year, month, day] = newDate.split('-').map(Number);
    const [hStart, mStart] = newStartTime.split(':').map(Number);
    const [hEnd, mEnd] = newEndTime.split(':').map(Number);

    const startDateTime = new Date(year, month - 1, day, hStart, mStart);
    const endDateTime = new Date(year, month - 1, day, hEnd, mEnd);

    if (startDateTime >= endDateTime) {
      toast.error('Giờ kết thúc phải sau giờ bắt đầu.');
      return;
    }

    if (startDateTime <= new Date()) {
      toast.error('Chỉ có thể mở lịch cho tương lai.');
      return;
    }

    // Check overlap locally
    const overlap = slots.some(slot => {
      const sStart = new Date(slot.startsAt);
      const sEnd = new Date(slot.endsAt);
      return (startDateTime < sEnd && endDateTime > sStart);
    });

    if (overlap) {
      toast.error('Khung giờ này bị trùng với một khung giờ đã có.');
      return;
    }

    const newSlot: MentorAvailabilitySlot = {
      // Dùng timestamp tạm thời làm ID cho các slot mới chưa lưu
      id: `temp-${Date.now()}`,
      startsAt: startDateTime.toISOString(),
      endsAt: endDateTime.toISOString(),
      status: 'available',
      priceAmount: newPrice,
      currencyCode: 'VND'
    };

    const newSlots = [...slots, newSlot].sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
    setSlots(newSlots);
  };

  const handleRemoveSlot = (slotToRemove: MentorAvailabilitySlot) => {
    if (slotToRemove.status === 'booked' || slotToRemove.status === 'reserved') {
      toast.error('Không thể xóa khung giờ đã có ứng viên đặt.');
      return;
    }
    setSlots(slots.filter(s => s.id !== slotToRemove.id));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Chỉ gửi lên Backend những thông tin cần thiết.
      const payload: UpdateMentorAvailabilityRequest = {
        slots: slots
          .filter(s => s.status === 'available')
          .map(s => ({
            startsAt: s.startsAt,
            endsAt: s.endsAt,
            priceAmount: s.priceAmount,
            currencyCode: s.currencyCode
          }))
      };

      const result = await mentorWorkspaceService.updateMentorAvailability(payload);
      toast.success('Đã lưu cấu hình khung giờ thành công!');
      
      // Reload from server to get correct IDs
      await loadAvailability();
    } catch (error) {
      toast.error('Lưu cấu hình thất bại.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-gray-500 dark:text-slate-400">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
          <p>Đang tải cấu hình lịch...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-gray-100 sticky top-4 z-10">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-200">
            <CalendarDays className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Khung Giờ Trống (Availability)</h1>
            <p className="text-sm text-gray-500 dark:text-slate-400">
              Thiết lập thời gian rảnh để ứng viên có thể đặt lịch hẹn
            </p>
          </div>
        </div>
        
        <Button onClick={handleSave} disabled={saving} className="rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white shadow-md shadow-cyan-200">
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Lưu cấu hình
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column - Add new slot */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-4 flex items-center gap-2">
              <Plus className="h-5 w-5 text-cyan-600 dark:text-cyan-400" /> Thêm khung giờ
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Ngày diễn ra</label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 p-2.5 text-sm focus:border-cyan-500 focus:bg-white dark:bg-slate-900 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Giờ bắt đầu</label>
                  <input
                    type="time"
                    value={newStartTime}
                    onChange={(e) => setNewStartTime(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 p-2.5 text-sm focus:border-cyan-500 focus:bg-white dark:bg-slate-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Giờ kết thúc</label>
                  <input
                    type="time"
                    value={newEndTime}
                    onChange={(e) => setNewEndTime(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 p-2.5 text-sm focus:border-cyan-500 focus:bg-white dark:bg-slate-900 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Mức phí (VND)</label>
                <div className="relative">
                  <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="number"
                    min={0}
                    step={10000}
                    value={newPrice}
                    onChange={(e) => setNewPrice(Number(e.target.value))}
                    className="w-full rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 p-2.5 pl-9 text-sm focus:border-cyan-500 focus:bg-white dark:bg-slate-900 focus:outline-none"
                  />
                </div>
              </div>
              <Button onClick={handleAddSlot} className="w-full bg-cyan-50 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 hover:bg-cyan-100 dark:bg-cyan-900/40 border border-cyan-200 dark:border-cyan-800 mt-2">
                Thêm vào danh sách
              </Button>
            </div>
            
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-xl border border-blue-100 dark:border-blue-800/50 text-sm text-blue-800 dark:text-blue-300">
              <strong>Lưu ý:</strong> Thay đổi chỉ có hiệu lực sau khi bấm <strong>"Lưu cấu hình"</strong> ở góc phải trên. Hệ thống sẽ tự động bỏ qua việc xóa những khung giờ đã có người đặt.
            </div>
          </div>
        </div>

        {/* Right Column - List of slots */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-2">Danh sách Khung giờ</h2>
          {slots.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center rounded-3xl border border-dashed border-gray-300 bg-gray-50 dark:bg-slate-950 text-center">
              <CalendarDays className="mb-2 h-8 w-8 text-gray-400" />
              <p className="text-sm font-medium text-gray-600 dark:text-slate-400">Bạn chưa thiết lập khung giờ nào.</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {slots.map((slot, index) => {
                const dateObj = new Date(slot.startsAt);
                const isBooked = slot.status === 'booked' || slot.status === 'reserved';
                return (
                  <div key={slot.id || index} className={`flex items-center justify-between p-4 rounded-2xl border ${isBooked ? 'bg-gray-50 dark:bg-slate-950 border-gray-200 dark:border-slate-800' : 'bg-white dark:bg-slate-900 border-gray-100 shadow-sm'} transition-all`}>
                    <div className="flex items-center gap-4">
                      <div className={`flex flex-col items-center justify-center h-12 w-12 rounded-xl ${isBooked ? 'bg-gray-200 text-gray-600 dark:text-slate-400' : 'bg-cyan-50 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400'}`}>
                        <span className="text-xs font-bold uppercase">{dateObj.toLocaleDateString('vi-VN', { month: 'short' })}</span>
                        <span className="text-lg font-black leading-none">{dateObj.getDate()}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span className="font-semibold text-gray-900 dark:text-slate-100">
                            {new Date(slot.startsAt).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})} 
                            {' - '} 
                            {new Date(slot.endsAt).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-sm text-gray-500 dark:text-slate-400">
                          <Banknote className="h-4 w-4" />
                          {new Intl.NumberFormat('vi-VN').format(slot.priceAmount)} {slot.currencyCode}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      {isBooked ? (
                        <Badge variant="secondary" className="bg-gray-200 text-gray-700 dark:text-slate-300 pointer-events-none">Đã có người đặt</Badge>
                      ) : (
                        <Badge variant="outline" className="text-cyan-600 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800 bg-cyan-50 dark:bg-cyan-900/30 pointer-events-none">Còn trống</Badge>
                      )}
                      
                      <button
                        onClick={() => handleRemoveSlot(slot)}
                        disabled={isBooked}
                        className={`p-2 rounded-lg transition-colors ${isBooked ? 'text-gray-300 cursor-not-allowed' : 'text-red-400 hover:bg-red-50 dark:bg-red-900/30 hover:text-red-600 dark:text-red-400'}`}
                        title={isBooked ? "Không thể xóa giờ đã đặt" : "Xóa khung giờ"}
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MentorAvailabilityPage;

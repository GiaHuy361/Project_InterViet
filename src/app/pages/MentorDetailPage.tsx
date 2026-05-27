import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, CalendarDays, CheckCircle2, Clock3, Star, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import { AppPageHeader } from '../components/design-system/AppPageHeader';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Input } from '../components/ui/input';
import { ApiError } from '../../lib/api/apiError';
import mentorService, { type MentorAvailabilitySlot, type MentorDetail } from '../../services/mentorService';

export const MentorDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [mentor, setMentor] = useState<MentorDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [serviceType, setServiceType] = useState('mock_interview');
  const [candidateNotes, setCandidateNotes] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);

  const availableSlots = useMemo(
    () => mentor?.availabilitySlots.filter((slot) => slot.status === 'available') ?? [],
    [mentor]
  );

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!id) {
        setError('Thiếu mã mentor.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const response = await mentorService.getMentorDetail(id);
        if (!mounted) return;
        setMentor(response);
        setServiceType(response.specialties[0]?.code || 'mock_interview');
        setSelectedSlotId(response.availabilitySlots.find((slot) => slot.status === 'available')?.id || '');
        setCandidateNotes(
          `Tôi muốn ${response.specialties[0]?.name || 'được tư vấn'} và cần mentor hỗ trợ cho mục tiêu nghề nghiệp hiện tại.`
        );
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof ApiError ? err.getUserMessage() : 'Không thể tải thông tin mentor.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void load();
    return () => {
      mounted = false;
    };
  }, [id]);

  const handleBook = async () => {
    if (!mentor || !selectedSlotId) {
      toast.error('Vui lòng chọn slot trống.');
      return;
    }

    setBookingLoading(true);
    try {
      const response = await mentorService.bookMentor({
        slotId: selectedSlotId,
        serviceType,
        candidateNotes: candidateNotes.trim(),
      });

      const selectedSlot = mentor.availabilitySlots.find((slot) => slot.id === selectedSlotId);
      const checkoutSession = {
        checkoutSessionId: response.checkoutSessionId,
        checkoutUrl: response.checkoutUrl,
        status: response.status,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        provider: 'vnpay',
        planKey: serviceType,
        contextType: 'mentor_booking' as const,
        amount: response.amount,
        currencyCode: response.currencyCode,
        paymentInstructionsUrl: response.paymentInstructionsUrl,
        bookingId: response.bookingId,
      };

      toast.success('Đã giữ chỗ slot mentor. Chuyển sang checkout mock...');
      setBookingOpen(false);
      navigate(`/checkout/mock/${response.checkoutSessionId}`, {
        replace: true,
        state: { checkoutSession, bookingId: response.bookingId, slot: selectedSlot },
      });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.getUserMessage() : 'Không thể đặt lịch mentor.');
    } finally {
      setBookingLoading(false);
    }
  };

  const slotSummary = (slot: MentorAvailabilitySlot) => `${new Date(slot.startsAt).toLocaleString('vi-VN')} - ${new Date(slot.endsAt).toLocaleTimeString('vi-VN')}`;

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-12">
      <Button variant="ghost" className="-ml-2" onClick={() => navigate('/network')}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Quay lại danh bạ
      </Button>

      {loading ? (
        <Card className="p-8 text-center text-sm text-gray-500">Đang tải thông tin mentor...</Card>
      ) : error ? (
        <Card className="border-red-200 bg-red-50 p-6 text-red-700">{error}</Card>
      ) : mentor ? (
        <>
          <AppPageHeader
            title="Xem chi tiết Mentor & Slot trống"
            subtitle={mentor.headline || mentor.fullName}
            icon={UserRound}
            iconGradient="from-blue-500 to-violet-600"
            actions={
              <Button variant="outline" onClick={() => navigate('/mentor-bookings')}>
                <CalendarDays className="mr-2 h-4 w-4" />
                Lịch hẹn của tôi
              </Button>
            }
          />

          <Card className="p-6">
            <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
              <div className="space-y-4">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">{mentor.fullName}</h2>
                  <p className="mt-1 text-gray-600">{mentor.headline || 'Mentor'}</p>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                  <span className="inline-flex items-center gap-1">
                    <Star className="h-4 w-4 text-amber-500" />
                    {mentor.ratingAverage.toFixed(2)} ({mentor.ratingCount})
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock3 className="h-4 w-4" />
                    {mentor.yearsOfExperience ?? 0} năm kinh nghiệm
                  </span>
                </div>
                <p className="max-w-3xl text-sm leading-6 text-gray-600">{mentor.bio || 'Chưa có mô tả.'}</p>
                <div className="flex flex-wrap gap-2">
                  {mentor.specialties.map((specialty) => (
                    <Badge key={specialty.code} variant="secondary" className="rounded-full">
                      {specialty.name}
                    </Badge>
                  ))}
                </div>
                
                {/* Additional Tags (Expertise, Industries, Languages) */}
                {(mentor.expertise?.length || 0) > 0 && (
                  <div className="mt-4">
                    <p className="text-xs font-semibold uppercase text-gray-500 mb-2">Chuyên môn (Expertise)</p>
                    <div className="flex flex-wrap gap-2">
                      {mentor.expertise!.map(e => <Badge key={e} variant="outline" className="text-cyan-700 bg-cyan-50 border-cyan-200">{e}</Badge>)}
                    </div>
                  </div>
                )}
                {(mentor.industries?.length || 0) > 0 && (
                  <div className="mt-4">
                    <p className="text-xs font-semibold uppercase text-gray-500 mb-2">Ngành nghề (Industries)</p>
                    <div className="flex flex-wrap gap-2">
                      {mentor.industries!.map(i => <Badge key={i} variant="outline" className="text-purple-700 bg-purple-50 border-purple-200">{i}</Badge>)}
                    </div>
                  </div>
                )}
                {(mentor.languages?.length || 0) > 0 && (
                  <div className="mt-4">
                    <p className="text-xs font-semibold uppercase text-gray-500 mb-2">Ngôn ngữ (Languages)</p>
                    <div className="flex flex-wrap gap-2">
                      {mentor.languages!.map(l => <Badge key={l} variant="outline" className="text-blue-700 bg-blue-50 border-blue-200">{l}</Badge>)}
                    </div>
                  </div>
                )}
              </div>
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 md:min-w-72">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Thông tin</p>
                <div className="mt-3 space-y-2 text-sm text-gray-700">
                  <p className="flex items-center gap-2"><UserRound className="h-4 w-4" /> {mentor.fullName}</p>
                  <p className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> {availableSlots.length} slot trống</p>
                  <p className="flex items-center gap-2"><Clock3 className="h-4 w-4" /> {mentor.ratingCount} đánh giá</p>
                </div>
              </div>
            </div>
          </Card>

          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <Card className="p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Slot trống trong tương lai</h3>
                  <p className="text-sm text-gray-500">Chỉ hiển thị slot available, chưa hết hạn.</p>
                </div>
                <Badge variant="outline">{availableSlots.length} slots</Badge>
              </div>

              <div className="space-y-3">
                {availableSlots.length ? availableSlots.map((slot) => {
                  const active = selectedSlotId === slot.id;
                  return (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => setSelectedSlotId(slot.id)}
                      className={`w-full rounded-2xl border p-4 text-left transition-all ${active ? 'border-blue-300 bg-blue-50 shadow-sm' : 'border-gray-200 bg-white hover:border-gray-300'}`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-gray-900">{slotSummary(slot)}</p>
                          <p className="mt-1 text-sm text-gray-500">Trạng thái: {slot.status}</p>
                        </div>
                        <Badge variant="outline" className="rounded-full">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: slot.currencyCode, maximumFractionDigits: 0 }).format(slot.priceAmount)}</Badge>
                      </div>
                    </button>
                  );
                }) : (
                  <div className="rounded-2xl border border-dashed border-gray-200 p-6 text-center text-sm text-gray-500">
                    Mentor chưa có slot trống khả dụng.
                  </div>
                )}
              </div>
            </Card>

            <Card className="space-y-4 p-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Đặt lịch hẹn cố vấn</h3>
                <p className="text-sm text-gray-500">Giữ chỗ slot trong 30 phút và mở checkout mock.</p>
              </div>

              <div className="space-y-2">
                <Label>Loại dịch vụ</Label>
                <Select value={serviceType} onValueChange={setServiceType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn dịch vụ" />
                  </SelectTrigger>
                  <SelectContent>
                    {mentor.specialties.map((specialty) => (
                      <SelectItem key={specialty.code} value={specialty.code}>
                        {specialty.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Slot được chọn</Label>
                <Input value={selectedSlotId ? slotSummary(availableSlots.find(s => s.id === selectedSlotId)!) : ''} readOnly placeholder="Chọn slot bên trái" />
              </div>

              <div className="space-y-2">
                <Label>Ghi chú cho mentor</Label>
                <Textarea rows={5} value={candidateNotes} onChange={(event) => setCandidateNotes(event.target.value)} />
              </div>

              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                <p className="font-semibold">Quy trình</p>
                <p className="mt-1">Backend sẽ giữ slot, tạo booking pending_payment, rồi mở checkout mock dùng chung cho thanh toán.</p>
              </div>

              <Button onClick={() => setBookingOpen(true)} disabled={!selectedSlotId} className="w-full">
                Đặt lịch & chuyển sang thanh toán
              </Button>
            </Card>
          </div>

          <Dialog open={bookingOpen} onOpenChange={setBookingOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Xác nhận đặt lịch mentor</DialogTitle>
                <DialogDescription>
                  Đơn đặt lịch sẽ giữ slot trong 30 phút và mở checkout mock.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 text-sm text-gray-600">
                <p>Mentor: <span className="font-medium text-gray-900">{mentor.fullName}</span></p>
                <p>Dịch vụ: <span className="font-medium text-gray-900">{serviceType}</span></p>
                <p>Slot: <span className="font-medium text-gray-900">{slotSummary(availableSlots.find(s => s.id === selectedSlotId)!) || '—'}</span></p>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setBookingOpen(false)}>Hủy</Button>
                <Button onClick={() => void handleBook()} disabled={bookingLoading || !selectedSlotId}>
                  {bookingLoading ? 'Đang đặt lịch...' : 'Xác nhận & thanh toán'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      ) : null}
    </div>
  );
};

export default MentorDetailPage;

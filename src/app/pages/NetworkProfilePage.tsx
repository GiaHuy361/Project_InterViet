import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { 
  ArrowLeft, Star, MapPin, Briefcase, Calendar,
  CheckCircle, Video, MessageSquare, Award
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';

export const NetworkProfilePage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Modal states
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);

  // Booking form
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [bookingType, setBookingType] = useState('online');
  const [bookingNote, setBookingNote] = useState('');

  // Message form
  const [messageContent, setMessageContent] = useState('');

  // Mock profile data
  const profile = {
    name: 'Trần Thị Hương',
    role: 'Software Engineer',
    company: 'Google',
    location: 'Singapore',
    rating: 5.0,
    reviews: 89,
    yearsExperience: 12,
    specialties: ['Career Coaching', 'System Design', 'Frontend', 'Technical Interview'],
    bio: 'Có 12 năm kinh nghiệm trong ngành công nghệ, từng làm việc tại Google, Meta. Chuyên coaching và mentoring cho các kỹ sư muốn phát triển sự nghiệp, đặc biệt là các bạn muốn chuyển sang FAANG.',
    achievements: [
      'Giúp 50+ engineer chuyển sang FAANG thành công',
      'Ex-Google, Ex-Meta Software Engineer',
      'Speaker tại Vietnam Tech Career Summit 2025'
    ],
    availability: [
      { day: 'Thứ 2 - Thứ 6', time: '18:00 - 21:00' },
      { day: 'Thứ 7', time: '09:00 - 17:00' }
    ]
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back Button */}
      <Button variant="outline" onClick={() => navigate('/network')}>
        <ArrowLeft className="mr-2" size={16} />
        Quay lại danh sách
      </Button>

      {/* Profile Header */}
      <Card className="p-8">
        <div className="flex items-start gap-6">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-bold flex-shrink-0">
            NVM
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">{profile.name}</h1>
            <p className="text-xl text-gray-600 mb-3">{profile.role}</p>
            <div className="flex items-center gap-4 text-gray-600 mb-4">
              <span className="flex items-center gap-2">
                <Briefcase size={16} />
                {profile.company}
              </span>
              <span className="flex items-center gap-2">
                <MapPin size={16} />
                {profile.location}
              </span>
              <span className="flex items-center gap-2">
                <Calendar size={16} />
                {profile.yearsExperience} năm kinh nghiệm
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                <span className="font-bold text-lg">{profile.rating}</span>
                <span className="text-gray-500">({profile.reviews} đánh giá)</span>
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-700">
                Sẵn sàng
              </Badge>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Button onClick={() => setShowBookingModal(true)}>
              <Video className="mr-2" size={16} />
              Đặt lịch gặp
            </Button>
            <Button variant="outline" onClick={() => setShowMessageModal(true)}>
              <MessageSquare className="mr-2" size={16} />
              Nhắn tin
            </Button>
          </div>
        </div>
      </Card>

      {/* About */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Giới thiệu</h2>
        <p className="text-gray-700 leading-relaxed">{profile.bio}</p>
      </Card>

      {/* Specialties */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Chuyên môn</h2>
        <div className="flex flex-wrap gap-2">
          {profile.specialties.map((specialty, idx) => (
            <Badge key={idx} variant="secondary" className="px-4 py-2">
              {specialty}
            </Badge>
          ))}
        </div>
      </Card>

      {/* Achievements */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Thành tựu</h2>
        <div className="space-y-3">
          {profile.achievements.map((achievement, idx) => (
            <div key={idx} className="flex items-start gap-3">
              <Award className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-gray-700">{achievement}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Availability */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Lịch trống</h2>
        <div className="space-y-2">
          {profile.availability.map((slot, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="font-medium">{slot.day}</span>
              <span className="text-gray-600">{slot.time}</span>
            </div>
          ))}
        </div>
        <Button className="w-full mt-4" onClick={() => setShowBookingModal(true)}>
          Đặt lịch ngay
        </Button>
      </Card>

      {/* Booking Modal */}
      <Dialog open={showBookingModal} onOpenChange={setShowBookingModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Đặt lịch gặp</DialogTitle>
            <DialogDescription>
              Hãy chọn ngày và thời gian bạn muốn gặp {profile.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="date">Ngày</Label>
              <Input
                id="date"
                type="date"
                value={bookingDate}
                onChange={(e) => setBookingDate(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Thời gian</Label>
              <Input
                id="time"
                type="time"
                value={bookingTime}
                onChange={(e) => setBookingTime(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Loại cuộc họp</Label>
              <Select
                value={bookingType}
                onValueChange={(value) => setBookingType(value)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Chọn loại cuộc họp" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="online">Trực tuyến</SelectItem>
                  <SelectItem value="offline">Tại chỗ</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="note">Ghi chú</Label>
              <Textarea
                id="note"
                value={bookingNote}
                onChange={(e) => setBookingNote(e.target.value)}
                placeholder="Nhập nội dung bạn muốn trao đổi..."
                className="col-span-3 min-h-[100px]"
              />
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowBookingModal(false)}
            >
              Hủy bỏ
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (!bookingDate || !bookingTime) {
                  toast.error('Vui lòng chọn ngày và giờ');
                  return;
                }
                toast.success(`Đã đặt lịch với ${profile.name}! Bạn sẽ nhận được email xác nhận.`);
                setShowBookingModal(false);
                setBookingDate('');
                setBookingTime('');
                setBookingType('online');
                setBookingNote('');
              }}
            >
              Đặt lịch
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Message Modal */}
      <Dialog open={showMessageModal} onOpenChange={setShowMessageModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Nhắn tin</DialogTitle>
            <DialogDescription>
              Gửi tin nhắn đến {profile.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="message">Tin nhắn</Label>
              <Textarea
                id="message"
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                placeholder={`Xin chào ${profile.name},\n\nTôi rất muốn được mentoring và học hỏi kinh nghiệm từ bạn về ${profile.specialties[0]}. Tôi đang muốn phát triển sự nghiệp trong lĩnh vực này.\n\nTôi muốn tìm hiểu thêm về cách bạn có thể giúp tôi.\n\nTrân trọng,`}
                className="min-h-[150px]"
              />
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowMessageModal(false)}
            >
              Hủy bỏ
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (!messageContent.trim()) {
                  toast.error('Vui lòng nhập nội dung tin nhắn');
                  return;
                }
                toast.success(`Đã gửi tin nhắn đến ${profile.name}!`);
                setShowMessageModal(false);
                setMessageContent('');
              }}
            >
              Gửi tin nhắn
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
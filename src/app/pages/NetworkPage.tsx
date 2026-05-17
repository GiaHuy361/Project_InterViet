import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { useApp } from '../contexts/AppContext';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import {
  Users, Search, Star, MapPin, Briefcase, Calendar,
  MessageSquare, Video, CheckCircle, Filter
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';

interface NetworkProfile {
  id: string;
  name: string;
  role: 'mentor' | 'mock_interviewer';
  company?: string;
  position: string;
  location: string;
  rating: number;
  reviews: number;
  hourlyRate?: number;
  specialties: string[];
  availability: 'available' | 'busy' | 'offline';
  avatar: string;
  bio: string;
  yearsExperience: number;
}

export const NetworkPage: React.FC = () => {
  const { state } = useApp();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [selectedProfile, setSelectedProfile] = useState<NetworkProfile | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);

  // Booking form
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [bookingType, setBookingType] = useState('online');
  const [bookingNote, setBookingNote] = useState('');

  const isPremium = state.user?.role === 'premium' || state.user?.role === 'trial';

  // Mock data - network profiles
  const mockProfiles: NetworkProfile[] = [
    {
      id: '2',
      name: 'Trần Thị Hương',
      role: 'mentor',
      company: 'Google',
      position: 'Software Engineer',
      location: 'Singapore',
      rating: 5.0,
      reviews: 89,
      hourlyRate: 500000,
      specialties: ['Career Coaching', 'System Design', 'Frontend'],
      availability: 'busy',
      avatar: 'TTH',
      bio: 'Giúp 50+ engineer chuyển sang FAANG. Chuyên coaching phỏng vấn kỹ thuật',
      yearsExperience: 12
    },
    {
      id: '3',
      name: 'Phạm Quốc Dũng',
      role: 'mock_interviewer',
      company: 'Shopee',
      position: 'Engineering Manager',
      location: 'Hà Nội',
      rating: 4.8,
      reviews: 234,
      hourlyRate: 300000,
      specialties: ['Behavioral Interview', 'Leadership', 'System Design'],
      availability: 'available',
      avatar: 'PQD',
      bio: 'Đã phỏng vấn với hơn 500 ứng viên. Chuyên luyện phỏng vấn hành vi & quản lý',
      yearsExperience: 10
    },
    {
      id: '5',
      name: 'Hoàng Minh Tuấn',
      role: 'mock_interviewer',
      company: 'Grab',
      position: 'Principal Engineer',
      location: 'TP. Hồ Chí Minh',
      rating: 5.0,
      reviews: 67,
      hourlyRate: 600000,
      specialties: ['Technical Interview', 'Data Structures', 'Algorithms'],
      availability: 'offline',
      avatar: 'HMT',
      bio: 'Ex-Google, ex-Meta. Chuyên luyện coding interview & DSA',
      yearsExperience: 15
    },
    {
      id: '6',
      name: 'Đỗ Thị Lan',
      role: 'mentor',
      company: 'Tiki',
      position: 'Product Manager',
      location: 'Hà Nội',
      rating: 4.9,
      reviews: 103,
      hourlyRate: 400000,
      specialties: ['Product Management', 'Career Switch', 'Resume Review'],
      availability: 'available',
      avatar: 'DTL',
      bio: 'Giúp 30+ người chuyển ngành sang PM. Chuyên hướng nghiệp & CV review',
      yearsExperience: 7
    }
  ];

  const roleLabels: Record<string, string> = {
    mentor: 'Mentor',
    mock_interviewer: 'Mock Interviewer'
  };

  const roleColors: Record<string, string> = {
    mentor: 'bg-purple-100 text-purple-700',
    mock_interviewer: 'bg-green-100 text-green-700'
  };

  const availabilityLabels: Record<string, string> = {
    available: 'Sẵn sàng',
    busy: 'Bận',
    offline: 'Offline'
  };

  const availabilityColors: Record<string, string> = {
    available: 'bg-green-500',
    busy: 'bg-yellow-500',
    offline: 'bg-gray-400'
  };

  const filteredProfiles = mockProfiles.filter(profile => {
    const matchSearch = profile.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       profile.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       profile.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       profile.specialties.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchRole = filterRole === 'all' || profile.role === filterRole;
    
    return matchSearch && matchRole;
  });

  const handleConnect = (profile: NetworkProfile) => {
    if (!isPremium) {
      navigate('/goi-dich-vu');
      return;
    }

    setSelectedProfile(profile);
    setBookingNote(`Tôi muốn ${profile.role === 'mentor' ? 'được mentoring về career path và kỹ năng' : 'luyện phỏng vấn'} cho vị trí ${profile.specialties[0]}.`);
    setShowBookingModal(true);
  };

  const handleSubmitBooking = () => {
    if (!bookingDate || !bookingTime) {
      toast.error('Vui lòng chọn ngày và giờ');
      return;
    }

    toast.success(`Đã đặt lịch với ${selectedProfile?.name}! Bạn sẽ nhận được email xác nhận.`);
    setShowBookingModal(false);

    // Reset form
    setBookingDate('');
    setBookingTime('');
    setBookingType('online');
    setBookingNote('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Kết nối với chuyên gia</h1>
        <p className="text-gray-600">
          Luyện phỏng vấn với người thật, kết nối với mentor và chuyên gia trong ngành
        </p>
      </div>

      {/* Premium Banner */}
      {!isPremium && (
        <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold mb-1">Tính năng Premium</h3>
                <p className="text-sm text-gray-600">
                  Nâng cấp để kết nối trực tiếp với chuyên gia và đặt lịch mock interview
                </p>
              </div>
            </div>
            <Button onClick={() => navigate('/goi-dich-vu')}>
              Nâng cấp ngay
            </Button>
          </div>
        </Card>
      )}

      {/* Search & Filter */}
      <Card className="p-6">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Tìm theo tên, công ty, kỹ năng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-500" />
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tất cả vai trò</option>
              <option value="mentor">Mentor</option>
              <option value="mock_interviewer">Mock Interviewer</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">
                {mockProfiles.filter(p => p.role === 'mentor').length}
              </div>
              <div className="text-sm text-gray-600">Mentor</div>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Video className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">
                {mockProfiles.filter(p => p.role === 'mock_interviewer').length}
              </div>
              <div className="text-sm text-gray-600">Mock Interviewer</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Results */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">
            {filteredProfiles.length} chuyên gia
          </h2>
        </div>

        {filteredProfiles.length === 0 ? (
          <Card className="p-12 text-center">
            <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Không tìm thấy kết quả</h3>
            <p className="text-gray-600">Thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm</p>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {filteredProfiles.map(profile => (
              <Card key={profile.id} className="p-6 hover:shadow-lg transition-shadow">
                {/* Header */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                    {profile.avatar}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-1">
                      <div>
                        <h3 className="font-bold text-lg">{profile.name}</h3>
                        <p className="text-sm text-gray-600">{profile.position}</p>
                      </div>
                      <div className={`w-3 h-3 rounded-full ${availabilityColors[profile.availability]}`} title={availabilityLabels[profile.availability]} />
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                      <Briefcase size={14} />
                      <span>{profile.company}</span>
                      <span>•</span>
                      <MapPin size={14} />
                      <span>{profile.location}</span>
                    </div>
                  </div>
                </div>

                {/* Role Badge */}
                <div className="flex items-center gap-2 mb-3">
                  <Badge className={roleColors[profile.role]}>
                    {roleLabels[profile.role]}
                  </Badge>
                  <div className="flex items-center gap-1 text-sm">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold">{profile.rating}</span>
                    <span className="text-gray-500">({profile.reviews} đánh giá)</span>
                  </div>
                </div>

                {/* Bio */}
                <p className="text-sm text-gray-700 mb-3">{profile.bio}</p>

                {/* Specialties */}
                <div className="mb-4">
                  <div className="flex flex-wrap gap-2">
                    {profile.specialties.map((specialty, idx) => (
                      <span 
                        key={idx}
                        className="px-2 py-1 bg-gray-100 text-xs rounded-full text-gray-700"
                      >
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="text-sm">
                    {profile.hourlyRate && (
                      <div className="font-semibold text-blue-600">
                        {profile.hourlyRate.toLocaleString('vi-VN')}₫/giờ
                      </div>
                    )}
                    <div className="text-gray-500">
                      {profile.yearsExperience} năm kinh nghiệm
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => navigate(`/network/${profile.id}`)}
                    >
                      Xem chi tiết
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleConnect(profile)}
                      disabled={!isPremium}
                    >
                      Đặt lịch
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Booking Modal (for Mentor & Mock Interviewer) */}
      <Dialog open={showBookingModal} onOpenChange={setShowBookingModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Đặt lịch với {selectedProfile?.name}</DialogTitle>
            <DialogDescription>
              {selectedProfile?.role === 'mentor' ? 'Mentoring Session' : 'Mock Interview Session'}
              {selectedProfile?.hourlyRate && (
                <span className="ml-2 font-semibold text-blue-600">
                  - {selectedProfile.hourlyRate.toLocaleString('vi-VN')}₫/giờ
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Ngày *</Label>
                <Input
                  type="date"
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div>
                <Label>Giờ *</Label>
                <Input
                  type="time"
                  value={bookingTime}
                  onChange={(e) => setBookingTime(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label>Hình thức</Label>
              <Select value={bookingType} onValueChange={setBookingType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="online">Online (Google Meet/Zoom)</SelectItem>
                  <SelectItem value="phone">Qua điện thoại</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Nội dung cần tư vấn/luyện tập *</Label>
              <Textarea
                value={bookingNote}
                onChange={(e) => setBookingNote(e.target.value)}
                placeholder={selectedProfile?.role === 'mentor'
                  ? 'Mô tả mục tiêu nghề nghiệp hoặc vấn đề cần tư vấn...'
                  : 'Mô tả vị trí đang apply, loại phỏng vấn cần luyện...'}
                rows={4}
              />
            </div>

            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-900">
                <strong>Lưu ý:</strong> {selectedProfile?.name} sẽ nhận được yêu cầu của bạn và xác nhận lịch qua email.
                Thanh toán sẽ được thực hiện sau khi session kết thúc.
              </p>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button onClick={handleSubmitBooking}>
              <Calendar className="mr-2" size={16} />
              Xác nhận đặt lịch
            </Button>
            <Button variant="outline" onClick={() => setShowBookingModal(false)}>
              Hủy
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
};
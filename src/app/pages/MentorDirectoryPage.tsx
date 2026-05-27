import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { Search, Star, MapPin, Briefcase, Users, ArrowRight, CalendarDays, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { AppPageHeader } from '../components/design-system/AppPageHeader';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { ApiError } from '../../lib/api/apiError';
import mentorService, { type MentorSummary } from '../../services/mentorService';

const serviceTypeOptions = [
  { value: 'mock_interview', label: 'Mock Interview' },
  { value: 'career_coaching', label: 'Career Coaching' },
  { value: 'resume_review', label: 'Resume Review' },
  { value: 'technical_consulting', label: 'Technical Consulting' },
];

export const MentorDirectoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [mentors, setMentors] = useState<MentorSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [specialty, setSpecialty] = useState('all');
  const [serviceType, setServiceType] = useState('all');
  const [rating, setRating] = useState('all');

  const specialtyOptions = useMemo(() => {
    const map = new Map<string, string>();
    mentors.forEach((mentor) => {
      mentor.specialties.forEach((item) => map.set(item.code, item.name));
    });
    return Array.from(map.entries()).map(([value, label]) => ({ value, label }));
  }, [mentors]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await mentorService.listMentors({
          specialty: specialty === 'all' ? undefined : specialty,
          serviceType: serviceType === 'all' ? undefined : serviceType,
          rating: rating === 'all' ? undefined : Number(rating),
          search: search.trim() || undefined,
          page,
          pageSize,
        });
        if (!mounted) return;
        setMentors(response.items || []);
        setTotalPages(response.totalPages || 1);
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof ApiError ? err.getUserMessage() : 'Không thể tải danh bạ mentor.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void load();
    return () => {
      mounted = false;
    };
  }, [page, pageSize, search, specialty, serviceType, rating]);

  useEffect(() => {
    setPage(1);
  }, [search, specialty, serviceType, rating]);

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-12">
      <AppPageHeader
        title="Màn hình Danh bạ Mentor"
        subtitle="Tìm mentor theo chuyên môn, đánh giá và mục tiêu hỗ trợ"
        icon={Users}
        iconGradient="from-blue-500 to-violet-600"
        actions={
          <Button variant="outline" onClick={() => navigate('/mentor-bookings')}>
            <CalendarDays className="mr-2 h-4 w-4" />
            Lịch hẹn của tôi
          </Button>
        }
      />

      <Card className="p-5">
        <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
          <div className="relative lg:col-span-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm theo tên, headline, bio" className="pl-10" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Filter className="h-4 w-4" />
              Chuyên môn
            </div>
            <Select value={specialty} onValueChange={setSpecialty}>
              <SelectTrigger>
                <SelectValue placeholder="Tất cả" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                {specialtyOptions.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Filter className="h-4 w-4" />
              Dịch vụ
            </div>
            <Select value={serviceType} onValueChange={setServiceType}>
              <SelectTrigger>
                <SelectValue placeholder="Tất cả" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                {serviceTypeOptions.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Star className="h-4 w-4" />
              Đánh giá tối thiểu
            </div>
            <Select value={rating} onValueChange={setRating}>
              <SelectTrigger>
                <SelectValue placeholder="Tất cả" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="4">4+</SelectItem>
                <SelectItem value="4.5">4.5+</SelectItem>
                <SelectItem value="4.8">4.8+</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {loading ? (
        <Card className="p-10 text-center text-sm text-gray-500">Đang tải danh bạ mentor...</Card>
      ) : error ? (
        <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30 p-6 text-red-700 dark:text-red-400">{error}</Card>
      ) : mentors.length === 0 ? (
        <Card className="p-10 text-center">
          <Users className="mx-auto mb-3 h-14 w-14 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900">Không tìm thấy mentor phù hợp</h3>
          <p className="mt-1 text-sm text-gray-500">Hãy thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.</p>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {mentors.map((mentor) => (
            <Card key={mentor.id} className="flex h-full flex-col p-6 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{mentor.fullName}</h3>
                  <p className="mt-1 text-sm text-gray-500">{mentor.headline || 'Mentor'}</p>
                </div>
                <Badge variant="outline" className="rounded-full">
                  <Star className="mr-1 h-3 w-3 text-amber-500" />
                  {mentor.ratingAverage.toFixed(2)} ({mentor.ratingCount})
                </Badge>
              </div>

              <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
                <Briefcase className="h-4 w-4" />
                <span>{mentor.yearsOfExperience ?? 0} năm kinh nghiệm</span>
              </div>
              <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="h-4 w-4" />
                <span>{mentor.specialties.map((item) => item.name).join(' • ') || 'Chuyên môn đa dạng'}</span>
              </div>

              <p className="mt-4 line-clamp-4 text-sm leading-6 text-gray-600">{mentor.bio || 'Chưa có mô tả.'}</p>

              <div className="mt-4 flex flex-wrap gap-2">
                {mentor.specialties.slice(0, 4).map((specialtyItem) => (
                  <Badge key={specialtyItem.code} variant="secondary" className="rounded-full">
                    {specialtyItem.name}
                  </Badge>
                ))}
              </div>

              <div className="mt-auto flex items-center justify-between pt-5">
                <div className="text-xs text-gray-500">
                  <p>{mentor.specialties.length} chuyên môn</p>
                  <p>{mentor.ratingCount} đánh giá</p>
                </div>
                <Button onClick={() => navigate(`/network/${mentor.id}`)}>
                  Xem chi tiết
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-3">
          <Button variant="outline" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>
            Trang trước
          </Button>
          <p className="text-sm text-gray-600">Trang {page} / {totalPages}</p>
          <Button variant="outline" disabled={page >= totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}>
            Trang sau
          </Button>
        </div>
      )}
    </div>
  );
};

export default MentorDirectoryPage;

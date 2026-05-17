import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { useApp } from '../contexts/AppContext';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import {
  Upload, FileText, Target, TrendingUp, TrendingDown,
  Minus, CheckCircle, XCircle, AlertCircle, Bookmark,
  BookmarkCheck, ExternalLink, Filter, Download, Briefcase, MapPin, DollarSign
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';

interface JobListing {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  matchScore: number;
  matchLevel: 'high' | 'medium' | 'low';
  requiredSkills: string[];
  matchedSkills: string[];
  missingSkills: string[];
  posted: string;
  saved: boolean;
}

export const MultiJDMatchingPage: React.FC = () => {
  const { state } = useApp();
  const navigate = useNavigate();
  const [cvUploaded, setCvUploaded] = useState(false);
  const [savedJobs, setSavedJobs] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'score' | 'date'>('score');
  const [filterLevel, setFilterLevel] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [showJDModal, setShowJDModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobListing | null>(null);
  const isPremium = state.user?.role === 'premium' || state.user?.role === 'trial';

  // Mock JD data
  const [jobs, setJobs] = useState<JobListing[]>([
    {
      id: '1',
      title: 'Senior Frontend Developer',
      company: 'VNG Corporation',
      location: 'TP. Hồ Chí Minh',
      salary: '30-45 triệu',
      matchScore: 92,
      matchLevel: 'high',
      requiredSkills: ['React', 'TypeScript', 'Redux', 'Next.js', 'Tailwind CSS', 'Jest'],
      matchedSkills: ['React', 'TypeScript', 'Redux', 'Tailwind CSS'],
      missingSkills: ['Next.js', 'Jest'],
      posted: '2 ngày trước',
      saved: false
    },
    {
      id: '2',
      title: 'Full-stack Engineer',
      company: 'Shopee',
      location: 'TP. Hồ Chí Minh',
      salary: '35-50 triệu',
      matchScore: 87,
      matchLevel: 'high',
      requiredSkills: ['React', 'Node.js', 'MongoDB', 'Docker', 'AWS'],
      matchedSkills: ['React', 'Node.js', 'MongoDB'],
      missingSkills: ['Docker', 'AWS'],
      posted: '5 ngày trước',
      saved: false
    },
    {
      id: '3',
      title: 'React Developer',
      company: 'Tiki',
      location: 'Hà Nội',
      salary: '25-35 triệu',
      matchScore: 78,
      matchLevel: 'medium',
      requiredSkills: ['React', 'JavaScript', 'CSS', 'Git', 'Redux'],
      matchedSkills: ['React', 'JavaScript', 'CSS', 'Git'],
      missingSkills: ['Redux'],
      posted: '1 tuần trước',
      saved: false
    },
    {
      id: '4',
      title: 'Frontend Team Lead',
      company: 'Grab',
      location: 'Remote',
      salary: '45-60 triệu',
      matchScore: 72,
      matchLevel: 'medium',
      requiredSkills: ['React', 'TypeScript', 'Leadership', 'System Design', 'Mentoring', 'Agile'],
      matchedSkills: ['React', 'TypeScript', 'Agile'],
      missingSkills: ['Leadership', 'System Design', 'Mentoring'],
      posted: '3 ngày trước',
      saved: false
    },
    {
      id: '5',
      title: 'Junior Frontend Developer',
      company: 'FPT Software',
      location: 'Đà Nẵng',
      salary: '12-18 triệu',
      matchScore: 95,
      matchLevel: 'high',
      requiredSkills: ['HTML', 'CSS', 'JavaScript', 'React'],
      matchedSkills: ['HTML', 'CSS', 'JavaScript', 'React'],
      missingSkills: [],
      posted: '4 ngày trước',
      saved: false
    },
    {
      id: '6',
      title: 'Backend Developer (Node.js)',
      company: 'Momo',
      location: 'TP. Hồ Chí Minh',
      salary: '28-40 triệu',
      matchScore: 58,
      matchLevel: 'low',
      requiredSkills: ['Node.js', 'PostgreSQL', 'Microservices', 'Kafka', 'Redis'],
      matchedSkills: ['Node.js'],
      missingSkills: ['PostgreSQL', 'Microservices', 'Kafka', 'Redis'],
      posted: '1 ngày trước',
      saved: false
    },
    {
      id: '7',
      title: 'Frontend Engineer (Vue.js)',
      company: 'Zalo',
      location: 'Hà Nội',
      salary: '30-42 triệu',
      matchScore: 52,
      matchLevel: 'low',
      requiredSkills: ['Vue.js', 'Vuex', 'TypeScript', 'Webpack'],
      matchedSkills: ['TypeScript'],
      missingSkills: ['Vue.js', 'Vuex', 'Webpack'],
      posted: '6 ngày trước',
      saved: false
    },
    {
      id: '8',
      title: 'Mobile Developer (React Native)',
      company: 'Sendo',
      location: 'TP. Hồ Chí Minh',
      salary: '22-32 triệu',
      matchScore: 68,
      matchLevel: 'medium',
      requiredSkills: ['React Native', 'React', 'JavaScript', 'Mobile Development'],
      matchedSkills: ['React', 'JavaScript'],
      missingSkills: ['React Native', 'Mobile Development'],
      posted: '2 tuần trước',
      saved: false
    }
  ]);

  const handleUploadCV = () => {
    setCvUploaded(true);
  };

  const toggleSaveJob = (jobId: string) => {
    setJobs(jobs.map(job =>
      job.id === jobId ? { ...job, saved: !job.saved } : job
    ));
  };

  const handleViewFullJD = (job: JobListing) => {
    setSelectedJob(job);
    setShowJDModal(true);
  };

  const handleStartInterview = (job: JobListing) => {
    // Store job info for interview setup
    sessionStorage.setItem('interviewJobContext', JSON.stringify({
      position: job.title,
      company: job.company,
    }));
    navigate('/phong-van-setup');
  };

  const getMatchLevelColor = (level: string) => {
    switch (level) {
      case 'high': return 'bg-green-100 text-green-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      case 'low': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getMatchLevelLabel = (level: string) => {
    switch (level) {
      case 'high': return 'Rất phù hợp';
      case 'medium': return 'Phù hợp';
      case 'low': return 'Ít phù hợp';
      default: return 'Chưa xác định';
    }
  };

  const filteredAndSortedJobs = jobs
    .filter(job => filterLevel === 'all' || job.matchLevel === filterLevel)
    .sort((a, b) => {
      if (sortBy === 'score') {
        return b.matchScore - a.matchScore;
      }
      return 0; // Date sorting would go here
    });

  const matchStats = {
    high: jobs.filter(j => j.matchLevel === 'high').length,
    medium: jobs.filter(j => j.matchLevel === 'medium').length,
    low: jobs.filter(j => j.matchLevel === 'low').length,
    avgScore: Math.round(jobs.reduce((sum, j) => sum + j.matchScore, 0) / jobs.length)
  };

  if (!cvUploaded) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">So khớp đa công việc</h1>
          <p className="text-gray-600">
            Tải CV lên một lần, so khớp với hàng trăm công việc phù hợp
          </p>
        </div>

        <Card className="p-12 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Upload className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Tải CV của bạn lên</h2>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Hệ thống sẽ phân tích CV và tự động so khớp với hàng trăm JD từ các công ty hàng đầu
          </p>

          <div className="space-y-3 mb-6">
            <Button 
              className="w-full max-w-xs"
              onClick={handleUploadCV}
            >
              <Upload className="mr-2" size={16} />
              Tải CV lên (PDF, DOC, DOCX)
            </Button>
            <p className="text-xs text-gray-500">
              File tối đa 5MB • Hỗ trợ PDF, Word
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4 text-left max-w-2xl mx-auto">
            <div className="p-4 bg-blue-50 rounded-lg">
              <CheckCircle className="w-8 h-8 text-blue-600 mb-2" />
              <h4 className="font-semibold text-sm mb-1">So khớp tự động</h4>
              <p className="text-xs text-gray-600">AI phân tích và tính điểm match với từng JD</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <Target className="w-8 h-8 text-purple-600 mb-2" />
              <h4 className="font-semibold text-sm mb-1">Gợi ý cải thiện</h4>
              <p className="text-xs text-gray-600">Nhận insights để tăng điểm matching</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <Bookmark className="w-8 h-8 text-green-600 mb-2" />
              <h4 className="font-semibold text-sm mb-1">Lưu công việc</h4>
              <p className="text-xs text-gray-600">Đánh dấu và theo dõi công việc yêu thích</p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Kết quả so khớp</h1>
          <p className="text-gray-600">
            CV của bạn đã được so khớp với {jobs.length} công việc
          </p>
        </div>
        <div className="flex gap-2">
          {isPremium && (
            <Button variant="outline">
              <Download className="mr-2" size={16} />
              Xuất báo cáo
            </Button>
          )}
          <Button variant="outline" onClick={() => setCvUploaded(false)}>
            <Upload className="mr-2" size={16} />
            Tải CV khác
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-1">{matchStats.avgScore}%</div>
            <div className="text-sm text-gray-600">Điểm TB</div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-1">{matchStats.high}</div>
            <div className="text-sm text-gray-600">Rất phù hợp</div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-600 mb-1">{matchStats.medium}</div>
            <div className="text-sm text-gray-600">Phù hợp</div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-red-600 mb-1">{matchStats.low}</div>
            <div className="text-sm text-gray-600">Ít phù hợp</div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-500" />
            <span className="text-sm font-medium">Lọc:</span>
          </div>
          <select
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value as any)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tất cả ({jobs.length})</option>
            <option value="high">Rất phù hợp ({matchStats.high})</option>
            <option value="medium">Phù hợp ({matchStats.medium})</option>
            <option value="low">Ít phù hợp ({matchStats.low})</option>
          </select>

          <div className="flex items-center gap-2 ml-4">
            <span className="text-sm font-medium">Sắp xếp:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="score">Điểm cao nhất</option>
              <option value="date">Mới nhất</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Job Listings */}
      <div className="space-y-4">
        {filteredAndSortedJobs.map(job => (
          <Card key={job.id} className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start gap-6">
              {/* Match Score */}
              <div className="text-center flex-shrink-0">
                <div className={`w-20 h-20 rounded-full border-4 flex items-center justify-center ${
                  job.matchScore >= 80 ? 'border-green-500' :
                  job.matchScore >= 60 ? 'border-yellow-500' : 'border-red-500'
                }`}>
                  <div>
                    <div className="text-2xl font-bold">{job.matchScore}</div>
                    <div className="text-xs text-gray-500">điểm</div>
                  </div>
                </div>
                <Badge className={`mt-2 ${getMatchLevelColor(job.matchLevel)}`}>
                  {getMatchLevelLabel(job.matchLevel)}
                </Badge>
              </div>

              {/* Job Info */}
              <div className="flex-1">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-xl font-bold mb-1">{job.title}</h3>
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <span className="font-semibold">{job.company}</span>
                      <span>•</span>
                      <span>{job.location}</span>
                      <span>•</span>
                      <span className="text-green-600 font-semibold">{job.salary}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{job.posted}</p>
                  </div>
                  <button
                    onClick={() => toggleSaveJob(job.id)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    {job.saved ? (
                      <BookmarkCheck className="w-5 h-5 text-blue-600 fill-blue-600" />
                    ) : (
                      <Bookmark className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                </div>

                {/* Skills Match */}
                <div className="space-y-3">
                  {/* Matched Skills */}
                  {job.matchedSkills.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-semibold text-green-700">
                          Kỹ năng phù hợp ({job.matchedSkills.length})
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {job.matchedSkills.map((skill, idx) => (
                          <span 
                            key={idx}
                            className="px-3 py-1 bg-green-50 text-green-700 text-xs rounded-full border border-green-200"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Missing Skills */}
                  {job.missingSkills.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="w-4 h-4 text-orange-600" />
                        <span className="text-sm font-semibold text-orange-700">
                          Kỹ năng cần bổ sung ({job.missingSkills.length})
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {job.missingSkills.map((skill, idx) => (
                          <span 
                            key={idx}
                            className="px-3 py-1 bg-orange-50 text-orange-700 text-xs rounded-full border border-orange-200"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-3 mt-4 pt-4 border-t">
                  <Button size="sm" onClick={() => navigate(`/cv-matching?jd=${job.id}`)}>
                    Tối ưu CV cho JD này
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleViewFullJD(job)}>
                    <ExternalLink className="mr-2" size={14} />
                    Xem JD đầy đủ
                  </Button>
                  {isPremium && (
                    <Button variant="outline" size="sm" onClick={() => handleStartInterview(job)}>
                      Luyện phỏng vấn
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredAndSortedJobs.length === 0 && (
        <Card className="p-12 text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">Không có kết quả</h3>
          <p className="text-gray-600">Thử điều chỉnh bộ lọc để xem thêm công việc</p>
        </Card>
      )}

      {/* Job Description Modal */}
      <Dialog open={showJDModal} onOpenChange={setShowJDModal}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">{selectedJob?.title}</DialogTitle>
          </DialogHeader>

          <div className="flex flex-wrap gap-3 mt-2">
            <span className="flex items-center gap-1 text-sm text-gray-600">
              <Briefcase size={14} />
              {selectedJob?.company}
            </span>
            <span className="flex items-center gap-1 text-sm text-gray-600">
              <MapPin size={14} />
              {selectedJob?.location}
            </span>
            <span className="flex items-center gap-1 text-sm text-gray-600">
              <DollarSign size={14} />
              {selectedJob?.salary}
            </span>
            <Badge className={selectedJob ? getMatchLevelColor(selectedJob.matchLevel) : ''}>
              Match: {selectedJob?.matchScore}%
            </Badge>
          </div>

          <div className="mt-4 space-y-6">
            {/* Match Summary */}
            <div className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg">
              <h4 className="font-semibold mb-3">📊 Phân tích so khớp</h4>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600 mb-2">Kỹ năng phù hợp:</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedJob?.matchedSkills.map((skill, idx) => (
                      <span key={idx} className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
                {selectedJob && selectedJob.missingSkills.length > 0 && (
                  <div>
                    <p className="text-gray-600 mb-2">Kỹ năng cần bổ sung:</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedJob.missingSkills.map((skill, idx) => (
                        <span key={idx} className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Full Job Description */}
            <div>
              <h4 className="font-semibold mb-3">📋 Mô tả công việc</h4>
              <div className="space-y-4 text-sm leading-relaxed">
                <div>
                  <h5 className="font-semibold mb-2">Trách nhiệm chính:</h5>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    <li>Phát triển và duy trì ứng dụng web sử dụng {selectedJob?.requiredSkills[0]}</li>
                    <li>Làm việc cùng team để thiết kế và implement các tính năng mới</li>
                    <li>Tối ưu hiệu suất và trải nghiệm người dùng</li>
                    <li>Code review và mentoring junior developers</li>
                    <li>Tham gia vào các quyết định kỹ thuật quan trọng</li>
                  </ul>
                </div>

                <div>
                  <h5 className="font-semibold mb-2">Yêu cầu:</h5>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    {selectedJob?.requiredSkills.map((skill, idx) => (
                      <li key={idx}>
                        Có kinh nghiệm với <strong>{skill}</strong>
                      </li>
                    ))}
                    <li>Khả năng làm việc nhóm tốt</li>
                    <li>Tiếng Anh giao tiếp cơ bản</li>
                  </ul>
                </div>

                <div>
                  <h5 className="font-semibold mb-2">Quyền lợi:</h5>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    <li>Mức lương cạnh tranh: {selectedJob?.salary}</li>
                    <li>Thưởng hiệu suất hàng quý</li>
                    <li>Bảo hiểm đầy đủ theo luật</li>
                    <li>Môi trường làm việc chuyên nghiệp, năng động</li>
                    <li>Cơ hội phát triển và thăng tiến</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button onClick={() => {
              setShowJDModal(false);
              navigate(`/cv-matching?jd=${selectedJob?.id}`);
            }}>
              Tối ưu CV cho JD này
            </Button>
            {isPremium && (
              <Button variant="outline" onClick={() => {
                setShowJDModal(false);
                handleStartInterview(selectedJob!);
              }}>
                Luyện phỏng vấn
              </Button>
            )}
            <Button variant="outline" onClick={() => setShowJDModal(false)}>
              Đóng
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

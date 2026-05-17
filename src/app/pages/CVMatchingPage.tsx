import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { useApp } from '../contexts/AppContext';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Progress } from '../components/ui/progress';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { UpgradeModal } from '../components/UpgradeModal';
import { LoadingButton } from '../components/design-system/LoadingButton';
import { eventTracker } from '../utils/eventTracker';
import { 
  Upload, 
  FileText, 
  Sparkles, 
  Loader2,
  CheckCircle,
  AlertCircle,
  Download,
  History,
  Lightbulb,
  Lock,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';
import { AppPageHeader } from '../components/design-system/AppPageHeader';

export const CVMatchingPage: React.FC = () => {
  const { state, useCVOptimization, addCVVersion } = useApp();
  const navigate = useNavigate();
  const [step, setStep] = useState<'upload' | 'analyzing' | 'results'>('upload');
  const [cvText, setCvText] = useState('');
  const [jdText, setJdText] = useState('');
  const [matchScore, setMatchScore] = useState(0);
  const [analyzingProgress, setAnalyzingProgress] = useState(0);
  const [analyzingStep, setAnalyzingStep] = useState('');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const isPremium = state.user?.role === 'premium' || state.user?.role === 'trial';
  const canUse = isPremium || (state.user && state.user.cvOptimizationsDaily < 3);

  const skillsData = [
    { skill: 'Kỹ năng kỹ thuật', current: 75, required: 90 },
    { skill: 'Kinh nghiệm', current: 80, required: 85 },
    { skill: 'Học vấn', current: 95, required: 90 },
    { skill: 'Kỹ năng mềm', current: 70, required: 85 },
    { skill: 'Ngôn ngữ', current: 85, required: 80 },
  ];

  const missingKeywords = [
    'React', 'TypeScript', 'Node.js', 'AWS', 'Docker', 'Agile', 'CI/CD'
  ];

  const suggestions = [
    {
      section: 'Kỹ năng kỹ thuật',
      issue: 'Thiếu các công nghệ quan trọng trong JD',
      suggestion: 'Thêm các từ khóa: React, TypeScript, Node.js vào phần kỹ năng của bạn'
    },
    {
      section: 'Kinh nghiệm',
      issue: 'Mô tả kinh nghiệm chưa cụ thể',
      suggestion: 'Sử dụng số liệu cụ thể: \"Tăng hiệu suất 30%\" thay vì \"Cải thiện hiệu suất\"'
    },
    {
      section: 'Thành tích',
      issue: 'Thiếu các metric đo lường',
      suggestion: 'Thêm các con số cụ thể về kết quả công việc của bạn'
    }
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setUploadError('File quá lớn. Vui lòng chọn file nhỏ hơn 5MB.');
      toast.error('File quá lớn');
      return;
    }

    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Định dạng file không được hỗ trợ. Vui lòng chọn file PDF hoặc DOCX.');
      toast.error('Định dạng file không hợp lệ');
      return;
    }

    setUploadError('');
    toast.success('File đã được tải lên thành công');
    eventTracker.track('cv_file_upload', { fileName: file.name, fileSize: file.size });
  };

  const handleAnalyze = () => {
    if (!canUse) {
      setShowUpgradeModal(true);
      eventTracker.track('upgrade_modal_shown', { trigger: 'cv_limit_reached' });
      return;
    }

    if (!cvText || !jdText) {
      toast.error('Vui lòng nhập đầy đủ CV và JD');
      return;
    }

    const success = useCVOptimization();
    if (!success) {
      setShowUpgradeModal(true);
      eventTracker.track('upgrade_modal_shown', { trigger: 'cv_limit_reached' });
      return;
    }

    setStep('analyzing');
    setAnalyzingProgress(0);
    eventTracker.track('jd_analyze_start');
    
    // Simulate progressive analysis
    const steps = [
      { progress: 20, text: 'Đang phân tích JD...' },
      { progress: 40, text: 'Đang chấm điểm ATS...' },
      { progress: 60, text: 'So khớp kỹ năng...' },
      { progress: 80, text: 'Tìm từ khóa thiếu...' },
      { progress: 100, text: 'Hoàn tất phân tích!' },
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < steps.length) {
        setAnalyzingProgress(steps[currentStep].progress);
        setAnalyzingStep(steps[currentStep].text);
        currentStep++;
      } else {
        clearInterval(interval);
        const score = Math.floor(Math.random() * 30) + 65;
        setMatchScore(score);
        setStep('results');
        
        addCVVersion({
          name: 'CV ' + new Date().toLocaleDateString('vi-VN'),
          score,
          content: cvText
        });
        
        toast.success('Phân tích hoàn tất!');
        eventTracker.track('jd_analyze_complete', { score });
        eventTracker.track('jd_analyze', { score }); // For dashboard completion tracking
      }
    }, 600);
  };

  const handleExportPDF = () => {
    if (!isPremium) {
      setShowUpgradeModal(true);
      eventTracker.track('upgrade_modal_shown', { trigger: 'pdf_export' });
      return;
    }
    toast.success('Đang xuất PDF...');
    eventTracker.track('pdf_export_click');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <AppPageHeader
        title="CV & So khớp JD"
        subtitle="Tối ưu CV của bạn để phù hợp với mô tả công việc"
        icon={FileText}
        iconGradient="from-blue-500 to-cyan-500"
        actions={
          <Button variant="outline" className="hover-lift" onClick={() => navigate('/cv-history')}>
            <History className="mr-2" size={16} />
            Lịch sử
          </Button>
        }
      />

      {!isPremium && (
        <Card className="glass-card p-4 border-blue-200/80 bg-gradient-to-r from-blue-50/90 to-cyan-50/50 dark:from-blue-950/30 dark:to-cyan-950/20">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
            <div className="flex-1">
              <p className="text-sm text-blue-900">
                <strong>Gói miễn phí:</strong> {state.user?.cvOptimizationsDaily || 0}/3 lần tối ưu hôm nay
              </p>
            </div>
            {!canUse && (
              <Button size="sm" onClick={() => navigate('/goi-dich-vu')}>
                Nâng cấp
              </Button>
            )}
          </div>
        </Card>
      )}

      {step === 'upload' && (
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="glass-card hover-lift p-6">
            <Label className="flex items-center gap-2 mb-3">
              <FileText size={18} />
              <span className="font-semibold">CV của bạn</span>
            </Label>
            <Textarea
              value={cvText}
              onChange={(e) => setCvText(e.target.value)}
              placeholder="Dán nội dung CV của bạn vào đây..."
              className="min-h-[400px] font-mono text-sm"
            />
            <div className="mt-4">
              <Button variant="outline" className="w-full">
                <Upload className="mr-2" size={16} />
                Hoặc tải file PDF/DOCX
              </Button>
            </div>
          </Card>

          <Card className="glass-card hover-lift p-6">
            <Label className="flex items-center gap-2 mb-3">
              <Sparkles size={18} />
              <span className="font-semibold">Job Description</span>
            </Label>
            <Textarea
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
              placeholder="Dán mô tả công việc (JD) vào đây..."
              className="min-h-[400px] font-mono text-sm"
            />
            <div className="mt-4 text-sm text-gray-600">
              <p>💡 Tip: Copy toàn bộ nội dung JD để được phân tích chính xác nhất</p>
            </div>
          </Card>
        </div>
      )}

      {step === 'analyzing' && (
        <Card className="p-12">
          <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto animate-pulse">
              <Sparkles className="text-white" size={40} />
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-2">Đang phân tích CV...</h3>
              <p className="text-gray-600">AI đang so khớp CV với JD và tìm các điểm cần cải thiện</p>
            </div>
            <div className="max-w-md mx-auto">
              <Progress value={analyzingProgress} className="h-2" />
            </div>
            <div className="text-sm text-gray-500">
              <p>{analyzingStep}</p>
            </div>
          </div>
        </Card>
      )}

      {step === 'results' && (
        <div className="space-y-6">
          {/* Match Score */}
          <Card className="p-8">
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-4">Điểm so khớp tổng thể</h3>
              <div className="relative inline-block">
                <div className="w-40 h-40 rounded-full border-8 border-gray-200 flex items-center justify-center relative">
                  <div 
                    className="absolute inset-0 rounded-full border-8 border-blue-600"
                    style={{
                      clipPath: `polygon(50% 50%, 50% 0%, ${matchScore >= 50 ? '100%' : '50%'} 0%, 100% ${matchScore >= 75 ? '100%' : matchScore >= 50 ? ((matchScore - 50) / 25) * 100 + '%' : '0%'}, ${matchScore >= 75 ? '0%' : '100%'} 100%, 0% 100%, 0% ${matchScore >= 25 ? (1 - (matchScore - 25) / 25) * 100 + '%' : '100%'}, ${matchScore < 25 ? '50%' : '0%'} ${matchScore < 25 ? (1 - matchScore / 25) * 100 + '%' : '0%'})`
                    }}
                  ></div>
                  <div className="text-4xl font-bold z-10">{matchScore}%</div>
                </div>
              </div>
              <p className="mt-4 text-gray-600">
                {matchScore >= 80 ? 'Xuất sắc! CV của bạn rất phù hợp với JD' :
                 matchScore >= 70 ? 'Tốt! Một vài điểm cần cải thiện' :
                 'CV cần được tối ưu thêm'}
              </p>
            </div>
          </Card>

          {/* Skills Radar Chart */}
          <Card className="p-6">
            <h3 className="font-bold mb-4">Phân tích kỹ năng</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={skillsData}>
                  <PolarGrid key="polar-grid" />
                  <PolarAngleAxis key="polar-angle-axis" dataKey="skill" />
                  <PolarRadiusAxis key="polar-radius-axis" angle={90} domain={[0, 100]} />
                  <Radar 
                    key="current-skill"
                    name="Của bạn" 
                    dataKey="current" 
                    stroke="#3b82f6" 
                    fill="#3b82f6" 
                    fillOpacity={0.5}
                  />
                  <Radar 
                    key="required-skill"
                    name="Yêu cầu" 
                    dataKey="required" 
                    stroke="#8b5cf6" 
                    fill="#8b5cf6" 
                    fillOpacity={0.3}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                <span className="text-sm">CV của bạn</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-600"></div>
                <span className="text-sm">Yêu cầu JD</span>
              </div>
            </div>
          </Card>

          {/* Missing Keywords */}
          <Card className="p-6">
            <h3 className="font-bold mb-4">Từ khóa thiếu trong CV</h3>
            <p className="text-sm text-gray-600 mb-4">
              Các từ khóa này xuất hiện trong JD nhưng không có trong CV của bạn
            </p>
            <div className="flex flex-wrap gap-2">
              {missingKeywords.map(keyword => (
                <Badge key={keyword} variant="outline" className="text-sm">
                  {keyword}
                </Badge>
              ))}
            </div>
          </Card>

          {/* Suggestions */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="text-yellow-600" size={20} />
              <h3 className="font-bold">Gợi ý cải thiện</h3>
            </div>
            <div className="space-y-4">
              {suggestions.map((item, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1">{item.section}</h4>
                      <p className="text-sm text-gray-600 mb-2">{item.issue}</p>
                      <div className="flex items-start gap-2 p-3 bg-blue-50 rounded border border-blue-200">
                        <CheckCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={16} />
                        <p className="text-sm text-blue-900">{item.suggestion}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Actions */}
          <div className="flex gap-3">
            <Button onClick={() => navigate('/phong-van-setup')}>
              <Sparkles className="mr-2" size={16} />
              Luyện phỏng vấn ngay
            </Button>
            <Button variant="outline" onClick={() => setStep('upload')}>
              Phân tích CV khác
            </Button>
            <Button variant="outline" onClick={() => navigate('/cv-history')}>
              <History className="mr-2" size={16} />
              Xem lịch sử
            </Button>
            {isPremium && (
              <Button variant="outline" onClick={handleExportPDF}>
                <Download className="mr-2" size={16} />
                Xuất PDF
              </Button>
            )}
          </div>
        </div>
      )}

      {step === 'upload' && (
        <div className="flex justify-center">
          <LoadingButton size="lg" onClick={handleAnalyze} disabled={!cvText || !jdText}>
            <Sparkles className="mr-2" size={20} />
            Phân tích ngay
          </LoadingButton>
        </div>
      )}

      {/* Upgrade Modal */}
      <UpgradeModal open={showUpgradeModal} onOpenChange={setShowUpgradeModal} />
    </div>
  );
};
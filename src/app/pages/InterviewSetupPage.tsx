import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { useApp } from '../contexts/AppContext';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { AIModelDropdown } from '../components/AIModelDropdown';
import { AlertCircle, Mic, Lock, Sparkles, Clock, Target, User } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { AppPageHeader } from '../components/design-system/AppPageHeader';

export const InterviewSetupPage: React.FC = () => {
  const { state, useInterview, startTrial } = useApp();
  const navigate = useNavigate();
  const [position, setPosition] = useState('');
  const [level, setLevel] = useState('');
  const [goal, setGoal] = useState('');
  const [duration, setDuration] = useState('');
  const [interviewerMode, setInterviewerMode] = useState('');
  const [selectedModel, setSelectedModel] = useState('gpt-4o-mini');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const isPremium = state.user?.role === 'premium' || state.user?.role === 'trial';
  const canUse = isPremium || (state.user && state.user.interviewsDaily < 1);

  const positions = [
    { value: 'software-engineer', label: 'Software Engineer', premium: false },
    { value: 'product-manager', label: 'Product Manager', premium: false },
    { value: 'data-analyst', label: 'Data Analyst', premium: true },
    { value: 'marketing-manager', label: 'Marketing Manager', premium: true },
    { value: 'sales-executive', label: 'Sales Executive', premium: true },
    { value: 'hr-specialist', label: 'HR Specialist', premium: true },
    { value: 'designer', label: 'UX/UI Designer', premium: true },
    { value: 'business-analyst', label: 'Business Analyst', premium: true },
  ];

  const levels = [
    { value: 'intern', label: 'Intern', premium: false },
    { value: 'junior', label: 'Junior', premium: false },
    { value: 'mid', label: 'Mid-level', premium: true },
    { value: 'senior', label: 'Senior', premium: true },
  ];

  const goals = [
    { value: 'reflection', label: 'Cải thiện phản xạ', description: 'Luyện tập trả lời nhanh và tự nhiên', premium: false },
    { value: 'star', label: 'Rèn luyện STAR', description: 'Thực hành cấu trúc câu trả lời', premium: false },
    { value: 'confidence', label: 'Tăng sự tự tin', description: 'Xây dựng phong thái chuyên nghiệp', premium: true },
  ];

  const durations = [
    { value: '5', label: '5 phút', description: 'Phỏng vấn nhanh', premium: false },
    { value: '10', label: '10 phút', description: 'Phỏng vấn tiêu chuẩn', premium: false },
    { value: '20', label: '20 phút', description: 'Phỏng vấn chuyên sâu', premium: true },
  ];

  const aiModels = [
    {
      value: 'gpt-4o-mini',
      label: 'GPT-4o mini',
      description: 'Nhanh & tiết kiệm',
      premium: false,
    },
    {
      value: 'gpt-3.5-turbo',
      label: 'GPT-3.5 Turbo',
      description: 'Cơ bản, ổn định',
      premium: false,
    },
    {
      value: 'gpt-4o',
      label: 'GPT-4o',
      description: 'Chất lượng cao, phản biện sâu',
      premium: true,
    },
    {
      value: 'gpt-4o-realtime',
      label: 'GPT-4o Realtime',
      description: 'Voice realtime, độ trễ thấp',
      premium: true,
    },
    {
      value: 'claude-3-opus',
      label: 'Claude 3 Opus',
      description: 'Lập luận mạnh',
      premium: true,
    },
    {
      value: 'gemini-1.5-pro',
      label: 'Gemini 1.5 Pro',
      description: 'Ngữ cảnh dài',
      premium: true,
    },
    {
      value: 'mixtral-8x7b',
      label: 'Mixtral 8x7B',
      description: 'Tối ưu chi phí',
      premium: true,
    },
  ];

  const interviewerModes = [
    {
      value: 'basic-hr',
      label: 'HR cơ bản',
      description: 'AI thân thiện, câu hỏi cơ bản',
      icon: '👔',
      premium: false
    },
    {
      value: 'strict-hr',
      label: 'HR khó tính',
      description: 'Stress-test với câu hỏi khó, chi tiết',
      icon: '🎯',
      premium: true
    },
    {
      value: 'tech-lead',
      label: 'Trưởng phòng kỹ thuật',
      description: 'Tập trung vào kỹ năng chuyên môn sâu',
      icon: '💻',
      premium: true
    },
    {
      value: 'startup',
      label: 'Phong cách Startup',
      description: 'Linh hoạt, tập trung vào tư duy sáng tạo',
      icon: '🚀',
      premium: true
    },
    {
      value: 'corporate',
      label: 'Phong cách Tập đoàn',
      description: 'Chuyên nghiệp, quy trình chặt chẽ',
      icon: '🏢',
      premium: true
    },
    {
      value: 'specialized',
      label: 'Phỏng vấn theo ngành chuyên sâu',
      description: 'Câu hỏi chuyên ngành, case study thực tế',
      icon: '🎓',
      premium: true
    },
  ];

  const handleStart = () => {
    if (!canUse) {
      setShowUpgradeModal(true);
      return;
    }

    if (!position || !level || !goal || !duration || !interviewerMode || !selectedModel) {
      alert('Vui lòng chọn đầy đủ các thông tin');
      return;
    }

    const selectedPosition = positions.find(p => p.value === position);
    const selectedLevel = levels.find(l => l.value === level);
    const selectedGoal = goals.find(g => g.value === goal);
    const selectedDuration = durations.find(d => d.value === duration);
    const selectedMode = interviewerModes.find(m => m.value === interviewerMode);
    const selectedAIModel = aiModels.find(m => m.value === selectedModel);

    if (!isPremium && (selectedPosition?.premium || selectedLevel?.premium || selectedGoal?.premium || selectedDuration?.premium || selectedMode?.premium || selectedAIModel?.premium)) {
      setShowUpgradeModal(true);
      return;
    }

    // Store interview config in sessionStorage for the pre-call page
    sessionStorage.setItem('interviewConfig', JSON.stringify({
      position: selectedPosition?.label,
      level: selectedLevel?.label,
      goal: selectedGoal?.label,
      duration: selectedDuration?.label,
      interviewerMode: selectedMode?.label,
      interviewerIcon: selectedMode?.icon,
      aiModel: selectedAIModel?.label,
    }));

    navigate('/phong-van-pre-call');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <AppPageHeader
        title="Thiết lập phỏng vấn AI"
        subtitle="Trải nghiệm phỏng vấn giống thật với AI interviewer"
        icon={Mic}
        iconGradient="from-fuchsia-500 to-pink-600"
      />

      {!isPremium && (
        <Card className="glass-card p-4 border-blue-200/80 bg-gradient-to-r from-blue-50/90 to-fuchsia-50/50">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
            <div className="flex-1">
              <p className="text-sm text-blue-900">
                <strong>Gói miễn phí:</strong> {state.user?.interviewsDaily || 0}/1 phiên hôm nay
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

      <Card className="glass-card rounded-2xl p-8">
        <div className="space-y-8">
          {/* Position */}
          <div>
            <Label className="text-base font-semibold mb-3 flex items-center gap-2">
              <User size={18} className="text-blue-600" />
              Vị trí ứng tuyển
            </Label>
            <Select value={position} onValueChange={setPosition}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn vị trí..." />
              </SelectTrigger>
              <SelectContent>
                {positions.map(pos => (
                  <SelectItem key={pos.value} value={pos.value} disabled={!isPremium && pos.premium}>
                    <div className="flex items-center justify-between w-full">
                      <span>{pos.label}</span>
                      {pos.premium && !isPremium && (
                        <Badge variant="secondary" className="ml-2">
                          <Lock size={12} className="mr-1" />
                          Premium
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Level */}
          <div>
            <Label className="text-base font-semibold mb-3 flex items-center gap-2">
              <Target size={18} className="text-blue-600" />
              Cấp độ kinh nghiệm
            </Label>
            <Select value={level} onValueChange={setLevel}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn cấp độ..." />
              </SelectTrigger>
              <SelectContent>
                {levels.map(lvl => (
                  <SelectItem key={lvl.value} value={lvl.value} disabled={!isPremium && lvl.premium}>
                    <div className="flex items-center justify-between w-full">
                      <span>{lvl.label}</span>
                      {lvl.premium && !isPremium && (
                        <Badge variant="secondary" className="ml-2">
                          <Lock size={12} className="mr-1" />
                          Premium
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Goal */}
          <div>
            <Label className="text-base font-semibold mb-3 flex items-center gap-2">
              <Sparkles size={18} className="text-blue-600" />
              Mục tiêu buổi phỏng vấn
            </Label>
            <div className="grid gap-3">
              {goals.map(g => (
                <button
                  key={g.value}
                  onClick={() => {
                    if (!isPremium && g.premium) {
                      setShowUpgradeModal(true);
                    } else {
                      setGoal(g.value);
                    }
                  }}
                  disabled={!isPremium && g.premium}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    goal === g.value
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  } ${!isPremium && g.premium ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold mb-1">{g.label}</div>
                      <div className="text-sm text-gray-600">{g.description}</div>
                    </div>
                    {g.premium && !isPremium && (
                      <Badge variant="secondary">
                        <Lock size={12} className="mr-1" />
                        Premium
                      </Badge>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Duration */}
          <div>
            <Label className="text-base font-semibold mb-3 flex items-center gap-2">
              <Clock size={18} className="text-blue-600" />
              Thời lượng
            </Label>
            <div className="grid grid-cols-3 gap-3">
              {durations.map(d => (
                <button
                  key={d.value}
                  onClick={() => {
                    if (!isPremium && d.premium) {
                      setShowUpgradeModal(true);
                    } else {
                      setDuration(d.value);
                    }
                  }}
                  disabled={!isPremium && d.premium}
                  className={`p-4 rounded-lg border-2 text-center transition-all ${
                    duration === d.value
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  } ${!isPremium && d.premium ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div className="font-semibold mb-1">{d.label}</div>
                  <div className="text-xs text-gray-600">{d.description}</div>
                  {d.premium && !isPremium && (
                    <Badge variant="secondary" className="mt-2">
                      <Lock size={10} className="mr-1" />
                      Premium
                    </Badge>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* AI Model Selection - BEFORE Interviewer Mode */}
          <div>
            <Label className="text-base font-semibold mb-3 flex items-center gap-2">
              <Sparkles size={18} className="text-blue-600" />
              Model AI
            </Label>
            <p className="text-sm text-gray-600 mb-3">
              Chọn mô hình để cân bằng tốc độ và chất lượng phản hồi.
            </p>
            <AIModelDropdown
              selectedModel={selectedModel}
              onSelect={setSelectedModel}
              isPremium={isPremium}
              onUpgradeClick={() => setShowUpgradeModal(true)}
            />
            {selectedModel && (
              <div className="mt-2 text-sm text-gray-600">
                Model đã chọn: <strong>{aiModels.find(m => m.value === selectedModel)?.label}</strong>
              </div>
            )}
          </div>

          {/* Interviewer Mode */}
          <div>
            <Label className="text-base font-semibold mb-3 flex items-center gap-2">
              <Mic size={18} className="text-blue-600" />
              Chọn phong cách AI interviewer
            </Label>
            <div className="grid gap-3">
              {interviewerModes.map(mode => (
                <button
                  key={mode.value}
                  onClick={() => {
                    if (!isPremium && mode.premium) {
                      setShowUpgradeModal(true);
                    } else {
                      setInterviewerMode(mode.value);
                    }
                  }}
                  disabled={!isPremium && mode.premium}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    interviewerMode === mode.value
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  } ${!isPremium && mode.premium ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{mode.icon}</div>
                    <div className="flex-1">
                      <div className="font-semibold mb-1">{mode.label}</div>
                      <div className="text-sm text-gray-600">{mode.description}</div>
                    </div>
                    {mode.premium && !isPremium && (
                      <Badge variant="secondary">
                        <Lock size={12} className="mr-1" />
                        Premium
                      </Badge>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Summary */}
          {position && level && goal && duration && interviewerMode && selectedModel && (
            <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
              <h4 className="font-semibold mb-3">✨ Tóm tắt cấu hình</h4>
              <div className="grid md:grid-cols-2 gap-x-4 gap-y-2 text-sm text-gray-700">
                <p>• Vị trí: <strong>{positions.find(p => p.value === position)?.label}</strong></p>
                <p>• Cấp độ: <strong>{levels.find(l => l.value === level)?.label}</strong></p>
                <p>• Mục tiêu: <strong>{goals.find(g => g.value === goal)?.label}</strong></p>
                <p>• Thời lượng: <strong>{durations.find(d => d.value === duration)?.label}</strong></p>
                <p className="md:col-span-2">• Phong cách phỏng vấn: <strong>{interviewerModes.find(m => m.value === interviewerMode)?.label}</strong></p>
                <p className="md:col-span-2">• Mô hình AI: <strong>{aiModels.find(m => m.value === selectedModel)?.label}</strong></p>
              </div>
            </div>
          )}
        </div>
      </Card>

      <div className="flex gap-3">
        <Button 
          size="lg" 
          className="flex-1"
          onClick={handleStart}
          disabled={!position || !level || !goal || !duration || !interviewerMode || !selectedModel}
        >
          <Mic className="mr-2" size={20} />
          Tiếp tục
        </Button>
        <Button size="lg" variant="outline" onClick={() => navigate('/dashboard')}>
          Hủy
        </Button>
      </div>

      {/* Upgrade Modal */}
      <Dialog open={showUpgradeModal} onOpenChange={setShowUpgradeModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nâng cấp gói dịch vụ</DialogTitle>
            <DialogDescription>
              {canUse ? 
                'Tính năng này chỉ dành cho các gói trả phí' : 
                'Bạn đã sử dụng hết lượt phỏng vấn miễn phí'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
              <h4 className="font-semibold mb-3">Khi nâng cấp, bạn sẽ có:</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Sparkles size={16} className="text-purple-600" />
                  Không giới hạn phỏng vấn AI
                </li>
                <li className="flex items-center gap-2">
                  <Sparkles size={16} className="text-purple-600" />
                  Tất cả phong cách AI interviewer (6 loại)
                </li>
                <li className="flex items-center gap-2">
                  <Sparkles size={16} className="text-purple-600" />
                  Stress-test & phỏng vấn chuyên sâu
                </li>
                <li className="flex items-center gap-2">
                  <Sparkles size={16} className="text-purple-600" />
                  Phân tích chi tiết toàn bộ buổi phỏng vấn
                </li>
                <li className="flex items-center gap-2">
                  <Sparkles size={16} className="text-purple-600" />
                  So sánh tiến bộ qua nhiều buổi
                </li>
                <li className="flex items-center gap-2">
                  <Sparkles size={16} className="text-purple-600" />
                  Xuất PDF báo cáo chuyên nghiệp
                </li>
              </ul>
              <div className="mt-4 pt-4 border-t border-blue-200">
                <p className="text-lg font-bold text-center">
                  Chỉ <span className="text-2xl text-blue-600">149.000đ</span>/tháng
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              {state.user?.role === 'free' && !state.user?.trialEndsAt && (
                <Button 
                  className="w-full" 
                  onClick={() => {
                    startTrial();
                    setShowUpgradeModal(false);
                  }}
                >
                  Dùng thử 7 ngày miễn phí
                </Button>
              )}
              <Button 
                className="w-full" 
                variant={state.user?.role === 'free' && !state.user?.trialEndsAt ? 'outline' : 'default'}
                onClick={() => navigate('/goi-dich-vu')}
              >
                Xem bảng giá
              </Button>
              <Button variant="ghost" onClick={() => setShowUpgradeModal(false)}>
                Để sau
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { AIModelDropdown } from '../components/AIModelDropdown';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs';
import { AlertCircle, Sparkles, Clock, Target, User, MessageSquare, Mic, Volume2, Languages, FileText } from 'lucide-react';
import { Switch } from '../components/ui/switch';
import { AppPageHeader } from '../components/design-system/AppPageHeader';
import { useAsyncQuery } from '../../hooks/useAsyncQuery';
import { ApiError } from '../../lib/api/apiError';
import {
  checkQuota,
  createInterview,
  type AiModelValue,
  type InterviewLevel,
  type InterviewType,
  type InterviewerMode,
} from '../../services/interviewService';

export const InterviewSetupPage: React.FC = () => {
  const navigate = useNavigate();
  const [position, setPosition] = useState('');
  const [level, setLevel] = useState<InterviewLevel | ''>('');
  const [interviewType, setInterviewType] = useState<InterviewType | ''>('');
  const [goal, setGoal] = useState('');
  const [durationMinutes, setDurationMinutes] = useState<string>('30');
  const [interviewerMode, setInterviewerMode] = useState<InterviewerMode | ''>('');
  const [selectedModel, setSelectedModel] = useState<AiModelValue>('gpt-4o-mini');
  const [mode, setMode] = useState<'text' | 'voice'>('text');
  const [voice, setVoice] = useState<string>('alloy');
  const [language, setLanguage] = useState<string>('vi');
  const [enableTranscript, setEnableTranscript] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { data: quota, isLoading: quotaLoading, error: quotaError, refetch } = useAsyncQuery(
    () => checkQuota(),
    []
  );

  const quotaBlocked =
    quota && !quota.isUnlimited && quota.remainingValue != null && quota.remainingValue <= 0;

  const canCreate = quota?.canCreate !== false && !quotaBlocked;

  const levels = useMemo(
    () => [
      { value: 'junior', label: 'Junior' },
      { value: 'mid', label: 'Mid' },
      { value: 'senior', label: 'Senior' },
      { value: 'lead', label: 'Lead' },
      { value: 'manager', label: 'Manager' },
    ],
    []
  );

  const interviewTypes = useMemo(
    () => [
      { value: 'technical', label: 'Technical' },
      { value: 'behavioral', label: 'Behavioral' },
      { value: 'case_study', label: 'Case study' },
      { value: 'general', label: 'General' },
    ],
    []
  );

  const interviewerModes = useMemo(
    () => [
      { value: 'professional', label: 'Professional' },
      { value: 'friendly', label: 'Friendly' },
      { value: 'strict', label: 'Strict' },
    ],
    []
  );

  const durationValue = Number(durationMinutes);

  const handleStart = async () => {
    setSubmitError(null);

    if (!position.trim() || !level || !interviewType || !interviewerMode) {
      setSubmitError('Vui lòng chọn đầy đủ các thông tin bắt buộc.');
      return;
    }

    if (!Number.isFinite(durationValue) || durationValue < 1 || durationValue > 120) {
      setSubmitError('Thời lượng phải nằm trong khoảng 1 đến 120 phút.');
      return;
    }

    if (!canCreate) {
      setSubmitError('Bạn đã hết lượt phỏng vấn AI trong gói hiện tại.');
      return;
    }

    try {
      setSubmitting(true);
      const session = await createInterview({
        position: position.trim(),
        level: level as InterviewLevel,
        interviewType: interviewType as InterviewType,
        goal: goal.trim() ? goal.trim() : null,
        durationMinutes: durationValue,
        mode: mode,
        interviewerMode: interviewerMode as InterviewerMode,
        aiModel: selectedModel,
      });

      if (mode === 'voice') {
        navigate(`/phong-van-pre-call`, {
          state: {
            sessionId: session.id,
            voice,
            language,
            enableTranscript,
          },
        });
      } else {
        navigate(`/phong-van-live/${session.id}`);
      }
    } catch (error) {
      const apiError = error instanceof ApiError ? error : null;
      if (apiError?.status === 403 && apiError.code === 'Quota.Exceeded') {
        setSubmitError('Bạn đã dùng hết lượt phỏng vấn AI trong gói hiện tại.');
      } else {
        setSubmitError(apiError?.getUserMessage() || 'Có lỗi xảy ra.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <AppPageHeader
        title="Thiết lập phỏng vấn AI"
        subtitle="Chọn hình thức phỏng vấn phù hợp và bắt đầu luyện tập"
        icon={Sparkles}
        iconGradient="from-sky-500 to-blue-600"
      />

      <Tabs defaultValue="text" value={mode} onValueChange={(v) => setMode(v as 'text' | 'voice')} className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-auto p-1 bg-blue-50/50 mb-2">
          <TabsTrigger value="text" className="flex items-center justify-center gap-2 py-3 rounded-lg data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm">
            <MessageSquare size={18} /> 
            <span className="font-semibold text-base">Phỏng vấn Text</span>
          </TabsTrigger>
          <TabsTrigger value="voice" className="flex items-center justify-center gap-2 py-3 rounded-lg data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm">
            <Mic size={18} /> 
            <span className="font-semibold text-base">Phỏng vấn Voice</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <Card className="glass-card p-4 border-blue-200/80 bg-gradient-to-r from-blue-50/90 to-fuchsia-50/50">
        <div className="flex items-start gap-3">
          <AlertCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
          <div className="flex-1">
            {quotaLoading ? (
              <p className="text-sm text-blue-900">Đang kiểm tra quota phỏng vấn...</p>
            ) : quotaError ? (
              <p className="text-sm text-blue-900">
                Không thể kiểm tra quota.{' '}
                <button
                  className="underline"
                  onClick={() => void refetch()}
                >
                  Thử lại
                </button>
              </p>
            ) : quota ? (
              <p className="text-sm text-blue-900">
                <strong>Quota:</strong>{' '}
                {quota.isUnlimited
                  ? 'Không giới hạn'
                  : `${quota.usedToday}/${quota.limitValue ?? 0} hôm nay`}
                {quota.remainingValue != null && !quota.isUnlimited && (
                  <span className="ml-2">(Còn {quota.remainingValue})</span>
                )}
              </p>
            ) : (
              <p className="text-sm text-blue-900">Không có dữ liệu quota.</p>
            )}
          </div>
          {!canCreate && (
            <Button size="sm" onClick={() => navigate('/goi-dich-vu')}>
              Nâng cấp
            </Button>
          )}
        </div>
      </Card>

      <Card className="glass-card rounded-2xl p-8">
        <div className="space-y-8">
          {/* Position */}
          <div>
            <Label className="text-base font-semibold mb-3 flex items-center gap-2">
              <User size={18} className="text-blue-600" />
              Vị trí ứng tuyển
            </Label>
            <Input
              value={position}
              onChange={(event) => setPosition(event.target.value)}
              placeholder="Ví dụ: Backend Developer"
            />
          </div>

          {/* Level */}
          <div>
            <Label className="text-base font-semibold mb-3 flex items-center gap-2">
              <Target size={18} className="text-blue-600" />
              Cấp độ kinh nghiệm
            </Label>
            <Select value={level} onValueChange={(value) => setLevel(value as InterviewLevel)}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn cấp độ..." />
              </SelectTrigger>
              <SelectContent>
                {levels.map(lvl => (
                  <SelectItem key={lvl.value} value={lvl.value}>
                    {lvl.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Interview Type */}
          <div>
            <Label className="text-base font-semibold mb-3 flex items-center gap-2">
              <Target size={18} className="text-blue-600" />
              Loại phỏng vấn
            </Label>
            <Select value={interviewType} onValueChange={(value) => setInterviewType(value as InterviewType)}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn loại phỏng vấn..." />
              </SelectTrigger>
              <SelectContent>
                {interviewTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Goal */}
          <div>
            <Label className="text-base font-semibold mb-3 flex items-center gap-2">
              <Sparkles size={18} className="text-blue-600" />
              Mục tiêu (không bắt buộc)
            </Label>
            <Textarea
              value={goal}
              onChange={(event) => setGoal(event.target.value)}
              placeholder="Ví dụ: Luyện tập System Design"
              rows={3}
            />
          </div>

          {/* Duration */}
          <div>
            <Label className="text-base font-semibold mb-3 flex items-center gap-2">
              <Clock size={18} className="text-blue-600" />
              Thời lượng (phút)
            </Label>
            <Input
              type="number"
              min={1}
              max={120}
              value={durationMinutes}
              onChange={(event) => setDurationMinutes(event.target.value)}
            />
            <p className="text-xs text-gray-500 mt-2">Từ 1 đến 120 phút.</p>
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
              onSelect={(value) => setSelectedModel(value as AiModelValue)}
              isPremium={true}
              onUpgradeClick={() => undefined}
            />
          </div>

          {/* Interviewer Mode */}
          <div>
            <Label className="text-base font-semibold mb-3 flex items-center gap-2">
              <Target size={18} className="text-blue-600" />
              Phong cách interviewer
            </Label>
            <Select
              value={interviewerMode}
              onValueChange={(value) => setInterviewerMode(value as InterviewerMode)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn phong cách..." />
              </SelectTrigger>
              <SelectContent>
                {interviewerModes.map(mode => (
                  <SelectItem key={mode.value} value={mode.value}>
                    {mode.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {mode === 'voice' && (
            <>
              {/* Voice Selection */}
              <div>
                <Label className="text-base font-semibold mb-3 flex items-center gap-2">
                  <Volume2 size={18} className="text-blue-600" />
                  Giọng nói AI (Voice)
                </Label>
                <Select value={voice} onValueChange={setVoice}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn giọng nói..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alloy">Alloy (Trung tính, dễ nghe)</SelectItem>
                    <SelectItem value="ash">Ash (Trầm ấm, nam)</SelectItem>
                    <SelectItem value="ballad">Ballad (Mượt mà, nữ)</SelectItem>
                    <SelectItem value="coral">Coral (Thân thiện, nữ)</SelectItem>
                    <SelectItem value="echo">Echo (Cá tính, nam)</SelectItem>
                    <SelectItem value="sage">Sage (Chuyên nghiệp, nữ)</SelectItem>
                    <SelectItem value="shimmer">Shimmer (Tươi sáng, nữ)</SelectItem>
                    <SelectItem value="verse">Verse (Năng động, nam)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Language Selection */}
              <div>
                <Label className="text-base font-semibold mb-3 flex items-center gap-2">
                  <Languages size={18} className="text-blue-600" />
                  Ngôn ngữ phỏng vấn
                </Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn ngôn ngữ..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vi">Tiếng Việt (vi)</SelectItem>
                    <SelectItem value="en">Tiếng Anh (en)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Enable Transcript Toggle */}
              <div className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-gray-50/50">
                <div className="space-y-0.5">
                  <Label className="text-base font-semibold flex items-center gap-2">
                    <FileText size={18} className="text-blue-600" />
                    Hiển thị text transcript realtime
                  </Label>
                  <p className="text-sm text-gray-500">
                    Bật để hiển thị trực quan hội thoại dạng văn bản trong khi nói.
                  </p>
                </div>
                <Switch
                  checked={enableTranscript}
                  onCheckedChange={setEnableTranscript}
                />
              </div>
            </>
          )}
          {submitError && (
            <div className="p-3 rounded-lg border border-red-200 bg-red-50 text-sm text-red-700">
              {submitError}
            </div>
          )}
        </div>
      </Card>

      <div className="flex gap-3">
        <Button 
          size="lg" 
          className="flex-1"
          onClick={handleStart}
          disabled={
            submitting ||
            !position.trim() ||
            !level ||
            !interviewType ||
            !interviewerMode ||
            !selectedModel
          }
        >
          {submitting ? 'Đang tạo...' : 'Bắt đầu phỏng vấn'}
        </Button>
        <Button size="lg" variant="outline" onClick={() => navigate('/dashboard')}>
          Hủy
        </Button>
      </div>
    </div>
  );
};
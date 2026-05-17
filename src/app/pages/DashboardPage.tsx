import React from 'react';
import { useNavigate } from 'react-router';
import { useApp } from '../contexts/AppContext';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Progress } from '../components/ui/progress';
import { Badge } from '../components/ui/badge';
import { DemoGuideModal } from '../components/DemoGuideModal';
import { AdRewardModal } from '../components/AdRewardModal';
import { eventTracker } from '../utils/eventTracker';
import { getSubscriptionLimits, getPlanPriceInfo } from '../utils/subscriptionLimits';
import { CANDIDATE_PLANS } from '../config/pricing';
import {
  FileText,
  Mic,
  BarChart3,
  ArrowRight,
  TrendingUp,
  Clock,
  Target,
  Award,
  Sparkles,
  CheckCircle2,
  Upload,
  FileSearch,
  BarChart,
  Crown,
  Zap,
  ChevronRight,
  Check,
  Play,
  Lightbulb,
  TrendingDown,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { state, startTrial, watchAdForCredit } = useApp();
  const navigate = useNavigate();
  const user = state.user!;
  const [isAdModalOpen, setIsAdModalOpen] = React.useState(false);

  const isFree = user.role === 'free';
  const isPremium = user.role === 'premium' || user.role === 'trial';
  const currentPlan = user.subscriptionPlan || 'free';
  const limits = getSubscriptionLimits(currentPlan);
  const planInfo = getPlanPriceInfo(currentPlan);

  // Get current plan features safely with explicit checks
  const getCurrentPlanFeatures = (): string[] => {
    try {
      if (user.role === 'trial') {
        const yearlyPlan = CANDIDATE_PLANS['yearly'];
        return yearlyPlan?.features || [];
      }
      if (user.role === 'premium') {
        const plan = CANDIDATE_PLANS[currentPlan];
        return plan?.features || [];
      }
      if (user.role === 'free') {
        const freePlan = CANDIDATE_PLANS['free'];
        return freePlan?.features || [];
      }
      return [];
    } catch (error) {
      console.error('Error getting plan features:', error);
      return [];
    }
  };

  const currentPlanFeatures = getCurrentPlanFeatures();

  // Get formatted price string with proper fallback
  const getFormattedPrice = (): string => {
    try {
      if (user.role === 'free') {
        return '0đ';
      }
      if (user.role === 'trial' || user.role === 'premium') {
        const price = planInfo?.priceMonthly || 0;
        if (price === 0) return '0đ';
        return `${price.toLocaleString('vi-VN')}đ/tháng`;
      }
      return '0đ';
    } catch (error) {
      console.error('Error formatting price:', error);
      return '0đ';
    }
  };

  const formattedPrice = getFormattedPrice();

  // Trial is only available for annual plan and only if user hasn't used it before
  const isTrialEligible = isFree && !user.hasUsedTrial;

  // Calculate usage percentages
  const cvUsagePercent = limits.cvOptimizationsDaily === 'unlimited' 
    ? 0 
    : (user.cvOptimizationsDaily / limits.cvOptimizationsDaily) * 100;
  
  const interviewUsagePercent = limits.interviewsDaily === 'unlimited' 
    ? 0 
    : (user.interviewsDaily / limits.interviewsDaily) * 100;

  const handleStartTrial = () => {
    startTrial();
  };

  // Check completion status from eventTracker
  const events = eventTracker.getEvents();
  const hasCVUpload = events.some(e => e.type === 'cv_upload') || state.cvVersions.length > 0;
  const hasJDAnalyze = events.some(e => e.type === 'jd_analyze' || e.type === 'jd_analyze_complete');
  const hasInterviewEnd = events.some(e => e.type === 'interview_end') || state.interviewReports.length > 0;
  const hasReportView = events.some(e => e.type === 'report_view');

  const steps = [
    {
      number: '01',
      title: 'Tải CV',
      description: 'Upload và phân tích CV',
      icon: Upload,
      route: '/cv-matching',
      completed: hasCVUpload,
    },
    {
      number: '02',
      title: 'Thêm JD',
      description: 'Phân tích Job Description',
      icon: FileSearch,
      route: '/cv-matching',
      completed: hasJDAnalyze,
    },
    {
      number: '03',
      title: 'Phỏng vấn',
      description: 'Luyện tập với AI',
      icon: Mic,
      route: '/phong-van-setup',
      completed: hasInterviewEnd,
    },
    {
      number: '04',
      title: 'Báo cáo',
      description: 'Xem kết quả',
      icon: BarChart,
      route: '/bao-cao',
      completed: hasReportView,
    },
  ];

  const completedSteps = steps.filter(s => s.completed).length;
  const progressPercent = (completedSteps / steps.length) * 100;
  
  // Determine if user has completed onboarding
  const hasCompletedOnboarding = completedSteps === steps.length;

  // Get next recommended action
  const getNextAction = () => {
    if (!hasCVUpload) {
      return {
        title: 'Tải CV của bạn lên',
        description: 'Bắt đầu bằng việc upload CV để nhận phân tích chi tiết và gợi ý cải thiện từ AI',
        route: '/cv-matching',
        icon: Upload,
      };
    }
    if (!hasJDAnalyze) {
      return {
        title: 'Thêm Job Description',
        description: 'So sánh CV với JD để tối ưu hóa tỷ lệ khớp và tăng cơ hội được nhận',
        route: '/cv-matching',
        icon: FileSearch,
      };
    }
    if (!hasInterviewEnd) {
      return {
        title: 'Luyện phỏng vấn với AI',
        description: 'Thực hành với AI interviewer để tự tin hơn trong buổi phỏng vấn thực tế',
        route: '/phong-van-setup',
        icon: Mic,
      };
    }
    return {
      title: 'Xem báo cáo chi tiết',
      description: 'Phân tích kết quả phỏng vấn và nhận feedback cụ thể để cải thiện kỹ năng',
      route: '/bao-cao',
      icon: BarChart,
    };
  };

  const nextAction = getNextAction();

  // Get daily tip based on user progress
  const getDailyTip = () => {
    const tips = {
      noCV: {
        title: 'CV là chìa khóa đầu tiên',
        content: 'Một CV được tối ưu tốt có thể tăng 70% cơ hội được mời phỏng vấn. Hãy bắt đầu với việc tải CV lên ngay!',
        type: 'info',
      },
      hasCV: {
        title: 'Tối ưu CV theo từng JD',
        content: 'Mỗi vị trí công việc cần một phiên bản CV khác nhau. Điều chỉnh CV để khớp 80%+ với JD mục tiêu.',
        type: 'success',
      },
      hasBoth: {
        title: 'Luyện tập thường xuyên',
        content: 'Các ứng viên luyện phỏng vấn trước có tỷ lệ thành công cao hơn 3 lần. Thực hành ít nhất 2-3 lần mỗi tuần.',
        type: 'warning',
      },
      completed: {
        title: 'Duy trì momentum',
        content: 'Thị trường việc làm thay đổi liên tục. Cập nhật CV và kỹ năng phỏng vấn định kỳ để luôn sẵn sàng.',
        type: 'success',
      },
    };

    if (hasCompletedOnboarding) return tips.completed;
    if (hasJDAnalyze) return tips.hasBoth;
    if (hasCVUpload) return tips.hasCV;
    return tips.noCV;
  };

  const dailyTip = getDailyTip();

  return (
    <div className="space-y-3">
      {/* DemoGuideModal removed - only show on first login via onboarding */}

      {/* Welcome Section - More elegant */}
      <div>
        <h1 className="text-3xl font-bold mb-1">
          Xin chào, {user.name}! 👋
        </h1>
        <p className="text-gray-500">
          Chào mừng bạn quay lại INTER-VIET
        </p>
      </div>

      {/* Main Grid: Onboarding (left) + Usage Card (right) */}
      <div className="grid lg:grid-cols-12 gap-4">

        {/* Left Column: Onboarding Journey / Quick Access (8/12) */}
        <div className="lg:col-span-8">
          <Card className={`p-6 rounded-3xl shadow-md border border-gray-100/50 ${hasCompletedOnboarding ? 'bg-gradient-to-br from-gray-50/50 to-slate-50/50' : 'bg-gradient-to-br from-blue-50/40 via-purple-50/30 to-blue-50/40'}`}>
            <div className="mb-5">
              <h2 className="text-lg font-bold mb-1.5">
                {hasCompletedOnboarding ? 'Truy cập nhanh' : 'Bắt đầu công việc hôm nay'}
              </h2>
              <p className="text-xs text-gray-600">
                {hasCompletedOnboarding
                  ? 'Các tính năng chính của bạn'
                  : 'Thực hiện các bước quan trọng để tối ưu CV và luyện phỏng vấn'}
              </p>
            </div>

            {/* Elegant Progress Bar */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-600">
                  {hasCompletedOnboarding ? 'Hoàn thành' : 'Tiến độ'}
                </span>
                <span className={`text-xs font-bold ${hasCompletedOnboarding ? 'text-green-600' : 'text-blue-600'}`}>
                  {completedSteps}/{steps.length}
                </span>
              </div>
              <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                <div
                  className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 shadow-sm ${
                    hasCompletedOnboarding
                      ? 'bg-gradient-to-r from-green-400 to-emerald-500'
                      : 'bg-gradient-to-r from-blue-500 to-purple-500'
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Refined 4 Steps Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
              {steps.map((step) => {
                const IconComponent = step.icon;
                return (
                  <button
                    key={step.number}
                    onClick={() => navigate(step.route)}
                    className={`group relative p-4 rounded-2xl transition-all duration-300 text-left shadow-sm hover:shadow-lg hover:-translate-y-0.5 ${
                      hasCompletedOnboarding
                        ? 'bg-white/80 hover:bg-white border border-gray-200/80'
                        : step.completed
                          ? 'bg-white border border-green-200 hover:border-green-300 hover:bg-green-50/30'
                          : 'bg-white border border-gray-200 hover:border-blue-300 hover:bg-blue-50/30'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 shadow-sm ${
                        hasCompletedOnboarding
                          ? 'bg-gray-100 group-hover:bg-gray-200'
                          : step.completed
                            ? 'bg-green-100 group-hover:bg-green-200'
                            : 'bg-blue-100 group-hover:bg-blue-200'
                      }`}>
                        <IconComponent
                          className={
                            hasCompletedOnboarding
                              ? 'text-gray-600'
                              : step.completed ? 'text-green-600' : 'text-blue-600'
                          }
                          size={20}
                        />
                      </div>
                      {step.completed && (
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all shadow-sm ${
                          hasCompletedOnboarding ? 'bg-gray-400' : 'bg-green-500'
                        }`}>
                          <CheckCircle2 className="text-white" size={14} />
                        </div>
                      )}
                    </div>

                    <h3 className={`font-bold text-sm mb-0.5 ${hasCompletedOnboarding ? 'text-gray-800' : 'text-gray-900'}`}>
                      {step.title}
                    </h3>
                    <p className="text-xs text-gray-600">{step.description}</p>
                  </button>
                );
              })}
            </div>

            {/* Daily Tip Section */}
            <div className="mb-5 p-4 bg-gradient-to-br from-amber-50/80 via-yellow-50/60 to-orange-50/80 rounded-2xl border border-amber-200/30 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Lightbulb className="text-white" size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-sm text-gray-900 mb-1">{dailyTip.title}</h4>
                  <p className="text-xs text-gray-700 leading-relaxed">{dailyTip.content}</p>
                </div>
              </div>
            </div>

            {/* Next Recommended Action - for incomplete onboarding */}
            {!hasCompletedOnboarding && (
              <div className="p-4 bg-gradient-to-br from-blue-50/60 to-purple-50/60 rounded-2xl border border-blue-200/30 shadow-sm">
                <div className="flex items-center justify-between mb-2.5">
                  <h4 className="font-bold text-sm text-gray-900">Bước tiếp theo</h4>
                  <ArrowRight className="text-blue-600" size={16} />
                </div>
                <button
                  onClick={() => navigate(nextAction.route)}
                  className="w-full text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                      <nextAction.icon className="text-white" size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-gray-900 mb-0.5 group-hover:text-blue-600 transition-colors">
                        {nextAction.title}
                      </p>
                      <p className="text-xs text-gray-600 leading-snug">{nextAction.description}</p>
                    </div>
                  </div>
                </button>
              </div>
            )}

            {/* Continue Growing - for completed onboarding */}
            {hasCompletedOnboarding && (
              <div className="p-4 bg-gradient-to-br from-green-50/60 to-emerald-50/60 rounded-2xl border border-green-200/30 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-sm text-gray-900">Tiếp tục phát triển</h4>
                  <Sparkles className="text-green-600" size={16} />
                </div>
                <div className="space-y-2.5">
                  <button
                    onClick={() => navigate('/cv-matching')}
                    className="w-full text-left group p-3 bg-white/60 hover:bg-white rounded-xl transition-all hover:shadow-sm border border-transparent hover:border-green-200/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                        <Upload className="text-white" size={14} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-xs text-gray-900 group-hover:text-blue-600 transition-colors">
                          Tối ưu thêm CV cho JD mới
                        </p>
                      </div>
                      <ChevronRight className="text-gray-400 group-hover:text-blue-600 transition-colors" size={14} />
                    </div>
                  </button>
                  <button
                    onClick={() => navigate('/phong-van-setup')}
                    className="w-full text-left group p-3 bg-white/60 hover:bg-white rounded-xl transition-all hover:shadow-sm border border-transparent hover:border-green-200/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                        <Mic className="text-white" size={14} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-xs text-gray-900 group-hover:text-purple-600 transition-colors">
                          Luyện phỏng vấn vị trí mới
                        </p>
                      </div>
                      <ChevronRight className="text-gray-400 group-hover:text-purple-600 transition-colors" size={14} />
                    </div>
                  </button>
                  <button
                    onClick={() => navigate('/bao-cao')}
                    className="w-full text-left group p-3 bg-white/60 hover:bg-white rounded-xl transition-all hover:shadow-sm border border-transparent hover:border-green-200/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                        <TrendingUp className="text-white" size={14} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-xs text-gray-900 group-hover:text-green-600 transition-colors">
                          Xem lại báo cáo và cải thiện
                        </p>
                      </div>
                      <ChevronRight className="text-gray-400 group-hover:text-green-600 transition-colors" size={14} />
                    </div>
                  </button>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Subscription Card (4/12) */}
        <div className="lg:col-span-4">
          {/* Single Subscription Card */}
          <Card className="h-full p-5 rounded-3xl shadow-md bg-gradient-to-br from-white to-gray-50/50 border border-gray-100/50 flex flex-col justify-between">
            <div>
            {/* Header: Gói hiện tại label + badge */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Gói hiện tại</span>
                {user.role === 'trial' && (
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs font-semibold px-2.5 py-0.5">
                    Dùng thử
                  </Badge>
                )}
              </div>

              {/* Plan name with icon */}
              <div className="flex items-center gap-2.5">
                {user.role === 'trial' ? (
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <Crown className="text-white" size={16} />
                  </div>
                ) : user.role === 'premium' ? (
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <Crown className="text-white" size={16} />
                  </div>
                ) : (
                  <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <Sparkles className="text-gray-400" size={16} />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-lg leading-tight">
                    {user.role === 'trial' ? 'Gói Năm' : user.role === 'premium' ? planInfo.name : 'Gói Miễn phí'}
                  </p>
                  {user.role === 'trial' && user.trialEndsAt ? (
                    <p className="text-xs text-gray-600 mt-0.5 font-medium">
                      Còn {Math.ceil((user.trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))} ngày dùng thử
                    </p>
                  ) : user.role === 'premium' && planInfo.priceMonthly > 0 ? (
                    <p className="text-xs text-gray-600 mt-0.5 font-medium">
                      {formattedPrice}
                    </p>
                  ) : user.role === 'free' ? (
                    <p className="text-xs text-gray-600 mt-0.5 font-medium">
                      0đ
                    </p>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Quota section */}
            <div className="space-y-3 mb-4">
              <div>
                <div className="flex justify-between mb-1.5 text-xs">
                  <span className="text-gray-700 font-semibold">Tối ưu CV</span>
                  <span className="font-bold text-gray-900">
                    {limits.cvOptimizationsDaily === 'unlimited'
                      ? `${user.cvOptimizationsDaily} lần`
                      : `${user.cvOptimizationsDaily}/${limits.cvOptimizationsDaily} lần`}
                  </span>
                </div>
                {limits.cvOptimizationsDaily !== 'unlimited' && (
                  <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                    <div
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all shadow-sm"
                      style={{ width: `${Math.min(cvUsagePercent, 100)}%` }}
                    />
                  </div>
                )}
              </div>

              <div>
                <div className="flex justify-between mb-1.5 text-xs">
                  <span className="text-gray-700 font-semibold">Phỏng vấn AI</span>
                  <span className="font-bold text-gray-900">
                    {limits.interviewsDaily === 'unlimited'
                      ? `${user.interviewsDaily} lần`
                      : `${user.interviewsDaily}/${limits.interviewsDaily} lần`}
                  </span>
                </div>
                {limits.interviewsDaily !== 'unlimited' && (
                  <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                    <div
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all shadow-sm"
                      style={{ width: `${Math.min(interviewUsagePercent, 100)}%` }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Free Plan - Full benefits display */}
            {isFree && (
              <>
                {/* Ad-watching message */}
                <div className="mb-3 p-3 bg-blue-50 border border-blue-200/50 rounded-xl shadow-sm">
                  <p className="text-xs text-gray-700 leading-relaxed flex items-center gap-2 font-medium">
                    <Play size={14} className="text-blue-600 flex-shrink-0" />
                    <span>Hết lượt? Xem quảng cáo để nhận thêm lượt</span>
                  </p>
                </div>

                {/* Benefits list */}
                <div className="mb-3 space-y-2">
                  <div className="flex items-start gap-2 text-xs text-gray-700">
                    <Check size={14} className="text-gray-400 flex-shrink-0 mt-0.5" />
                    <span className="font-medium">3 lần/tài khoản tối ưu CV miễn phí</span>
                  </div>
                  <div className="flex items-start gap-2 text-xs text-gray-700">
                    <Check size={14} className="text-gray-400 flex-shrink-0 mt-0.5" />
                    <span className="font-medium">1 phiên/tài khoản phỏng vấn AI</span>
                  </div>
                  <div className="flex items-start gap-2 text-xs text-gray-700">
                    <Check size={14} className="text-gray-400 flex-shrink-0 mt-0.5" />
                    <span className="font-medium">Model AI basic</span>
                  </div>
                  <div className="flex items-start gap-2 text-xs text-gray-700">
                    <Check size={14} className="text-gray-400 flex-shrink-0 mt-0.5" />
                    <span className="font-medium">Báo cáo rút gọn</span>
                  </div>
                  <div className="flex items-start gap-2 text-xs text-gray-700">
                    <Check size={14} className="text-gray-400 flex-shrink-0 mt-0.5" />
                    <span className="font-medium">Hỗ trợ qua email</span>
                  </div>
                </div>

                {/* Watch ad button - only show when limit reached */}
                {limits.cvOptimizationsDaily !== 'unlimited' && user.cvOptimizationsDaily >= limits.cvOptimizationsDaily && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mb-3 rounded-xl border-blue-300 hover:bg-blue-50 hover:border-blue-400 font-semibold text-xs shadow-sm h-9 text-blue-700"
                    onClick={() => setIsAdModalOpen(true)}
                  >
                    <Play size={14} className="mr-1.5" />
                    Xem quảng cáo để nhận thêm lượt
                  </Button>
                )}

                {/* Limit warning */}
                {((limits.cvOptimizationsDaily !== 'unlimited' && user.cvOptimizationsDaily >= limits.cvOptimizationsDaily) ||
                  (limits.interviewsDaily !== 'unlimited' && user.interviewsDaily >= limits.interviewsDaily)) && (
                  <div className="mb-3 p-3 bg-orange-50 border border-orange-200/50 rounded-xl text-xs text-orange-900 font-semibold shadow-sm">
                    Đã hết hạn mức hôm nay
                  </div>
                )}
              </>
            )}

            {/* Trial Plan - Benefits display */}
            {user.role === 'trial' && CANDIDATE_PLANS?.yearly?.features && (
              <div className="mb-3 space-y-1.5">
                <p className="text-xs font-bold text-gray-900 mb-2">Tính năng hiện tại:</p>
                {CANDIDATE_PLANS.yearly.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-gray-700">
                    <Check size={14} className="text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="font-medium">{feature}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Paid Plan - Benefits display based on actual plan */}
            {user.role === 'premium' && currentPlan === 'monthly' && CANDIDATE_PLANS?.monthly?.features && (
              <div className="mb-3 space-y-1.5">
                <p className="text-xs font-bold text-gray-900 mb-2">Tính năng hiện tại:</p>
                {CANDIDATE_PLANS.monthly.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-gray-700">
                    <Check size={14} className="text-blue-600 flex-shrink-0 mt-0.5" />
                    <span className="font-medium">{feature}</span>
                  </div>
                ))}
              </div>
            )}

            {user.role === 'premium' && currentPlan === 'quarterly' && CANDIDATE_PLANS?.quarterly?.features && (
              <div className="mb-3 space-y-1.5">
                <p className="text-xs font-bold text-gray-900 mb-2">Tính năng hiện tại:</p>
                {CANDIDATE_PLANS.quarterly.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-gray-700">
                    <Check size={14} className="text-purple-600 flex-shrink-0 mt-0.5" />
                    <span className="font-medium">{feature}</span>
                  </div>
                ))}
              </div>
            )}

            {user.role === 'premium' && currentPlan === 'yearly' && CANDIDATE_PLANS?.yearly?.features && (
              <div className="mb-3 space-y-1.5">
                <p className="text-xs font-bold text-gray-900 mb-2">Tính năng hiện tại:</p>
                {CANDIDATE_PLANS.yearly.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-gray-700">
                    <Check size={14} className="text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="font-medium">{feature}</span>
                  </div>
                ))}
              </div>
            )}
            </div>

            {/* CTAs */}
            <div className="space-y-2 mt-auto pt-3">
              {isFree ? (
                <>
                  {/* Free: Main CTA - Always "Nâng cấp gói" */}
                  <Button
                    size="sm"
                    className="w-full rounded-xl font-semibold text-sm bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-md hover:shadow-lg transition-all h-10"
                    onClick={() => navigate('/goi-dich-vu')}
                  >
                    <Zap size={16} className="mr-1.5" />
                    Nâng cấp gói
                  </Button>
                  {/* Free: Secondary CTA */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full rounded-xl border-gray-300 hover:bg-gray-50 hover:border-gray-400 font-semibold text-xs shadow-sm h-9"
                    onClick={() => navigate('/goi-dich-vu')}
                  >
                    Xem bảng giá
                  </Button>
                </>
              ) : user.role === 'trial' ? (
                <>
                  {/* Trial: Main CTA */}
                  <Button
                    size="sm"
                    className="w-full rounded-xl font-semibold text-sm bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-md hover:shadow-lg transition-all h-10"
                    onClick={() => navigate('/goi-dich-vu')}
                  >
                    Chọn gói phù hợp
                  </Button>
                  {/* Trial: Secondary CTA */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full rounded-xl border-gray-300 hover:bg-gray-50 hover:border-gray-400 font-semibold text-xs shadow-sm h-9"
                    onClick={() => navigate('/goi-dich-vu')}
                  >
                    Xem bảng giá
                  </Button>
                </>
              ) : (
                <>
                  {/* Paid: Main CTA */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full rounded-xl border-gray-300 hover:bg-gray-50 hover:border-gray-400 font-semibold text-xs shadow-sm h-9"
                    onClick={() => navigate('/goi-dich-vu')}
                  >
                    Quản lý gói
                  </Button>
                  {/* Paid: Secondary CTA (optional) */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full rounded-xl hover:bg-gray-50 font-semibold text-xs text-gray-600 h-9"
                    onClick={() => navigate('/goi-dich-vu')}
                  >
                    Xem bảng giá
                  </Button>
                </>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Recent Activity - Refined 2 Cards - Moved up for better hierarchy */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* CV gần đây - Premium design */}
        <Card className="p-6 rounded-3xl shadow-md bg-white border border-gray-100/50">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-lg">CV gần đây</h3>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg"
              onClick={() => navigate('/cv-matching')}
            >
              Xem tất cả
              <ChevronRight size={14} className="ml-0.5" />
            </Button>
          </div>
          
          {state.cvVersions.length === 0 ? (
            <div className="text-center py-14">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                <FileText className="text-blue-500" size={28} />
              </div>
              <p className="text-sm text-gray-600 mb-4 font-semibold">Chưa có CV nào</p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate('/cv-matching')}
                className="rounded-xl border-gray-300 hover:bg-blue-50 hover:border-blue-300 font-semibold shadow-sm"
              >
                Tải CV đầu tiên
              </Button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {state.cvVersions.slice(0, 3).map(cv => (
                <div
                  key={cv.id}
                  className="group flex items-center justify-between p-4 bg-gray-50/80 hover:bg-blue-50/50 rounded-2xl transition-all duration-200 cursor-pointer border border-transparent hover:border-blue-200/50 hover:shadow-sm"
                  onClick={() => navigate('/cv-matching')}
                >
                  <div className="flex items-center gap-3.5 flex-1 min-w-0">
                    <div className="w-11 h-11 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                      <FileText className="text-blue-600" size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate text-gray-900">{cv.name}</p>
                      <p className="text-xs text-gray-600 mt-0.5 font-medium">
                        {cv.createdAt.toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={cv.score >= 80 ? 'default' : 'secondary'}
                    className={`flex-shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold shadow-sm ${
                      cv.score >= 80
                        ? 'bg-green-100 text-green-700 border-0'
                        : 'bg-gray-100 text-gray-700 border-0'
                    }`}
                  >
                    {cv.score}%
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Phỏng vấn gần đây - Premium design */}
        <Card className="p-6 rounded-3xl shadow-md bg-white border border-gray-100/50">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-lg">Phỏng vấn gần đây</h3>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg"
              onClick={() => navigate('/bao-cao')}
            >
              Xem tất cả
              <ChevronRight size={14} className="ml-0.5" />
            </Button>
          </div>
          
          {state.interviewReports.length === 0 ? (
            <div className="text-center py-14">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                <Mic className="text-purple-500" size={28} />
              </div>
              <p className="text-sm text-gray-600 mb-4 font-semibold">Chưa có buổi phỏng vấn nào</p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate('/phong-van-setup')}
                className="rounded-xl border-gray-300 hover:bg-purple-50 hover:border-purple-300 font-semibold shadow-sm"
              >
                Bắt đầu phỏng vấn
              </Button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {state.interviewReports.slice(0, 3).map(report => (
                <div
                  key={report.id}
                  className="group flex items-center justify-between p-4 bg-gray-50/80 hover:bg-purple-50/50 rounded-2xl transition-all duration-200 cursor-pointer border border-transparent hover:border-purple-200/50 hover:shadow-sm"
                  onClick={() => navigate('/bao-cao')}
                >
                  <div className="flex items-center gap-3.5 flex-1 min-w-0">
                    <div className="w-11 h-11 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                      <Mic className="text-purple-600" size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate text-gray-900">{report.position}</p>
                      <p className="text-xs text-gray-600 mt-0.5 font-medium">
                        {report.createdAt.toLocaleDateString('vi-VN')} • {report.duration} phút
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={report.score >= 80 ? 'default' : 'secondary'}
                    className={`flex-shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold shadow-sm ${
                      report.score >= 80
                        ? 'bg-green-100 text-green-700 border-0'
                        : 'bg-gray-100 text-gray-700 border-0'
                    }`}
                  >
                    {report.score}/100
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Performance Overview - Refined */}
      {isPremium && state.interviewReports.length > 0 && (
        <Card className="p-6 rounded-3xl shadow-md bg-white border border-gray-100/50">
          <h3 className="font-bold text-lg mb-6">Tổng quan hiệu suất</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shadow-sm">
                  <Target className="text-blue-600" size={20} />
                </div>
                <span className="text-xs text-gray-600 font-semibold">Điểm TB</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {Math.round(state.interviewReports.reduce((acc, r) => acc + r.score, 0) / state.interviewReports.length)}
              </p>
            </div>
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center shadow-sm">
                  <Award className="text-purple-600" size={20} />
                </div>
                <span className="text-xs text-gray-600 font-semibold">Hoàn thành</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">{state.interviewReports.length}</p>
            </div>
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center shadow-sm">
                  <TrendingUp className="text-green-600" size={20} />
                </div>
                <span className="text-xs text-gray-600 font-semibold">Tiến bộ</span>
              </div>
              <p className="text-3xl font-bold text-green-600">+12%</p>
            </div>
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center shadow-sm">
                  <Clock className="text-orange-600" size={20} />
                </div>
                <span className="text-xs text-gray-600 font-semibold">Thời gian</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {state.interviewReports.reduce((acc, r) => acc + r.duration, 0)}m
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Ad Reward Modal */}
      <AdRewardModal
        isOpen={isAdModalOpen}
        onClose={() => setIsAdModalOpen(false)}
        onRewardClaimed={() => {
          watchAdForCredit();
          setIsAdModalOpen(false);
        }}
      />
    </div>
  );
};
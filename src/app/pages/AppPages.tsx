import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useApp } from '../contexts/AppContext';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { eventTracker } from '../utils/eventTracker';
import { getFeedback } from '../components/FeedbackModal';
import { ContactSupportModal } from '../components/ContactSupportModal';
import { DowngradeConfirmModal } from '../components/DowngradeConfirmModal';
import { 
  Download, Share2, Target, TrendingUp, Award, Clock,
  Bell, Mail, Activity, Trash2, AlertCircle, CheckCircle,
  FileText, BarChart3, MessageSquare, HelpCircle, Check, X
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Progress } from '../components/ui/progress';
import { 
  CANDIDATE_PLANS, 
  getPlanQuota, 
  getPlanActionType, 
  getPlanCTAText, 
  getPlanCTAVariant,
  type PlanActionType 
} from '../config/pricing';
import { toast } from 'sonner';

// CV History Page
export const CVHistoryPage: React.FC = () => {
  const { state } = useApp();
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Lịch sử CV</h1>
          <p className="text-gray-600">Tất cả các phiên bản CV đã tối ưu</p>
        </div>
        <Button onClick={() => navigate('/cv-matching')}>
          Tối ưu CV mới
        </Button>
      </div>

      {state.cvVersions.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">Chưa có CV nào</h3>
          <p className="text-gray-600 mb-6">Bắt đầu tối ưu CV đầu tiên của bạn</p>
          <Button onClick={() => navigate('/cv-matching')}>
            Tối ưu CV ngay
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {state.cvVersions.map(cv => (
            <Card key={cv.id} className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-bold mb-1">{cv.name}</h3>
                  <p className="text-sm text-gray-600">
                    {cv.createdAt.toLocaleDateString('vi-VN')} • {cv.createdAt.toLocaleTimeString('vi-VN')}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-2xl font-bold">{cv.score}%</div>
                    <div className="text-xs text-gray-600">Matching</div>
                  </div>
                  <Button variant="outline" size="sm">
                    Xem chi tiết
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

// Interview Report Page
export const InterviewReportPage: React.FC = () => {
  const { id } = useParams();
  const { state } = useApp();
  const navigate = useNavigate();
  const isPremium = state.user?.role === 'premium' || state.user?.role === 'trial';

  const report = state.interviewReports[0] || {
    position: 'Software Engineer',
    level: 'Junior',
    type: 'Behavioral',
    score: 78,
    duration: 18
  };

  const metrics = [
    { name: 'Nội dung', score: 82 },
    { name: 'Tốc độ nói', score: 75 },
    { name: 'Confidence', score: 80 },
    { name: 'Cấu trúc', score: 70 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Báo cáo phỏng vấn</h1>
          <p className="text-gray-600">{report.position} - {report.type}</p>
        </div>
        <div className="flex gap-2">
          {isPremium && (
            <>
              <Button variant="outline">
                <Download className="mr-2" size={16} />
                Tải PDF
              </Button>
              <Button variant="outline">
                <Share2 className="mr-2" size={16} />
                Chia sẻ
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Overall Score */}
      <Card className="p-8">
        <div className="text-center">
          <h3 className="text-xl font-semibold mb-4">Điểm tổng thể</h3>
          <div className="text-6xl font-bold text-blue-600 mb-4">{report.score}/100</div>
          <Badge variant={report.score >= 80 ? 'default' : 'secondary'} className="text-lg px-4 py-1">
            {report.score >= 80 ? 'Xuất sắc' : report.score >= 70 ? 'Tốt' : 'Cần cải thiện'}
          </Badge>
        </div>
      </Card>

      {/* Metrics Breakdown */}
      <Card className="p-6">
        <h3 className="font-bold mb-4">Phân tích chi tiết</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={metrics}>
              <CartesianGrid key="cartesian-grid" strokeDasharray="3 3" />
              <XAxis key="x-axis" dataKey="name" />
              <YAxis key="y-axis" domain={[0, 100]} />
              <Tooltip key="tooltip" />
              <Bar key="bar-score" dataKey="score" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Comparison */}
      {isPremium && (
        <Card className="p-6">
          <h3 className="font-bold mb-4">So sánh với trung bình ngành</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{report.score}</div>
              <p className="text-sm text-gray-600">Điểm của bạn</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-400">72</div>
              <p className="text-sm text-gray-600">Trung bình ngành</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">+{report.score - 72}</div>
              <p className="text-sm text-gray-600">Cao hơn</p>
            </div>
          </div>
        </Card>
      )}

      {/* Suggestions */}
      <Card className="p-6">
        <h3 className="font-bold mb-4">Gợi ý cải thiện</h3>
        <ul className="space-y-3">
          <li className="flex items-start gap-3">
            <CheckCircle className="text-green-600 flex-shrink-0 mt-1" size={20} />
            <div>
              <h4 className="font-semibold">Giảm tốc độ nói</h4>
              <p className="text-sm text-gray-600">Bạn nói hơi nhanh. Hãy thở sâu và nói chậm hơn 10-15%</p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <CheckCircle className="text-green-600 flex-shrink-0 mt-1" size={20} />
            <div>
              <h4 className="font-semibold">Sử dụng phương pháp STAR</h4>
              <p className="text-sm text-gray-600">Cấu trúc câu trả lời theo Situation, Task, Action, Result</p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <CheckCircle className="text-green-600 flex-shrink-0 mt-1" size={20} />
            <div>
              <h4 className="font-semibold">Thêm số liệu cụ thể</h4>
              <p className="text-sm text-gray-600">Sử dụng metrics và con số để làm rõ thành tích</p>
            </div>
          </li>
        </ul>
      </Card>

      <div className="flex gap-3">
        <Button onClick={() => navigate('/phong-van-setup')}>
          Luyện lại
        </Button>
        <Button variant="outline" onClick={() => navigate('/bao-cao')}>
          Xem tất cả báo cáo
        </Button>
      </div>
    </div>
  );
};

// Reports Page
export const ReportsPage: React.FC = () => {
  const { state } = useApp();
  const navigate = useNavigate();

  // Track report view when page loads
  React.useEffect(() => {
    if (state.interviewReports.length > 0) {
      eventTracker.track('report_view');
    }
  }, [state.interviewReports.length]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Lịch sử báo cáo</h1>
          <p className="text-gray-600">Tất cả các phiên phỏng vấn của bạn</p>
        </div>
        <Button onClick={() => navigate('/phong-van-setup')}>
          Phỏng vấn mới
        </Button>
      </div>

      {state.interviewReports.length === 0 ? (
        <Card className="p-12 text-center">
          <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">Chưa có báo cáo nào</h3>
          <p className="text-gray-600 mb-6">Bắt đầu phỏng vấn đầu tiên của bạn</p>
          <Button onClick={() => navigate('/phong-van-setup')}>
            Bắt đầu phỏng vấn
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {state.interviewReports.map(report => (
            <Card key={report.id} className="p-6 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate(`/phong-van-report/${report.id}`)}>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-bold mb-1">{report.position}</h3>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <span>{report.level}</span>
                    <span>•</span>
                    <span>{report.type}</span>
                    <span>•</span>
                    <span>{report.createdAt.toLocaleDateString('vi-VN')}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-2xl font-bold">{report.score}</div>
                    <div className="text-xs text-gray-600">điểm</div>
                  </div>
                  <Badge variant={report.score >= 80 ? 'default' : 'secondary'}>
                    {report.score >= 80 ? 'Xuất sắc' : 'Tốt'}
                  </Badge>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

// Notifications Page
export const NotificationsPage: React.FC = () => {
  const { state, markNotificationRead } = useApp();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Thông báo</h1>

      {state.notifications.length === 0 ? (
        <Card className="p-12 text-center">
          <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">Không có thông báo</h3>
          <p className="text-gray-600">Bạn đã xem hết thông báo</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {state.notifications.map(notification => (
            <Card 
              key={notification.id} 
              className={`p-6 cursor-pointer ${!notification.read ? 'bg-blue-50 border-blue-200' : ''}`}
              onClick={() => markNotificationRead(notification.id)}
            >
              <div className="flex items-start gap-3">
                <Bell className="flex-shrink-0 mt-1" size={20} />
                <div className="flex-1">
                  <h3 className="font-bold mb-1">{notification.title}</h3>
                  <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                  <p className="text-xs text-gray-500">
                    {notification.createdAt.toLocaleDateString('vi-VN')} {notification.createdAt.toLocaleTimeString('vi-VN')}
                  </p>
                </div>
                {!notification.read && (
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

// Settings Page
export const SettingsPage: React.FC = () => {
  const { state, updateUser } = useApp();
  const navigate = useNavigate();
  const [name, setName] = useState(state.user?.name || '');
  const [email, setEmail] = useState(state.user?.email || '');
  const [emailNotifs, setEmailNotifs] = useState(true);

  const handleSave = () => {
    updateUser({ name, email });
    alert('Đã lưu thay đổi!');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Cài đặt tài khoản</h1>

      <Card className="p-6">
        <h3 className="font-bold mb-4">Thông tin cá nhân</h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Họ và tên</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <Button onClick={handleSave}>Lưu thay đổi</Button>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="font-bold mb-4">Thông báo</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Email thông báo</h4>
              <p className="text-sm text-gray-600">Nhận thông báo qua email</p>
            </div>
            <Switch checked={emailNotifs} onCheckedChange={setEmailNotifs} />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="font-bold mb-4 text-red-600">Vùng nguy hiểm</h3>
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Xóa tài khoản</h4>
            <p className="text-sm text-gray-600 mb-4">
              Hành động này không thể hoàn tác. Tất cả dữ liệu sẽ bị xóa vĩnh viễn.
            </p>
            <Button variant="destructive" onClick={() => navigate('/xoa-tai-khoan')}>
              <Trash2 className="mr-2" size={16} />
              Xóa tài khoản
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

// Subscription Page
export const SubscriptionPage: React.FC = () => {
  const { state } = useApp();
  const navigate = useNavigate();
  const currentPlan = state.user?.subscriptionPlan || 'free';
  const [showDowngradeModal, setShowDowngradeModal] = useState(false);
  const [selectedDowngradePlan, setSelectedDowngradePlan] = useState<string>('');
  const [downgradeLoading, setDowngradeLoading] = useState(false);

  // Scroll to comparison table
  const scrollToComparison = () => {
    const element = document.getElementById('upgrade-plans-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const currentPlanInfo = CANDIDATE_PLANS[currentPlan];
  const isPaidPlan = currentPlan !== 'free';

  const handleSelectPlan = (planId: string) => {
    if (planId === currentPlan) {
      return; // Already on this plan
    }
    
    const actionType = getPlanActionType(currentPlan, planId);
    
    if (actionType === 'downgrade') {
      // Show downgrade modal
      setSelectedDowngradePlan(planId);
      setShowDowngradeModal(true);
    } else {
      // Navigate to billing for upgrade or select
      navigate('/thanh-toan', { state: { selectedPlan: planId } });
    }
  };

  const handleDowngradeConfirm = () => {
    setDowngradeLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setDowngradeLoading(false);
      setShowDowngradeModal(false);
      toast.success(`Đã đặt lịch chuyển xuống ${CANDIDATE_PLANS[selectedDowngradePlan].name} vào kỳ tiếp theo`);
      eventTracker.track('plan_downgrade_scheduled', { 
        fromPlan: currentPlan,
        toPlan: selectedDowngradePlan 
      });
    }, 1500);
  };

  const quota = getPlanQuota(currentPlan);

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      <h1 className="text-3xl font-bold">Gói dịch vụ</h1>

      {/* Current Plan Card */}
      <Card className="p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-600 mb-2">Gói hiện tại</h3>
            <h2 className="text-3xl font-bold text-blue-600 mb-2">{currentPlanInfo.name}</h2>
            <p className="text-sm text-gray-600">{currentPlanInfo.description}</p>
          </div>
          <Badge className={`${isPaidPlan ? 'bg-blue-600' : 'bg-gray-400'} text-white px-4 py-2 text-sm`}>
            {currentPlanInfo.name}
          </Badge>
        </div>

        {/* Subscription Info */}
        {isPaidPlan && state.user?.subscriptionEndsAt && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-900">
              <strong>Gia hạn tự động:</strong> {state.user.subscriptionEndsAt.toLocaleDateString('vi-VN')}
            </p>
          </div>
        )}

        {/* Features */}
        <div className="mb-6">
          <h4 className="font-semibold mb-3 text-gray-700">Tính năng hiện tại:</h4>
          <div className="grid md:grid-cols-2 gap-2">
            {currentPlanInfo.features.map((feature, index) => (
              <div key={index} className="flex items-start gap-2">
                <CheckCircle size={16} className="text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Usage Stats */}
        {currentPlan !== 'yearly' && state.user && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold mb-3 text-gray-700">
              {currentPlan === 'free' ? 'Mức sử dụng (toàn bộ):' : 'Mức sử dụng hôm nay:'}
            </h4>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Tối ưu CV</span>
                  <span className="font-medium">
                    {state.user.cvOptimizationsDaily}/
                    {currentPlan === 'free' ? 3 : currentPlan === 'monthly' ? 3 : 5} lần
                  </span>
                </div>
                <Progress 
                  value={(state.user.cvOptimizationsDaily / (currentPlan === 'free' ? 3 : currentPlan === 'monthly' ? 3 : 5)) * 100} 
                />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Phỏng vấn AI</span>
                  <span className="font-medium">
                    {state.user.interviewsDaily}/
                    {currentPlan === 'free' ? 1 : currentPlan === 'monthly' ? 1 : 3} lần
                  </span>
                </div>
                <Progress 
                  value={(state.user.interviewsDaily / (currentPlan === 'free' ? 1 : currentPlan === 'monthly' ? 1 : 3)) * 100} 
                />
              </div>
            </div>
          </div>
        )}

        {/* CTAs */}
        <div className="flex gap-3">
          {currentPlan === 'free' ? (
            <>
              <Button onClick={scrollToComparison}>
                Nâng cấp gói
              </Button>
              <Button variant="outline" onClick={scrollToComparison}>
                Xem bảng so sánh
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={scrollToComparison}>
                Xem các gói khác
              </Button>
              <Button variant="outline" onClick={() => navigate('/huy-goi')}>
                Hủy gói
              </Button>
              <Button variant="outline" onClick={() => navigate('/hoa-don')}>
                Xem hóa đơn
              </Button>
            </>
          )}
        </div>
      </Card>

      {/* Payment Details for Paid Plans */}
      {isPaidPlan && (
        <Card className="p-6">
          <h3 className="font-bold mb-4">Chi tiết thanh toán</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Gói đăng ký</span>
              <span className="font-semibold">{currentPlanInfo.name}</span>
            </div>
            {currentPlanInfo.cycle && (
              <div className="flex justify-between">
                <span className="text-gray-600">Chu kỳ thanh toán</span>
                <span className="font-semibold">{currentPlanInfo.cycle}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">Giá/tháng</span>
              <span className="font-semibold">{currentPlanInfo.price.toLocaleString('vi-VN')}₫</span>
            </div>
            {currentPlanInfo.totalPrice && (
              <div className="flex justify-between">
                <span className="text-gray-600">Tổng thanh toán</span>
                <span className="font-semibold">{currentPlanInfo.totalPrice.toLocaleString('vi-VN')}₫</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between">
              <span className="text-gray-600">Phương thức thanh toán</span>
              <span className="font-semibold">
                {state.user?.paymentMethod === 'vnpay' ? 'VNPay' :
                 state.user?.paymentMethod === 'momo' ? 'MoMo' :
                 state.user?.paymentMethod === 'credit_card' ? 'Thẻ tín dụng' :
                 state.user?.paymentMethod === 'bank_transfer' ? 'Chuyển khoản' : 'Chưa thiết lập'}
              </span>
            </div>
          </div>
        </Card>
      )}

      {/* Upgrade Plans Section */}
      <div id="upgrade-plans-section">
        <h2 className="text-2xl font-bold mb-6">
          {currentPlan === 'free' ? 'Các gói phù hợp với bạn' : 'Các gói nâng cấp'}
        </h2>
        
        <div className="grid md:grid-cols-3 gap-6">
          {/* Monthly Plan */}
          <Card className={`p-6 flex flex-col ${currentPlan === 'monthly' ? 'border-2 border-blue-600 shadow-lg' : ''}`}>
            {currentPlan === 'monthly' && (
              <div className="mb-4">
                <Badge className="bg-blue-600 text-white">Gói hiện tại</Badge>
              </div>
            )}
            <h3 className="text-xl font-bold mb-2">{CANDIDATE_PLANS['monthly'].name}</h3>
            <p className="text-sm text-gray-600 mb-4 min-h-[60px]">{CANDIDATE_PLANS['monthly'].description}</p>
            <div className="mb-4">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold">{CANDIDATE_PLANS['monthly'].price.toLocaleString('vi-VN')}₫</span>
                <span className="text-gray-600">/tháng</span>
              </div>
            </div>
            {(() => {
              const actionType = getPlanActionType(currentPlan, 'monthly');
              const ctaText = getPlanCTAText(actionType, 'monthly');
              const ctaVariant = getPlanCTAVariant(actionType, false);
              return (
                <Button
                  className="w-full mb-4"
                  onClick={() => handleSelectPlan('monthly')}
                  disabled={actionType === 'current'}
                  variant={ctaVariant}
                >
                  {ctaText}
                </Button>
              );
            })()}
            <div className="space-y-2 flex-1 text-sm">
              {CANDIDATE_PLANS['monthly'].features.map((feature, index) => (
                <div key={index} className="flex items-start gap-2">
                  <Check className="text-green-600 flex-shrink-0 mt-0.5" size={14} />
                  <span className="text-xs">{feature}</span>
                </div>
              ))}
              {CANDIDATE_PLANS['monthly'].limitations && CANDIDATE_PLANS['monthly'].limitations.length > 0 && (
                <>
                  {CANDIDATE_PLANS['monthly'].limitations.map((limitation, index) => (
                    <div key={`limit-${index}`} className="flex items-start gap-2 text-gray-400">
                      <X className="flex-shrink-0 mt-0.5" size={14} />
                      <span className="text-xs">{limitation}</span>
                    </div>
                  ))}
                </>
              )}
            </div>
          </Card>

          {/* Quarterly Plan */}
          <Card className={`p-6 flex flex-col relative ${currentPlan === 'quarterly' ? 'border-2 border-purple-600 shadow-lg' : 'border-2 border-purple-200'}`}>
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-purple-600 text-white px-4 py-1 text-xs font-bold rounded-full whitespace-nowrap">
              {CANDIDATE_PLANS['quarterly'].badge}
            </div>
            {currentPlan === 'quarterly' && (
              <div className="mb-4 mt-3">
                <Badge className="bg-purple-600 text-white">Gói hiện tại</Badge>
              </div>
            )}
            {currentPlan !== 'quarterly' && <div className="h-3" />}
            <h3 className="text-xl font-bold mb-2">{CANDIDATE_PLANS['quarterly'].name}</h3>
            <p className="text-sm text-gray-600 mb-4 min-h-[60px]">{CANDIDATE_PLANS['quarterly'].description}</p>
            <div className="mb-4">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold">{CANDIDATE_PLANS['quarterly'].price.toLocaleString('vi-VN')}₫</span>
                <span className="text-gray-600">/tháng</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">{CANDIDATE_PLANS['quarterly'].savings}</p>
            </div>
            {(() => {
              const actionType = getPlanActionType(currentPlan, 'quarterly');
              const ctaText = getPlanCTAText(actionType, 'quarterly');
              const ctaVariant = getPlanCTAVariant(actionType, false);
              return (
                <Button
                  className="w-full mb-4"
                  onClick={() => handleSelectPlan('quarterly')}
                  disabled={actionType === 'current'}
                  variant={ctaVariant}
                >
                  {ctaText}
                </Button>
              );
            })()}
            <div className="space-y-2 flex-1 text-sm">
              {CANDIDATE_PLANS['quarterly'].features.map((feature, index) => (
                <div key={index} className="flex items-start gap-2">
                  <Check className="text-green-600 flex-shrink-0 mt-0.5" size={14} />
                  <span className="text-xs">{feature}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Yearly Plan */}
          <Card className={`p-6 flex flex-col relative ${currentPlan === 'yearly' ? 'border-2 border-green-600 shadow-lg' : 'border-2 border-green-200'}`}>
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-4 py-1 text-xs font-bold rounded-full whitespace-nowrap">
              {CANDIDATE_PLANS['yearly'].badge}
            </div>
            {currentPlan === 'yearly' && (
              <div className="mb-4 mt-3">
                <Badge className="bg-green-600 text-white">Gói hiện tại</Badge>
              </div>
            )}
            {currentPlan !== 'yearly' && <div className="h-3" />}
            <h3 className="text-xl font-bold mb-2">{CANDIDATE_PLANS['yearly'].name}</h3>
            <p className="text-sm text-gray-600 mb-4 min-h-[60px]">{CANDIDATE_PLANS['yearly'].description}</p>
            <div className="mb-4">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold">{CANDIDATE_PLANS['yearly'].price.toLocaleString('vi-VN')}₫</span>
                <span className="text-gray-600">/tháng</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">{CANDIDATE_PLANS['yearly'].savings}</p>
            </div>
            {(() => {
              const actionType = getPlanActionType(currentPlan, 'yearly');
              const ctaText = getPlanCTAText(actionType, 'yearly');
              const ctaVariant = getPlanCTAVariant(actionType, false);
              return (
                <Button
                  className="w-full mb-4"
                  onClick={() => handleSelectPlan('yearly')}
                  disabled={actionType === 'current'}
                  variant={ctaVariant}
                >
                  {ctaText}
                </Button>
              );
            })()}
            <div className="space-y-2 flex-1 text-sm">
              {CANDIDATE_PLANS['yearly'].features.map((feature, index) => (
                <div key={index} className="flex items-start gap-2">
                  <Check className="text-green-600 flex-shrink-0 mt-0.5" size={14} />
                  <span className="text-xs">{feature}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Comparison Table Section */}
      <div id="comparison-section" className="scroll-mt-6">
        <h2 className="text-2xl font-bold mb-6">Bảng so sánh chi tiết</h2>
        
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-4 font-bold">Tính năng</th>
                  <th className="text-center p-4 font-bold">Miễn phí</th>
                  <th className="text-center p-4 font-bold">Tháng</th>
                  <th className="text-center p-4 font-bold bg-purple-50">Quý</th>
                  <th className="text-center p-4 font-bold bg-green-50">Năm</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr>
                  <td className="p-4 font-medium">Tối ưu CV</td>
                  <td className="text-center p-4">3 lần/tài khoản</td>
                  <td className="text-center p-4">3 lần/ngày</td>
                  <td className="text-center p-4 bg-purple-50">5 lần/ngày</td>
                  <td className="text-center p-4 bg-green-50 font-semibold">Không giới hạn</td>
                </tr>
                <tr>
                  <td className="p-4 font-medium">Phỏng vấn AI</td>
                  <td className="text-center p-4">1 phiên/tài khoản</td>
                  <td className="text-center p-4">1 lần/ngày</td>
                  <td className="text-center p-4 bg-purple-50">3 lần/ngày</td>
                  <td className="text-center p-4 bg-green-50 font-semibold">Không giới hạn</td>
                </tr>
                <tr>
                  <td className="p-4 font-medium">Phỏng vấn với Mentor/người thật</td>
                  <td className="text-center p-4"><X className="text-red-500 inline" size={18} /></td>
                  <td className="text-center p-4"><X className="text-red-500 inline" size={18} /></td>
                  <td className="text-center p-4 bg-purple-50">3 lần/tháng</td>
                  <td className="text-center p-4 bg-green-50 font-semibold">1 lần/tuần</td>
                </tr>
                <tr>
                  <td className="p-4 font-medium">Model AI</td>
                  <td className="text-center p-4">Basic</td>
                  <td className="text-center p-4">Ổn định</td>
                  <td className="text-center p-4 bg-purple-50">Cao cấp</td>
                  <td className="text-center p-4 bg-green-50">Cao cấp</td>
                </tr>
                <tr>
                  <td className="p-4 font-medium">Phong cách AI interviewer & stress-test</td>
                  <td className="text-center p-4">Cơ bản</td>
                  <td className="text-center p-4">Đầy đủ 6 loại</td>
                  <td className="text-center p-4 bg-purple-50">Đầy đủ 6 loại</td>
                  <td className="text-center p-4 bg-green-50">Đầy đủ 6 loại</td>
                </tr>
                <tr>
                  <td className="p-4 font-medium">Báo cáo phân tích</td>
                  <td className="text-center p-4">Rút gọn</td>
                  <td className="text-center p-4">Toàn diện</td>
                  <td className="text-center p-4 bg-purple-50">Toàn diện</td>
                  <td className="text-center p-4 bg-green-50">Toàn diện</td>
                </tr>
                <tr>
                  <td className="p-4 font-medium">Phân tích kỹ năng giao tiếp</td>
                  <td className="text-center p-4"><X className="text-red-500 inline" size={18} /></td>
                  <td className="text-center p-4"><CheckCircle className="text-green-600 inline" size={18} /></td>
                  <td className="text-center p-4 bg-purple-50"><CheckCircle className="text-green-600 inline" size={18} /></td>
                  <td className="text-center p-4 bg-green-50"><CheckCircle className="text-green-600 inline" size={18} /></td>
                </tr>
                <tr>
                  <td className="p-4 font-medium">Xuất PDF</td>
                  <td className="text-center p-4"><X className="text-red-500 inline" size={18} /></td>
                  <td className="text-center p-4"><CheckCircle className="text-green-600 inline" size={18} /></td>
                  <td className="text-center p-4 bg-purple-50"><CheckCircle className="text-green-600 inline" size={18} /></td>
                  <td className="text-center p-4 bg-green-50"><CheckCircle className="text-green-600 inline" size={18} /></td>
                </tr>
                <tr>
                  <td className="p-4 font-medium">So sánh tiến bộ</td>
                  <td className="text-center p-4"><X className="text-red-500 inline" size={18} /></td>
                  <td className="text-center p-4"><CheckCircle className="text-green-600 inline" size={18} /></td>
                  <td className="text-center p-4 bg-purple-50"><CheckCircle className="text-green-600 inline" size={18} /></td>
                  <td className="text-center p-4 bg-green-50"><CheckCircle className="text-green-600 inline" size={18} /></td>
                </tr>
                <tr>
                  <td className="p-4 font-medium">So sánh benchmark ngành</td>
                  <td className="text-center p-4"><X className="text-red-500 inline" size={18} /></td>
                  <td className="text-center p-4"><CheckCircle className="text-green-600 inline" size={18} /></td>
                  <td className="text-center p-4 bg-purple-50"><CheckCircle className="text-green-600 inline" size={18} /></td>
                  <td className="text-center p-4 bg-green-50"><CheckCircle className="text-green-600 inline" size={18} /></td>
                </tr>
                <tr>
                  <td className="p-4 font-medium">Chọn mentor theo nhóm ngành</td>
                  <td className="text-center p-4"><X className="text-red-500 inline" size={18} /></td>
                  <td className="text-center p-4"><X className="text-red-500 inline" size={18} /></td>
                  <td className="text-center p-4 bg-purple-50"><X className="text-red-500 inline" size={18} /></td>
                  <td className="text-center p-4 bg-green-50"><CheckCircle className="text-green-600 inline" size={18} /></td>
                </tr>
                <tr>
                  <td className="p-4 font-medium">Lưu lịch sử không giới hạn</td>
                  <td className="text-center p-4"><X className="text-red-500 inline" size={18} /></td>
                  <td className="text-center p-4">30 ngày</td>
                  <td className="text-center p-4 bg-purple-50">90 ngày</td>
                  <td className="text-center p-4 bg-green-50"><CheckCircle className="text-green-600 inline" size={18} /></td>
                </tr>
                <tr>
                  <td className="p-4 font-medium">Hỗ trợ</td>
                  <td className="text-center p-4">Email</td>
                  <td className="text-center p-4">Email</td>
                  <td className="text-center p-4 bg-purple-50">Priority</td>
                  <td className="text-center p-4 bg-green-50">24/7 cao nhất</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Downgrade Confirm Modal */}
      <DowngradeConfirmModal
        isOpen={showDowngradeModal}
        onClose={() => setShowDowngradeModal(false)}
        onConfirm={handleDowngradeConfirm}
        loading={downgradeLoading}
        currentPlan={currentPlan}
        targetPlan={selectedDowngradePlan}
      />
    </div>
  );
};

// Invoices Page
export const InvoicesPage: React.FC = () => {
  const invoices = [
    { id: 1, date: '2026-02-01', amount: 149000, status: 'Đã thanh toán' },
    { id: 2, date: '2026-01-01', amount: 149000, status: 'Đã thanh toán' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Hóa đơn</h1>

      <div className="space-y-4">
        {invoices.map(invoice => (
          <Card key={invoice.id} className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold">Hóa đơn #{invoice.id}</h3>
                <p className="text-sm text-gray-600">
                  {new Date(invoice.date).toLocaleDateString('vi-VN')}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="font-bold">{invoice.amount.toLocaleString('vi-VN')}₫</div>
                  <Badge variant="secondary">{invoice.status}</Badge>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="mr-2" size={14} />
                  Tải PDF
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

// Email Center, Activity Log, Subscription Expired, Cancel Subscription, Delete Account
export const EmailCenterPage: React.FC = () => (
  <div className="max-w-4xl mx-auto"><Card className="p-12 text-center"><Mail className="w-16 h-16 text-gray-400 mx-auto mb-4" /><h1 className="text-2xl font-bold">Trung tâm Email</h1></Card></div>
);

export const ActivityLogPage: React.FC = () => {
  const events = eventTracker.getEvents();
  const feedback = getFeedback();

  const eventTypeLabels: Record<string, string> = {
    login: 'Đăng nhập',
    logout: 'Đăng xuất',
    signup_complete: 'Đăng ký',
    cv_upload: 'Tải CV',
    jd_analyze_start: 'Bắt đầu so khớp JD',
    jd_analyze_complete: 'Hoàn thành so khớp JD',
    interview_start: 'Bắt đầu phỏng vấn',
    interview_end: 'Kết thúc phỏng vấn',
    upgrade_modal_shown: 'Hiển thị modal nâng cấp',
    upgrade_success: 'Nâng cấp thành công',
    trial_started: 'Bắt đầu dùng thử',
    pdf_export_click: 'Xuất PDF',
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Nhật ký tương tác</h1>
        <p className="text-gray-600">Lịch sử hoạt động và góp ý của bạn</p>
      </div>

      {/* Events */}
      <Card className="p-6">
        <h3 className="font-bold mb-4">Sự kiện gần đây (20 sự kiện)</h3>
        {events.length === 0 ? (
          <p className="text-center text-gray-500 py-8">Chưa có sự kiện nào</p>
        ) : (
          <div className="space-y-2">
            {events.slice(0, 20).map(event => (
              <div key={event.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <Activity size={16} className="text-blue-600" />
                  <div>
                    <p className="font-medium text-sm">
                      {eventTypeLabels[event.type] || event.type}
                    </p>
                    {event.metadata && Object.keys(event.metadata).length > 0 && (
                      <p className="text-xs text-gray-500">
                        {JSON.stringify(event.metadata).slice(0, 50)}
                      </p>
                    )}
                  </div>
                </div>
                <span className="text-xs text-gray-500">
                  {event.timestamp.toLocaleTimeString('vi-VN')}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Feedback */}
      <Card className="p-6">
        <h3 className="font-bold mb-4 flex items-center gap-2">
          <MessageSquare size={20} />
          Góp ý của bạn
        </h3>
        {feedback.length === 0 ? (
          <p className="text-center text-gray-500 py-8">Bạn chưa gửi góp ý nào</p>
        ) : (
          <div className="space-y-3">
            {feedback.map(item => (
              <div key={item.id} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline">{item.type}</Badge>
                  <span className="text-xs text-gray-500">
                    {item.timestamp.toLocaleDateString('vi-VN')}
                  </span>
                </div>
                <p className="text-sm text-gray-700">{item.description}</p>
                {item.email && (
                  <p className="text-xs text-gray-500 mt-2">Email: {item.email}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export const SubscriptionExpiredPage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <Card className="p-12 text-center max-w-md mx-auto">
      <AlertCircle className="w-16 h-16 text-orange-600 mx-auto mb-4" />
      <h1 className="text-2xl font-bold mb-2">Gói đã hết hạn</h1>
      <p className="text-gray-600 mb-6">Chọn gói phù hợp để tiếp tục sử dụng tính năng nâng cao</p>
      <Button onClick={() => navigate('/goi-dich-vu')}>Nâng cấp ngay</Button>
    </Card>
  );
};

export const CancelSubscriptionPage: React.FC = () => {
  const { cancelSubscription, state } = useApp();
  const navigate = useNavigate();
  const currentPlan = state.user?.subscriptionPlan || 'free';
  const planName = currentPlan === 'monthly' ? 'Gói Tháng' : 
                   currentPlan === 'quarterly' ? 'Gói Quý' : 
                   currentPlan === 'yearly' ? 'Gói Năm' : 'Gói Miễn phí';
  
  const handleCancel = () => {
    if (confirm(`Bạn có chắc chắn muốn hủy ${planName}?`)) {
      cancelSubscription();
      navigate('/dashboard');
    }
  };

  return (
    <Card className="p-8 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Hủy {planName}</h1>
      <p className="text-gray-600 mb-6">
        Bạn sẽ vẫn sử dụng được {planName} đến hết kỳ thanh toán hiện tại.
        Sau đó tài khoản sẽ chuyển về gói Miễn phí.
      </p>
      <div className="flex gap-3">
        <Button variant="destructive" onClick={handleCancel}>
          Xác nhận hủy
        </Button>
        <Button variant="outline" onClick={() => navigate('/goi-dich-vu')}>
          Quay lại
        </Button>
      </div>
    </Card>
  );
};

export const DeleteAccountPage: React.FC = () => {
  const { logout } = useApp();
  const navigate = useNavigate();
  const [confirmText, setConfirmText] = useState('');

  const handleDelete = () => {
    if (confirmText === 'XOA TAI KHOAN') {
      alert('Tài khoản đã được xóa');
      logout();
      navigate('/');
    }
  };

  return (
    <Card className="p-8 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-red-600">Xóa tài khoản</h1>
      <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded">
        <p className="text-sm text-red-900 font-semibold">⚠️ Cảnh báo:</p>
        <ul className="text-sm text-red-800 mt-2 space-y-1">
          <li>• Tất cả dữ liệu sẽ bị xóa vĩnh viễn</li>
          <li>• Không thể khôi phục</li>
          <li>• Gói trả phí sẽ bị hủy ngay lập tức</li>
        </ul>
      </div>
      <div className="space-y-4">
        <div>
          <Label>Nhập "XOA TAI KHOAN" để xác nhận</Label>
          <Input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} />
        </div>
        <div className="flex gap-3">
          <Button 
            variant="destructive" 
            disabled={confirmText !== 'XOA TAI KHOAN'}
            onClick={handleDelete}
          >
            Xóa vĩnh viễn
          </Button>
          <Button variant="outline" onClick={() => navigate('/cai-dat')}>
            Hủy
          </Button>
        </div>
      </div>
    </Card>
  );
};

// Help Center Page (internal - no external redirect)
export const HelpCenterPage: React.FC = () => {
  const navigate = useNavigate();
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const { state } = useApp();
  
  const helpCategories = [
    {
      title: 'Tối ưu CV',
      icon: FileText,
      articles: [
        'Cách tải CV lên hệ thống',
        'Làm thế nào để so khớp CV với JD?',
        'Hiểu điểm matching và cách cải thiện',
        'Xuất CV đã tối ưu'
      ]
    },
    {
      title: 'Phỏng vấn AI',
      icon: MessageSquare,
      articles: [
        'Bắt đầu buổi phỏng vấn đầu tiên',
        'Chọn mô hình AI phù hợp',
        'Sử dụng microphone hiệu quả',
        'Đọc và hiểu báo cáo phỏng vấn'
      ]
    },
    {
      title: 'Báo cáo & Thống kê',
      icon: BarChart3,
      articles: [
        'Xem lịch sử báo cáo',
        'So sánh với trung bình ngành',
        'Xuất báo cáo PDF (Gói trả phí)',
        'Theo dõi tiến độ cải thiện'
      ]
    },
    {
      title: 'Gói dịch vụ',
      icon: Target,
      articles: [
        'So sánh các gói dịch vụ',
        'Dùng thử 7 ngày miễn phí',
        'Nâng cấp và thanh toán',
        'Hủy gói dịch vụ'
      ]
    }
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Trung tâm trợ giúp</h1>
          <p className="text-gray-600">
            Tìm câu trả lời cho các thắc mắc thường gặp
          </p>
        </div>
        <Button onClick={() => navigate('/dashboard')}>
          Quay lại Dashboard
        </Button>
      </div>

      {/* Search */}
      <Card className="p-6">
        <div className="relative">
          <Input 
            placeholder="Tìm kiếm bài viết hỗ trợ..." 
            className="pl-10"
          />
          <HelpCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        </div>
      </Card>

      {/* Categories */}
      <div className="grid md:grid-cols-2 gap-6">
        {helpCategories.map((category, idx) => {
          const Icon = category.icon;
          return (
            <Card key={idx} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold">{category.title}</h3>
              </div>
              <ul className="space-y-2">
                {category.articles.map((article, i) => (
                  <li key={i}>
                    <button className="text-sm text-blue-600 hover:text-blue-800 text-left hover:underline">
                      {article}
                    </button>
                  </li>
                ))}
              </ul>
            </Card>
          );
        })}
      </div>

      {/* Contact Support */}
      <Card className="p-8 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold mb-2">Vẫn cần hỗ trợ?</h3>
            <p className="text-gray-600">
              Đội ngũ INTER-VIET sẵn sàng hỗ trợ bạn 24/7
            </p>
          </div>
          <Button 
            type="button"
            onClick={() => setIsContactModalOpen(true)}
          >
            Liên hệ hỗ trợ
          </Button>
        </div>
      </Card>

      {/* Contact Support Modal */}
      <ContactSupportModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        userEmail={state.user?.email}
        sourcePage="/tro-giup"
      />
    </div>
  );
};
import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { useApp } from '../contexts/AppContext';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Switch } from '../components/ui/switch';
import { Badge } from '../components/ui/badge';
import { Check, X, Sparkles, Shield, RotateCcw, TrendingUp, Clock, Zap, Users, Trophy } from 'lucide-react';
import { eventTracker } from '../utils/eventTracker';
import { toast } from 'sonner';
import { CANDIDATE_PLANS } from '../config/pricing';

export const PricingPage: React.FC = () => {
  const { state, startTrial } = useApp();
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'quarterly' | 'yearly'>('quarterly');

  const plans = Object.values(CANDIDATE_PLANS);

  const handleSelectPlan = (planId: string) => {
    if (!state.user) {
      navigate('/dang-ky');
      eventTracker.track('pricing_cta_click', { planId, authenticated: false });
      return;
    }

    if (planId === 'free') {
      toast.info('Bạn đang sử dụng gói miễn phí');
      return;
    }

    // Navigate to billing page with selected plan
    navigate('/thanh-toan', { state: { selectedPlan: planId } });
    eventTracker.track('pricing_cta_click', { planId, role: state.user.role });
  };

  const handleStartTrial = () => {
    if (!state.user) {
      navigate('/dang-ky');
      return;
    }
    
    if (state.user.role === 'free') {
      startTrial();
      eventTracker.track('trial_started_from_pricing');
    }
  };

  return (
    <div>
      {/* Header */}
      <section className="bg-gradient-to-br from-blue-600 to-purple-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h1 className="text-5xl font-bold mb-4">
            Chọn gói phù hợp với bạn
          </h1>
          <p className="text-xl text-blue-100 mb-8">
            Linh hoạt, minh bạch và không ràng buộc dài hạn
          </p>
          
          {/* Trial CTA */}
          {state.user?.role === 'free' && (
            <div className="mb-8">
              <Button 
                size="lg" 
                variant="secondary"
                onClick={handleStartTrial}
                className="shadow-lg"
              >
                <Sparkles className="mr-2" size={20} />
                Dùng thử 7 ngày miễn phí
              </Button>
              <p className="text-sm text-blue-100 mt-2">
                Không cần thẻ tín dụng
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan) => (
              <Card 
                key={plan.id}
                className={`p-6 flex flex-col ${plan.popular ? 'border-2 border-purple-600 shadow-xl relative' : ''}`}
              >
                {plan.badge && (
                  <div className={`absolute -top-3 left-1/2 transform -translate-x-1/2 ${plan.badgeColor} text-white px-4 py-1 text-xs font-bold rounded-full whitespace-nowrap`}>
                    {plan.badge}
                  </div>
                )}

                <div className="mb-4">
                  <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                  <p className="text-sm text-gray-600 min-h-[40px]">{plan.description}</p>
                </div>

                <div className="mb-4">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold">
                      {plan.price.toLocaleString('vi-VN')}₫
                    </span>
                    <span className="text-gray-600">/{plan.cycle}</span>
                  </div>
                  {plan.savings && (
                    <p className="text-xs text-gray-500 mt-1">
                      {plan.savings}
                    </p>
                  )}
                </div>

                <Button 
                  className="w-full mb-4"
                  variant={plan.popular ? 'default' : 'outline'}
                  onClick={() => handleSelectPlan(plan.id)}
                  disabled={state.user?.role === 'free' && plan.id === 'free'}
                >
                  {state.user?.subscriptionPlan === plan.id ? 'Gói hiện tại' : (plan.id === 'free' ? 'Gói hiện tại' : 'Chọn gói này')}
                </Button>

                <div className="space-y-2 flex-1">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <Check className="text-green-600 flex-shrink-0 mt-0.5" size={16} />
                      <span className="text-xs">{feature}</span>
                    </div>
                  ))}
                  {plan.limitations && plan.limitations.length > 0 && (
                    <>
                      <div className="pt-2">
                        {plan.limitations.map((limitation, index) => (
                          <div key={index} className="flex items-start gap-2 text-gray-400">
                            <X className="flex-shrink-0 mt-0.5" size={16} />
                            <span className="text-xs line-through">{limitation}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold mb-8 text-center">So sánh chi tiết các gói</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2">
                  <th className="text-left p-4">Tính năng</th>
                  <th className="text-center p-4">Miễn phí</th>
                  <th className="text-center p-4">Tháng</th>
                  <th className="text-center p-4 bg-purple-50">Quý</th>
                  <th className="text-center p-4 bg-green-50">Năm</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-4 font-medium">Tối ưu CV</td>
                  <td className="text-center p-4">3 lần/tài khoản</td>
                  <td className="text-center p-4">3 lần/ngày</td>
                  <td className="text-center p-4 bg-purple-50">5 lần/ngày</td>
                  <td className="text-center p-4 bg-green-50">Không giới hạn</td>
                </tr>
                <tr className="border-b">
                  <td className="p-4 font-medium">Phỏng vấn AI</td>
                  <td className="text-center p-4">1 phiên/tài khoản</td>
                  <td className="text-center p-4">1 lần/ngày</td>
                  <td className="text-center p-4 bg-purple-50">3 lần/ngày</td>
                  <td className="text-center p-4 bg-green-50">Không giới hạn</td>
                </tr>
                <tr className="border-b">
                  <td className="p-4 font-medium">Phỏng vấn với Mentor</td>
                  <td className="text-center p-4"><X className="text-red-500 inline" size={18} /></td>
                  <td className="text-center p-4"><X className="text-red-500 inline" size={18} /></td>
                  <td className="text-center p-4 bg-purple-50">3 lần/tháng</td>
                  <td className="text-center p-4 bg-green-50">1 lần/tuần</td>
                </tr>
                <tr className="border-b">
                  <td className="p-4 font-medium">Model AI</td>
                  <td className="text-center p-4">Basic</td>
                  <td className="text-center p-4">Ổn định</td>
                  <td className="text-center p-4 bg-purple-50">Cao cấp</td>
                  <td className="text-center p-4 bg-green-50">Cao cấp</td>
                </tr>
                <tr className="border-b">
                  <td className="p-4 font-medium">Xuất PDF</td>
                  <td className="text-center p-4"><X className="text-red-500 inline" size={18} /></td>
                  <td className="text-center p-4"><Check className="text-green-600 inline" size={18} /></td>
                  <td className="text-center p-4 bg-purple-50"><Check className="text-green-600 inline" size={18} /></td>
                  <td className="text-center p-4 bg-green-50"><Check className="text-green-600 inline" size={18} /></td>
                </tr>
                <tr className="border-b">
                  <td className="p-4 font-medium">Chọn mentor theo nhóm ngành</td>
                  <td className="text-center p-4"><X className="text-red-500 inline" size={18} /></td>
                  <td className="text-center p-4"><X className="text-red-500 inline" size={18} /></td>
                  <td className="text-center p-4 bg-purple-50"><X className="text-red-500 inline" size={18} /></td>
                  <td className="text-center p-4 bg-green-50"><Check className="text-green-600 inline" size={18} /></td>
                </tr>
                <tr className="border-b">
                  <td className="p-4 font-medium">Lưu lịch sử không giới hạn</td>
                  <td className="text-center p-4"><X className="text-red-500 inline" size={18} /></td>
                  <td className="text-center p-4">30 ngày</td>
                  <td className="text-center p-4 bg-purple-50">90 ngày</td>
                  <td className="text-center p-4 bg-green-50"><Check className="text-green-600 inline" size={18} /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-bold mb-8 text-center">Câu hỏi thường gặp</h2>
          
          <div className="space-y-4">
            <Card className="p-6">
              <h3 className="font-bold mb-2">Tôi có thể hủy bất cứ lúc nào không?</h3>
              <p className="text-sm text-gray-600">
                Có, bạn có thể hủy gói đã đăng ký bất cứ lúc nào. Bạn sẽ vẫn sử dụng được đến hết kỳ đã thanh toán.
              </p>
            </Card>

            <Card className="p-6">
              <h3 className="font-bold mb-2">Dùng thử 7 ngày miễn phí có mất phí không?</h3>
              <p className="text-sm text-gray-600">
                Hoàn toàn miễn phí. Bạn không cần nhập thẻ tín dụng và sẽ tự động chuyển về gói Free sau 7 ngày nếu không nâng cấp.
              </p>
            </Card>

            <Card className="p-6">
              <h3 className="font-bold mb-2">Tôi có thể đổi gói giữa chừng không?</h3>
              <p className="text-sm text-gray-600">
                Có, bạn có thể nâng cấp hoặc hạ cấp bất cứ lúc nào. Phí sẽ được tính theo tỷ lệ thời gian sử dụng.
              </p>
            </Card>

            <Card className="p-6">
              <h3 className="font-bold mb-2">Có hỗ trợ hoàn tiền không?</h3>
              <p className="text-sm text-gray-600">
                Chúng tôi có chính sách hoàn tiền 100% trong vòng 14 ngày nếu bạn không hài lòng với dịch vụ.
              </p>
            </Card>

            <Card className="p-6">
              <h3 className="font-bold mb-2">Gói Năm có chuyển đổi chủ sở hữu là gì?</h3>
              <p className="text-sm text-gray-600">
                Bạn có thể chuyển giao quyền sử dụng gói Năm cho người thân hoặc bạn bè 2-3 lần trong năm. Tính năng này giúp bạn chia sẻ lợi ích với những người quan trọng.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Bắt đầu ngay hôm nay
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Hàng nghìn người Việt đã cải thiện cơ hội nghề nghiệp với INTER-VIET
          </p>
          <Button 
            size="lg" 
            variant="secondary"
            onClick={() => state.user ? handleSelectPlan('quarterly') : navigate('/dang-ky')}
          >
            <Sparkles className="mr-2" size={20} />
            {state.user ? 'Chọn gói Quý - PHỔ BIẾN NHẤT' : 'Đăng ký miễn phí'}
          </Button>
        </div>
      </section>
    </div>
  );
};
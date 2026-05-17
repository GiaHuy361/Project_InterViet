import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { useApp } from '../contexts/AppContext';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { Loader2, CheckCircle, CreditCard, Smartphone, Building2, ArrowLeft } from 'lucide-react';
import type { SubscriptionPlan, PaymentMethod } from '../contexts/AppContext';
import { toast } from 'sonner';
import { Badge } from '../components/ui/badge';
import { CANDIDATE_PLANS } from '../config/pricing';

export const BillingPage: React.FC = () => {
  const { upgradeToPremium, addNotification, state } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  
  const selectedPlanFromState = (location.state as any)?.selectedPlan || 'quarterly';
  
  // Ensure we don't allow selecting 'free' plan in billing page
  const validPlan = selectedPlanFromState === 'free' ? 'quarterly' : selectedPlanFromState;
  
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>(validPlan);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('vnpay');
  const [loading, setLoading] = useState(false);
  
  // Credit card fields
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [name, setName] = useState('');
  
  // VNPay/Momo fields
  const [phoneNumber, setPhoneNumber] = useState('');

  const paymentMethods = [
    {
      id: 'vnpay' as PaymentMethod,
      name: 'VNPay',
      icon: <CreditCard className="w-5 h-5" />,
      description: 'Thanh toán qua VNPay',
    },
    {
      id: 'momo' as PaymentMethod,
      name: 'MoMo',
      icon: <Smartphone className="w-5 h-5" />,
      description: 'Ví điện tử MoMo',
    },
    {
      id: 'credit_card' as PaymentMethod,
      name: 'Thẻ tín dụng/ghi nợ',
      icon: <CreditCard className="w-5 h-5" />,
      description: 'Visa, Mastercard, JCB',
    },
    {
      id: 'bank_transfer' as PaymentMethod,
      name: 'Chuyển khoản',
      icon: <Building2 className="w-5 h-5" />,
      description: 'Chuyển khoản ngân hàng',
    },
  ];

  const currentPlan = CANDIDATE_PLANS[selectedPlan];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate payment processing
    setTimeout(() => {
      upgradeToPremium(selectedPlan, paymentMethod);
      addNotification({
        title: 'Thanh toán thành công!',
        message: `Bạn đã nâng cấp lên ${currentPlan.name} thành công`,
        type: 'success',
        read: false
      });
      setLoading(false);
      toast.success('Thanh toán thành công!');
      navigate('/goi-dich-vu');
    }, 2000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Quay lại
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold mb-2">Thanh toán</h1>
        <p className="text-gray-600">
          Hoàn tất thanh toán để nâng cấp gói dịch vụ
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Plan Selection & Payment Method */}
        <div className="lg:col-span-2 space-y-6">
          {/* Plan Selection */}
          <Card className="p-6">
            <h3 className="font-bold mb-4">Chọn gói thanh toán</h3>
            <RadioGroup value={selectedPlan} onValueChange={(value) => setSelectedPlan(value as SubscriptionPlan)}>
              <div className="space-y-3">
                {Object.entries(CANDIDATE_PLANS)
                  .filter(([key]) => key !== 'free')
                  .map(([key, plan]) => (
                  <div 
                    key={key}
                    className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedPlan === key ? 'border-blue-600 bg-blue-50' : 'hover:border-gray-400'
                    }`}
                    onClick={() => setSelectedPlan(key as SubscriptionPlan)}
                  >
                    <RadioGroupItem value={key} id={key} className="mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Label htmlFor={key} className="font-semibold cursor-pointer">
                          {plan.name}
                        </Label>
                        {plan.badge && (
                          <Badge className={`${plan.badgeColor} text-white text-xs`}>{plan.badge}</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{plan.description}</p>
                      <div className="flex items-baseline gap-2 mt-2">
                        <span className="text-2xl font-bold">{plan.price.toLocaleString('vi-VN')}₫</span>
                        <span className="text-gray-500">/tháng</span>
                      </div>
                      {plan.savings && (
                        <p className="text-xs text-gray-500 mt-1">{plan.savings}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </Card>

          {/* Payment Method */}
          <Card className="p-6">
            <h3 className="font-bold mb-4">Phương thức thanh toán</h3>
            <RadioGroup value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}>
              <div className="space-y-3">
                {paymentMethods.map((method) => (
                  <div 
                    key={method.id}
                    className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-all ${
                      paymentMethod === method.id ? 'border-blue-600 bg-blue-50' : 'hover:border-gray-400'
                    }`}
                    onClick={() => setPaymentMethod(method.id)}
                  >
                    <RadioGroupItem value={method.id} id={method.id} />
                    <div className="flex items-center gap-3 flex-1">
                      {method.icon}
                      <div>
                        <Label htmlFor={method.id} className="font-semibold cursor-pointer">
                          {method.name}
                        </Label>
                        <p className="text-sm text-gray-500">{method.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </Card>

          {/* Payment Details Form */}
          <Card className="p-6">
            <h3 className="font-bold mb-4">Thông tin thanh toán</h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {paymentMethod === 'credit_card' && (
                <>
                  <div>
                    <Label htmlFor="name">Tên chủ thẻ</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="NGUYEN VAN A"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="card">Số thẻ</Label>
                    <Input
                      id="card"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      placeholder="1234 5678 9012 3456"
                      maxLength={19}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="expiry">Ngày hết hạn</Label>
                      <Input
                        id="expiry"
                        value={expiryDate}
                        onChange={(e) => setExpiryDate(e.target.value)}
                        placeholder="MM/YY"
                        maxLength={5}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="cvv">CVV</Label>
                      <Input
                        id="cvv"
                        type="password"
                        value={cvv}
                        onChange={(e) => setCvv(e.target.value)}
                        placeholder="123"
                        maxLength={3}
                        required
                      />
                    </div>
                  </div>
                </>
              )}

              {(paymentMethod === 'vnpay' || paymentMethod === 'momo') && (
                <div>
                  <Label htmlFor="phone">Số điện thoại</Label>
                  <Input
                    id="phone"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="0912345678"
                    maxLength={10}
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Bạn sẽ được chuyển đến trang thanh toán {paymentMethod === 'vnpay' ? 'VNPay' : 'MoMo'}
                  </p>
                </div>
              )}

              {paymentMethod === 'bank_transfer' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm font-semibold mb-2">Thông tin chuyển khoản:</p>
                  <div className="space-y-1 text-sm">
                    <p><strong>Ngân hàng:</strong> Vietcombank</p>
                    <p><strong>Số tài khoản:</strong> 1234567890</p>
                    <p><strong>Chủ tài khoản:</strong> INTER-VIET JSC</p>
                    <p><strong>Nội dung:</strong> INTERVIET {state.user?.email}</p>
                  </div>
                </div>
              )}

              <div className="pt-4">
                <Button type="submit" className="w-full" size="lg" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 animate-spin" size={20} />
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2" size={20} />
                      Thanh toán {currentPlan.totalPrice.toLocaleString('vi-VN')}₫
                    </>
                  )}
                </Button>
              </div>
            </form>

            <div className="mt-6 pt-6 border-t">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <CheckCircle size={16} className="text-green-600" />
                <span>Thanh toán an toàn & bảo mật SSL 256-bit</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column - Order Summary */}
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="font-bold mb-4">Tóm tắt đơn hàng</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">{currentPlan.name}</span>
                <span className="font-semibold">{currentPlan.totalPrice.toLocaleString('vi-VN')}₫</span>
              </div>
              <div className="flex justify-between text-sm text-gray-500">
                <span>Thời hạn:</span>
                <span>{currentPlan.duration}</span>
              </div>
              {selectedPlan === 'quarterly' && (
                <div className="flex justify-between text-sm">
                  <span className="text-green-600">Tiết kiệm:</span>
                  <span className="font-semibold text-green-600">-60.000₫</span>
                </div>
              )}
              {selectedPlan === 'yearly' && (
                <div className="flex justify-between text-sm">
                  <span className="text-green-600">Tiết kiệm:</span>
                  <span className="font-semibold text-green-600">-480.000₫</span>
                </div>
              )}
              <hr />
              <div className="flex justify-between text-lg">
                <span className="font-bold">Tổng cộng</span>
                <span className="font-bold">{currentPlan.totalPrice.toLocaleString('vi-VN')}₫</span>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-blue-50 border-blue-200">
            <h4 className="font-semibold mb-3">Bạn sẽ nhận được:</h4>
            <ul className="space-y-2 text-sm">
              {currentPlan.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-2">
                  <CheckCircle size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-6 bg-green-50 border-green-200">
            <h4 className="font-semibold mb-2 text-green-800">Chính sách hoàn tiền</h4>
            <p className="text-sm text-green-700">
              Hoàn tiền 100% trong vòng 14 ngày nếu bạn không hài lòng với dịch vụ.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};
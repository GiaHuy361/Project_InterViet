import React from 'react';
import { useNavigate } from 'react-router';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Check, X, Sparkles, Zap } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feature?: string;
  reason?: string;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({ 
  open, 
  onOpenChange,
  feature = 'tính năng này',
  reason = 'Tính năng này dành riêng cho các gói trả phí.'
}) => {
  const { state, startTrial } = useApp();
  const navigate = useNavigate();

  const handleUpgrade = () => {
    onOpenChange(false);
    navigate('/goi-dich-vu'); // Changed from '/bang-gia' to '/goi-dich-vu'
  };

  const handleStartTrial = () => {
    startTrial();
    onOpenChange(false);
  };

  const isEligibleForTrial = state.user?.role === 'free' && !state.user?.trialEndsAt;

  const premiumFeatures = [
    'Gói Tháng: 3 lần/ngày CV, 1 lần/ngày phỏng vấn AI - 149k/tháng',
    'Gói Quý: 5 lần/ngày CV, 3 lần/ngày phỏng vấn AI - 129k/tháng',
    'Gói Năm: Không giới hạn tất cả - 109k/tháng',
    'Đầy đủ 6 phong cách AI interviewer & stress-test',
    'Phỏng vấn 1-1 với Mentor (Quý: 3 lần/tháng, Năm: 1 lần/tuần)',
    'Báo cáo phân tích toàn diện',
    'Xuất PDF báo cáo chuyên nghiệp',
    'So sánh tiến bộ & benchmark ngành',
  ];

  const yearlyBonusFeatures = [
    'Model AI cao cấp',
    'Chọn mentor theo nhóm ngành',
    'Lưu lịch sử, video không giới hạn thời gian',
    'Hỗ trợ ưu tiên 24/7 cao nhất',
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <DialogTitle>Nâng cấp gói dịch vụ</DialogTitle>
          </div>
          <DialogDescription>{reason}</DialogDescription>
        </DialogHeader>

        {/* Current limits for free users */}
        {state.user?.role === 'free' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 my-4">
            <h4 className="font-semibold text-sm mb-2">Giới hạn hiện tại của bạn:</h4>
            <div className="space-y-1 text-sm text-gray-700">
              <div className="flex justify-between">
                <span>Tối ưu CV hôm nay:</span>
                <span className="font-medium">{state.user.cvOptimizationsDaily}/3</span>
              </div>
              <div className="flex justify-between">
                <span>Phỏng vấn hôm nay:</span>
                <span className="font-medium">{state.user.interviewsDaily}/1</span>
              </div>
            </div>
          </div>
        )}

        {/* Premium features */}
        <div className="space-y-2 my-4">
          <h4 className="font-semibold text-sm">Nâng cấp để mở khóa:</h4>
          {premiumFeatures.map((feature, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-gray-700">{feature}</span>
            </div>
          ))}
        </div>

        {/* Yearly bonus features */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 my-4">
          <h4 className="font-semibold text-sm mb-2 text-green-800">Gói Năm - Ưu đãi đặc biệt:</h4>
          {yearlyBonusFeatures.map((feature, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <Zap className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <span className="text-xs text-gray-700">{feature}</span>
            </div>
          ))}
        </div>

        {/* Mini testimonial */}
        <div className="bg-gray-50 rounded-lg p-4 my-4 border border-gray-200">
          <p className="text-sm text-gray-700 italic">
            "Nhờ gói Quý của INTER-VIET, tôi đã cải thiện CV và nhận được 3 lời mời phỏng vấn chỉ sau 2 tuần!"
          </p>
          <p className="text-xs text-gray-500 mt-2">— Nguyễn Minh A., Marketing Manager</p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          {isEligibleForTrial && (
            <Button onClick={handleStartTrial} className="w-full" size="lg">
              <Sparkles className="mr-2" size={16} />
              Dùng thử 7 ngày miễn phí
            </Button>
          )}
          <Button 
            onClick={handleUpgrade} 
            className="w-full" 
            variant={isEligibleForTrial ? 'outline' : 'default'}
            size="lg"
          >
            {isEligibleForTrial ? 'Xem bảng giá & chọn gói' : 'Xem bảng giá'}
          </Button>
          <Button 
            onClick={() => onOpenChange(false)} 
            variant="ghost" 
            className="w-full"
          >
            Tiếp tục miễn phí
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
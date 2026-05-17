import React, { useState, useEffect } from 'react';
import { X, Play, Gift, Sparkles, CheckCircle2 } from 'lucide-react';
import { Button } from './ui/button';

interface AdRewardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRewardClaimed: () => void;
}

export const AdRewardModal: React.FC<AdRewardModalProps> = ({
  isOpen,
  onClose,
  onRewardClaimed,
}) => {
  const [countdown, setCountdown] = useState(20); // 20 seconds demo ad
  const [isWatching, setIsWatching] = useState(false);
  const [canClaim, setCanClaim] = useState(false);
  const [isClaimed, setIsClaimed] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCountdown(20);
      setIsWatching(false);
      setCanClaim(false);
      setIsClaimed(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isWatching && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (isWatching && countdown === 0) {
      setCanClaim(true);
    }
  }, [isWatching, countdown]);

  const handleStartWatching = () => {
    setIsWatching(true);
  };

  const handleClaim = () => {
    setIsClaimed(true);
    onRewardClaimed();
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden">
        {/* Close button - only show before starting or after claiming */}
        {(!isWatching || isClaimed) && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors shadow-md"
          >
            <X size={20} className="text-gray-600" />
          </button>
        )}

        {!isWatching ? (
          // Pre-watch screen
          <div className="p-8 text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Gift className="text-white" size={40} />
            </div>
            <h2 className="text-2xl font-bold mb-3">Nhận thêm lượt miễn phí</h2>
            <p className="text-gray-600 mb-6 text-sm leading-relaxed">
              Xem quảng cáo trong 20 giây để nhận thêm <strong>1 lượt tối ưu CV</strong> ngay hôm nay
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6">
              <p className="text-xs text-gray-700 font-medium">
                💡 Mẹo: Bạn có thể xem quảng cáo nhiều lần để nhận thêm lượt
              </p>
            </div>
            <Button
              onClick={handleStartWatching}
              className="w-full h-12 rounded-xl font-semibold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all"
            >
              <Play size={20} className="mr-2" />
              Bắt đầu xem quảng cáo
            </Button>
          </div>
        ) : isClaimed ? (
          // Success screen
          <div className="p-8 text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mx-auto mb-6 shadow-lg animate-bounce">
              <CheckCircle2 className="text-white" size={40} />
            </div>
            <h2 className="text-2xl font-bold mb-3 text-green-600">Đã nhận thưởng!</h2>
            <p className="text-gray-600 text-sm">
              Bạn đã nhận thêm <strong>1 lượt tối ưu CV</strong>
            </p>
          </div>
        ) : (
          // Ad viewing screen
          <div>
            {/* Ad demo badge */}
            <div className="absolute top-4 left-4 z-10 px-3 py-1.5 bg-black/70 backdrop-blur-sm rounded-full">
              <p className="text-xs text-white font-semibold">Quảng cáo minh họa</p>
            </div>

            {/* Countdown badge */}
            <div className="absolute top-4 right-4 z-10 px-4 py-2 bg-black/70 backdrop-blur-sm rounded-full">
              <p className="text-sm text-white font-bold">{countdown}s</p>
            </div>

            {/* Demo Ad Content - Placeholder */}
            <div className="relative h-96 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 flex items-center justify-center">
              <div className="text-center px-8">
                <div className="w-24 h-24 rounded-3xl bg-white/20 backdrop-blur-md flex items-center justify-center mx-auto mb-6 shadow-2xl">
                  <Sparkles className="text-white" size={48} />
                </div>
                <h3 className="text-3xl font-bold text-white mb-3">
                  Demo Advertisement
                </h3>
                <p className="text-white/90 text-lg mb-6">
                  Đây là nội dung quảng cáo mô phỏng
                </p>
                <div className="inline-block px-6 py-2 bg-white/20 backdrop-blur-md rounded-full">
                  <p className="text-white text-sm font-semibold">
                    Sản phẩm/Dịch vụ mẫu
                  </p>
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="relative h-2 bg-gray-200">
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-1000 ease-linear"
                style={{ width: `${((20 - countdown) / 20) * 100}%` }}
              />
            </div>

            {/* Bottom section */}
            <div className="p-6 bg-white">
              {canClaim ? (
                <Button
                  onClick={handleClaim}
                  className="w-full h-12 rounded-xl font-semibold bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all"
                >
                  <Gift size={20} className="mr-2" />
                  Nhận thêm 1 lượt tối ưu CV
                </Button>
              ) : (
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-2 font-medium">
                    Đang xem quảng cáo...
                  </p>
                  <p className="text-xs text-gray-500">
                    Vui lòng chờ {countdown} giây để nhận thưởng
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

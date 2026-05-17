import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog';
import { CANDIDATE_PLANS } from '../config/pricing';

interface DowngradeConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  currentPlan: string;
  targetPlan: string;
  loading?: boolean;
}

export const DowngradeConfirmModal: React.FC<DowngradeConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  currentPlan,
  targetPlan,
  loading = false,
}) => {
  const currentPlanInfo = CANDIDATE_PLANS[currentPlan];
  const targetPlanInfo = CANDIDATE_PLANS[targetPlan];

  if (!currentPlanInfo || !targetPlanInfo) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
              <AlertTriangle className="text-amber-600" size={20} />
            </div>
            <DialogTitle>Xác nhận chuyển gói</DialogTitle>
          </div>
          <DialogDescription className="text-left space-y-3 pt-2">
            <p>
              Bạn đang yêu cầu chuyển từ <strong className="text-gray-900">{currentPlanInfo.name}</strong> xuống{' '}
              <strong className="text-gray-900">{targetPlanInfo.name}</strong>.
            </p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-blue-900 mb-2">
                📅 Lưu ý quan trọng:
              </p>
              <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                <li>Gói mới sẽ áp dụng từ <strong>kỳ thanh toán tiếp theo</strong></li>
                <li>Bạn vẫn sử dụng đầy đủ tính năng {currentPlanInfo.name} đến hết kỳ hiện tại</li>
                <li>Không mất thời hạn còn lại của gói đang dùng</li>
              </ul>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-amber-900 mb-2">
                ⚠️ Bạn sẽ mất các tính năng sau:
              </p>
              <ul className="text-sm text-amber-800 space-y-1 list-disc list-inside">
                {currentPlanInfo.features
                  .filter((f) => !targetPlanInfo.features.includes(f))
                  .slice(0, 4)
                  .map((feature, index) => (
                    <li key={index}>{feature}</li>
                  ))}
              </ul>
            </div>
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading} className="flex-1">
            Hủy
          </Button>
          <Button onClick={onConfirm} disabled={loading} className="flex-1">
            {loading ? 'Đang xử lý...' : 'Xác nhận chuyển gói'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

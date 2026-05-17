import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { FileText, Mic, BarChart3, CreditCard, Command, HelpCircle } from 'lucide-react';

const DEMO_GUIDE_STORAGE_KEY = 'interviet_demo_guide_shown';

export const DemoGuideModal: React.FC = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const shown = localStorage.getItem(DEMO_GUIDE_STORAGE_KEY);
    if (!shown) {
      // Show guide after product tour completes or after delay
      const timer = setTimeout(() => {
        const tourCompleted = localStorage.getItem('interviet_tour_completed');
        if (tourCompleted) {
          setOpen(true);
        }
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem(DEMO_GUIDE_STORAGE_KEY, 'true');
    setOpen(false);
  };

  const features = [
    {
      icon: FileText,
      title: 'CV & JD Matching',
      description: 'Tải CV lên, so khớp với mô tả công việc, xem điểm ATS và nhận gợi ý cải thiện.',
      path: '/cv-matching',
    },
    {
      icon: Mic,
      title: 'Phỏng vấn AI',
      description: 'Thiết lập phỏng vấn, chọn vị trí và cp độ, thực hành với AI giọng nói.',
      path: '/phong-van-setup',
    },
    {
      icon: BarChart3,
      title: 'Báo cáo & Analytics',
      description: 'Xem lịch sử phỏng vấn, lọc theo ngày/điểm, so sánh tiến độ theo thời gian.',
      path: '/bao-cao',
    },
    {
      icon: CreditCard,
      title: 'Nâng cấp gói dịch vụ',
      description: 'Dùng thử 7 ngày miễn phí hoặc xem bảng giá để mở khóa tất cả tính năng.',
      path: '/goi-dich-vu', // Changed from '/bang-gia' to '/goi-dich-vu'
    },
    {
      icon: Command,
      title: 'Command Palette',
      description: 'Nhấn Ctrl/Cmd + K bất kỳ lúc nào để truy cập nhanh mọi tính năng.',
      shortcut: true,
    },
    {
      icon: HelpCircle,
      title: 'Trợ giúp & Góp ý',
      description: 'Nhấn biểu tượng tin nhắn ở header để gửi góp ý hoặc báo lỗi.',
      path: '/ho-tro',
    },
  ];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">🎯 Hướng dẫn demo INTER-VIET</DialogTitle>
          <DialogDescription className="sr-only">
            Hướng dẫn sử dụng các tính năng chính của INTER-VIET
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <p className="text-gray-600 mb-6">
            Khám phá các tính năng chính của INTER-VIET để trải nghiệm đầy đủ nền tảng cố vấn sự nghiệp AI:
          </p>

          <div className="grid gap-4">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div
                  key={idx}
                  className="flex gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold mb-1">{feature.title}</h4>
                    <p className="text-sm text-gray-600">{feature.description}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900">
              💡 <strong>Mẹo:</strong> Tất cả dữ liệu được lưu trong trình duyệt của bạn. 
              Bạn có thể tự do thử nghiệm mà không lo mất dữ liệu khi tải lại trang.
            </p>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleClose}>
            Đã hiểu, bắt đầu khám phá
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Function to reset demo guide for testing
export const resetDemoGuide = () => {
  localStorage.removeItem(DEMO_GUIDE_STORAGE_KEY);
};
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

const TOUR_STORAGE_KEY = 'interviet_tour_completed';

interface TourStep {
  title: string;
  description: string;
}

const tourSteps: TourStep[] = [
  {
    title: 'Chào mừng đến với INTER-VIET',
    description:
      'Cố vấn sự nghiệp AI 24/7 giúp bạn tối ưu CV, so khớp JD và luyện tập phỏng vấn một cách chuyên nghiệp.',
  },
  {
    title: 'Tối ưu CV với AI',
    description:
      'Upload CV của bạn và AI sẽ phân tích điểm ATS, đưa ra gợi ý cải thiện phù hợp với thị trường Việt Nam.',
  },
  {
    title: 'So khớp JD thông minh',
    description:
      'Dán mô tả công việc (JD) và xem mức độ phù hợp với CV của bạn, kèm theo đề xuất cải thiện cụ thể.',
  },
  {
    title: 'Luyện tập phỏng vấn AI',
    description:
      'Thực hành phỏng vấn với AI qua giọng nói, nhận phản hồi chi tiết về kỹ năng giao tiếp và nội dung trả lời.',
  },
  {
    title: 'Báo cáo chi tiết',
    description:
      'Theo dõi tiến độ qua các báo cáo phân tích, xác định điểm mạnh và lĩnh vực cần cải thiện.',
  },
  {
    title: 'Bắt đầu ngay!',
    description:
      'Nhấn Ctrl/Cmd + K bất kỳ lúc nào để mở Command Palette và truy cập nhanh các tính năng.',
  },
];

export const ProductTour: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const completed = localStorage.getItem(TOUR_STORAGE_KEY);
    if (!completed) {
      const timer = setTimeout(() => setOpen(true), 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const completeTour = () => {
    localStorage.setItem(TOUR_STORAGE_KEY, 'true');
    setOpen(false);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      completeTour();
      return;
    }
    setOpen(true);
  };

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      completeTour();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
    }
  };

  if (!open) return null;

  const step = tourSteps[currentStep];
  const isLastStep = currentStep === tourSteps.length - 1;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-md">
        <div className="border-b border-slate-100 bg-gradient-to-br from-blue-50/80 to-violet-50/50 px-6 py-5">
          <DialogHeader className="space-y-3 text-left">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white">
              <Sparkles className="h-5 w-5" aria-hidden />
            </div>
            <DialogTitle className="text-lg font-semibold text-slate-900 pr-8">
              {step.title}
            </DialogTitle>
            <DialogDescription className="text-sm leading-relaxed text-slate-600">
              {step.description}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-5 flex justify-center gap-1.5">
            {tourSteps.map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 rounded-full transition-all ${
                  idx === currentStep ? 'w-6 bg-blue-600' : 'w-1.5 bg-slate-300'
                }`}
              />
            ))}
          </div>
        </div>

        <DialogFooter className="flex-row items-center justify-between gap-3 border-t border-slate-100 bg-white px-6 py-4 sm:justify-between">
          <span className="text-sm text-slate-500">
            {currentStep + 1} / {tourSteps.length}
          </span>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-slate-500 hover:text-slate-700"
              onClick={completeTour}
            >
              Bỏ qua
            </Button>
            {currentStep > 0 && (
              <Button type="button" variant="outline" size="sm" onClick={handlePrev}>
                <ChevronLeft className="h-4 w-4" />
                Trước
              </Button>
            )}
            <Button type="button" size="sm" onClick={handleNext}>
              {isLastStep ? 'Hoàn thành' : 'Tiếp theo'}
              {!isLastStep && <ChevronRight className="h-4 w-4" />}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export const resetProductTour = () => {
  localStorage.removeItem(TOUR_STORAGE_KEY);
};

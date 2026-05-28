import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner';
import { LoadingButton } from './design-system/LoadingButton';
import { createSupportTicket } from '../../services/supportTicketService';

interface FeedbackModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Feedback {
  id: string;
  type: string;
  description: string;
  email?: string;
  timestamp: Date;
}

const FEEDBACK_STORAGE_KEY = 'interviet_feedback';

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ open, onOpenChange }) => {
  const [type, setType] = useState<string>('feedback');
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!description.trim()) {
      toast.error('Vui lòng nhập nội dung góp ý');
      return;
    }

    setLoading(true);

    try {
      const categoryMap: Record<string, string> = {
        bug: 'technical',
        feedback: 'other',
        feature: 'feature',
        other: 'other'
      };

      await createSupportTicket({
        subject: type === 'bug' ? 'Báo lỗi hệ thống' : type === 'feature' ? 'Đề xuất tính năng' : 'Góp ý',
        description: email ? `[Email: ${email}]\n\n${description}` : description,
        category: categoryMap[type] || 'other',
        priority: type === 'bug' ? 'high' : 'medium',
      });

      toast.success('Cảm ơn bạn đã gửi góp ý! Chúng tôi sẽ xem xét trong thời gian sớm nhất.');
      
      // Reset form
      setDescription('');
      setEmail('');
      setType('feedback');
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      toast.error('Có lỗi xảy ra, vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Góp ý / Báo lỗi</DialogTitle>
          <DialogDescription>
            Ý kiến của bạn giúp chúng tôi cải thiện INTER-VIET tốt hơn mỗi ngày.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="feedback-type">Loại góp ý</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger id="feedback-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bug">Báo lỗi</SelectItem>
                <SelectItem value="feedback">Góp ý cải thiện</SelectItem>
                <SelectItem value="feature">Đề xuất tính năng</SelectItem>
                <SelectItem value="other">Khác</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="feedback-description">Mô tả chi tiết</Label>
            <Textarea
              id="feedback-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Vui lòng mô tả chi tiết vấn đề hoặc ý kiến của bạn..."
              rows={5}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="feedback-email">Email của bạn (tùy chọn)</Label>
            <Input
              id="feedback-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
            />
            <p className="text-xs text-gray-500">
              Cung cấp email nếu bạn muốn nhận phản hồi từ chúng tôi
            </p>
          </div>

          <div className="flex gap-2 pt-4">
            <LoadingButton type="submit" loading={loading} className="flex-1">
              Gửi góp ý
            </LoadingButton>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Hủy
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Helper to get feedback from storage
export const getFeedback = (): Feedback[] => {
  try {
    const stored = localStorage.getItem(FEEDBACK_STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return parsed.map((f: any) => ({
      ...f,
      timestamp: new Date(f.timestamp),
    }));
  } catch {
    return [];
  }
};

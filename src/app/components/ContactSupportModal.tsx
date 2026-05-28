import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { toast } from 'sonner';
import {
  createSupportTicket,
  type SupportTicket,
  type SupportTicketCategory,
  type SupportTicketPriority,
} from '../../services/supportTicketService';

interface ContactSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (ticket: SupportTicket) => void | Promise<void>;
}

export const ContactSupportModal: React.FC<ContactSupportModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const [formData, setFormData] = useState({
    subject: '',
    category: '' as SupportTicketCategory | '',
    priority: 'medium' as SupportTicketPriority,
    description: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const requestTypes = [
    { value: 'technical', label: 'Lỗi kỹ thuật' },
    { value: 'billing', label: 'Tư vấn gói dịch vụ' },
    { value: 'feature', label: 'Góp ý tính năng' },
    { value: 'other', label: 'Khác' }
  ];

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (formData.subject.trim().length < 6) {
      newErrors.subject = 'Tiêu đề phải có ít nhất 6 ký tự';
    }

    if (!formData.category) {
      newErrors.category = 'Vui lòng chọn loại yêu cầu';
    }

    if (formData.description.trim().length < 10) {
      newErrors.description = 'Mô tả phải có ít nhất 10 ký tự';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);
      const createdTicket = await createSupportTicket({
        subject: formData.subject.trim(),
        description: formData.description.trim(),
        category: formData.category,
        priority: formData.priority,
      });

      await onCreated?.(createdTicket);
      toast.success('Đã gửi yêu cầu hỗ trợ');

      setFormData({
        subject: '',
        category: '',
        priority: 'medium',
        description: '',
      });
      setErrors({});
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể gửi yêu cầu hỗ trợ.';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      subject: '',
      category: '',
      priority: 'medium',
      description: '',
    });
    setErrors({});
    onClose();
  };

  // Handle ESC key
  React.useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[12000] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={handleClose}
    >
      <Card 
        className="w-full max-w-lg mx-4 p-6 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">Liên hệ hỗ trợ</h2>
            <p className="text-sm text-gray-600 mt-1">
              Gửi yêu cầu, đội ngũ INTER-VIET sẽ phản hồi sớm nhất có thể.
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Request Type */}
          <div>
            <label htmlFor="support-ticket-subject" className="block text-sm font-medium mb-2">
              Tiêu đề <span className="text-red-500">*</span>
            </label>
            <input
              id="support-ticket-subject"
              type="text"
              value={formData.subject}
              onChange={(e) => {
                setFormData({ ...formData, subject: e.target.value });
                setErrors({ ...errors, subject: '' });
              }}
              placeholder="Ví dụ: Không thể tải lên CV định dạng PDF"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.subject && (
              <p className="text-sm text-red-500 mt-1">{errors.subject}</p>
            )}
          </div>

          <div>
            <label htmlFor="support-ticket-category" className="block text-sm font-medium mb-2">
              Loại yêu cầu <span className="text-red-500">*</span>
            </label>
            <select
              id="support-ticket-category"
              value={formData.category}
              onChange={(e) => {
                setFormData({ ...formData, category: e.target.value as SupportTicketCategory });
                setErrors({ ...errors, category: '' });
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Chọn loại yêu cầu</option>
              {requestTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            {errors.category && (
              <p className="text-sm text-red-500 mt-1">{errors.category}</p>
            )}
          </div>

          <div>
            <label htmlFor="support-ticket-priority" className="block text-sm font-medium mb-2">Mức ưu tiên</label>
            <select
              id="support-ticket-priority"
              value={formData.priority}
              onChange={(e) => {
                setFormData({ ...formData, priority: e.target.value as SupportTicketPriority });
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="low">Thấp</option>
              <option value="medium">Trung bình</option>
              <option value="high">Cao</option>
              <option value="urgent">Khẩn cấp</option>
            </select>
          </div>

          {/* Message */}
          <div>
            <label htmlFor="support-ticket-description" className="block text-sm font-medium mb-2">
              Mô tả chi tiết <span className="text-red-500">*</span>
            </label>
            <textarea
              id="support-ticket-description"
              value={formData.description}
              onChange={(e) => {
                setFormData({ ...formData, description: e.target.value });
                setErrors({ ...errors, description: '' });
              }}
              rows={5}
              placeholder="Mô tả chi tiết vấn đề của bạn..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <div className="flex items-center justify-between mt-1">
              {errors.description && (
                <p className="text-sm text-red-500">{errors.description}</p>
              )}
              <p className="text-xs text-gray-500 ml-auto">
                {formData.description.length} ký tự
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? 'Đang gửi...' : 'Gửi yêu cầu'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

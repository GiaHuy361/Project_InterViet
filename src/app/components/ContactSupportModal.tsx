import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { toast } from 'sonner';

interface ContactSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
  sourcePage?: string;
}

interface SupportTicket {
  id: string;
  type: string;
  message: string;
  email: string;
  createdAt: string;
  page: string;
}

export const ContactSupportModal: React.FC<ContactSupportModalProps> = ({
  isOpen,
  onClose,
  userEmail = '',
  sourcePage = '/tro-giup'
}) => {
  const [formData, setFormData] = useState({
    type: '',
    message: '',
    email: userEmail
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  React.useEffect(() => {
    if (isOpen && userEmail) {
      setFormData(prev => ({ ...prev, email: userEmail }));
    }
  }, [isOpen, userEmail]);

  const requestTypes = [
    { value: 'technical', label: 'Lỗi kỹ thuật' },
    { value: 'billing', label: 'Tư vấn gói dịch vụ' },
    { value: 'feature', label: 'Góp ý tính năng' },
    { value: 'other', label: 'Khác' }
  ];

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.type) {
      newErrors.type = 'Vui lòng chọn loại yêu cầu';
    }

    if (formData.message.length < 10) {
      newErrors.message = 'Mô tả phải có ít nhất 10 ký tự';
    }

    if (formData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = 'Email không hợp lệ';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Create ticket
    const ticket: SupportTicket = {
      id: `TICKET-${Date.now()}`,
      type: formData.type,
      message: formData.message,
      email: formData.email,
      createdAt: new Date().toISOString(),
      page: sourcePage
    };

    // Save to localStorage
    try {
      const existingTickets = localStorage.getItem('interviet_support_tickets');
      const tickets: SupportTicket[] = existingTickets ? JSON.parse(existingTickets) : [];
      tickets.push(ticket);
      localStorage.setItem('interviet_support_tickets', JSON.stringify(tickets));
    } catch (error) {
      console.error('Error saving ticket:', error);
    }

    // Show success toast
    toast.success('Đã gửi yêu cầu hỗ trợ');

    // Reset form and close
    setFormData({ type: '', message: '', email: userEmail });
    setErrors({});
    onClose();
  };

  const handleClose = () => {
    setFormData({ type: '', message: '', email: userEmail });
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
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
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
            <label className="block text-sm font-medium mb-2">
              Loại yêu cầu <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.type}
              onChange={(e) => {
                setFormData({ ...formData, type: e.target.value });
                setErrors({ ...errors, type: '' });
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
            {errors.type && (
              <p className="text-sm text-red-500 mt-1">{errors.type}</p>
            )}
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Mô tả chi tiết <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.message}
              onChange={(e) => {
                setFormData({ ...formData, message: e.target.value });
                setErrors({ ...errors, message: '' });
              }}
              rows={5}
              placeholder="Mô tả chi tiết vấn đề của bạn..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <div className="flex items-center justify-between mt-1">
              {errors.message && (
                <p className="text-sm text-red-500">{errors.message}</p>
              )}
              <p className="text-xs text-gray-500 ml-auto">
                {formData.message.length} ký tự
              </p>
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Email liên hệ
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => {
                setFormData({ ...formData, email: e.target.value });
                setErrors({ ...errors, email: '' });
              }}
              placeholder="email@example.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.email && (
              <p className="text-sm text-red-500 mt-1">{errors.email}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              className="flex-1"
            >
              Gửi yêu cầu
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

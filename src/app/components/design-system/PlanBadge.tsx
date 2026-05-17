import React from 'react';
import { Badge } from '../ui/badge';
import { UserRole, SubscriptionPlan } from '../../contexts/AppContext';

interface PlanBadgeProps {
  role: UserRole;
  plan?: SubscriptionPlan;
  className?: string;
}

export const PlanBadge: React.FC<PlanBadgeProps> = ({ role, plan, className }) => {
  // Priority 1: Show role-based status for special states
  if (role === 'visitor') {
    return <Badge variant="outline" className={className}>Khách</Badge>;
  }
  if (role === 'trial') {
    return <Badge variant="default" className={`bg-blue-600 hover:bg-blue-700 ${className || ''}`}>Dùng thử 7 ngày</Badge>;
  }
  if (role === 'expired') {
    return <Badge variant="destructive" className={className}>Hết hạn</Badge>;
  }
  if (role === 'cancelled') {
    return <Badge variant="outline" className={`border-orange-500 text-orange-700 ${className || ''}`}>Đã hủy</Badge>;
  }
  if (role === 'suspended') {
    return <Badge variant="destructive" className={className}>Tạm khóa</Badge>;
  }

  // Priority 2: Show plan-based status for active users (free/premium)
  if (plan) {
    const planConfig: Record<SubscriptionPlan, { text: string; className: string }> = {
      free: { text: 'Miễn phí', className: 'bg-gray-100 text-gray-700 hover:bg-gray-200' },
      monthly: { text: 'Gói Tháng', className: 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800' },
      quarterly: { text: 'Gói Quý', className: 'bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-700 hover:to-purple-800' },
      yearly: { text: 'Gói Năm', className: 'bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700' },
    };

    const config = planConfig[plan];
    return <Badge variant="default" className={`${config.className} ${className || ''}`}>{config.text}</Badge>;
  }

  // Fallback: Show role-based text
  return <Badge variant="secondary" className={className}>
    {role === 'free' ? 'Miễn phí' : 'Premium'}
  </Badge>;
};

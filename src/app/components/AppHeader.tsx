import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { useApp } from '../contexts/AppContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { NotificationDropdown } from './NotificationDropdown';
import { AccountDropdown } from './AccountDropdown';
import { 
  Sun,
  Moon,
  Search,
  MessageSquare,
} from 'lucide-react';

interface AppHeaderProps {
  onOpenFeedback: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ onOpenFeedback }) => {
  const { state, toggleTheme } = useApp();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/bao-cao?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <header className="sticky top-0 bg-white border-b border-gray-200 z-50" style={{ zIndex: 10000 }}>
      <div className="px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Tìm kiếm báo cáo, CV..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2"
              />
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-1 text-xs bg-gray-100 rounded border border-gray-300 text-gray-600">
                Ctrl+K
              </kbd>
            </div>
          </form>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="hidden md:flex"
            >
              {state.theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={onOpenFeedback}
              className="hidden md:flex"
            >
              <MessageSquare size={18} />
            </Button>

            {/* Notifications Dropdown - Portal based */}
            <NotificationDropdown />

            {/* Account Dropdown - Portal based */}
            <AccountDropdown />
          </div>
        </div>
      </div>

      {/* Trial/Cancelled/Expired Banners */}
      {state.user?.role === 'trial' && state.user.trialEndsAt && (
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 px-6">
          <div className="flex items-center justify-between">
            <p className="text-sm">
              🎉 Bạn đang dùng thử miễn phí. Còn lại{' '}
              <strong>
                {Math.ceil((state.user.trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))} ngày
              </strong>
            </p>
            <Button 
              size="sm" 
              variant="secondary"
              onClick={() => navigate('/thanh-toan')}
            >
              Nâng cấp ngay
            </Button>
          </div>
        </div>
      )}

      {state.user?.role === 'cancelled' && state.user.subscriptionEndsAt && (
        <div className="bg-yellow-500 text-white py-2 px-6">
          <div className="flex items-center justify-between">
            <p className="text-sm">
              ⚠️ Gói của bạn sẽ hết hạn vào{' '}
              <strong>{state.user.subscriptionEndsAt.toLocaleDateString('vi-VN')}</strong>
            </p>
            <Button 
              size="sm" 
              variant="secondary"
              onClick={() => navigate('/goi-dich-vu')}
            >
              Gia hạn
            </Button>
          </div>
        </div>
      )}

      {state.user?.role === 'expired' && (
        <div className="bg-red-600 text-white py-2 px-6">
          <div className="flex items-center justify-between">
            <p className="text-sm">
              ⛔ Gói của bạn đã hết hạn. Nâng cấp để tiếp tục sử dụng đầy đủ tính năng.
            </p>
            <Button 
              size="sm" 
              variant="secondary"
              onClick={() => navigate('/thanh-toan')}
            >
              Nâng cấp
            </Button>
          </div>
        </div>
      )}

      {state.user?.role === 'suspended' && (
        <div className="bg-gray-900 text-white py-2 px-6">
          <p className="text-sm">
            🚫 Tài khoản của bạn đã bị tạm khóa. Vui lòng liên hệ hỗ trợ để biết thêm chi tiết.
          </p>
        </div>
      )}
    </header>
  );
};
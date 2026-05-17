import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router';
import { useApp } from '../contexts/AppContext';
import { Button } from './ui/button';
import { Bell, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { eventTracker } from '../utils/eventTracker';

export const NotificationDropdown: React.FC = () => {
  const { state, markNotificationRead, markAllNotificationsRead } = useApp();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifTab, setNotifTab] = useState<'all' | 'unread'>('all');
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);

  const unreadNotifications = state.notifications.filter(n => !n.read);
  const unreadCount = unreadNotifications.length;

  const displayedNotifications = notifTab === 'all' 
    ? state.notifications 
    : unreadNotifications;

  // Calculate dropdown position
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 8,
        left: rect.right - 384, // 384px = w-96
      });
    }
  }, [isOpen]);

  // Close on ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (isOpen && buttonRef.current && !buttonRef.current.contains(e.target as Node)) {
        const dropdown = document.getElementById('notification-dropdown');
        if (dropdown && !dropdown.contains(e.target as Node)) {
          setIsOpen(false);
        }
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleNotificationClick = (notif: any) => {
    markNotificationRead(notif.id);
    setIsOpen(false);
    
    // Navigate based on notification type/content
    if (notif.title.includes('Báo cáo') || notif.title.includes('báo cáo')) {
      navigate('/bao-cao');
    } else if (notif.title.includes('giới hạn') || notif.title.includes('hết lượt')) {
      navigate('/goi-dich-vu');
    } else if (notif.title.includes('CV')) {
      navigate('/cv-matching');
    }
  };

  const handleMarkAllRead = () => {
    markAllNotificationsRead();
    eventTracker.track('notification_mark_all_read');
    toast.success('Đã đánh dấu tất cả là đã đọc');
  };

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays === 1) return 'hôm qua';
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return date.toLocaleDateString('vi-VN');
  };

  const handleToggle = () => {
    if (!isOpen) {
      eventTracker.track('notification_open');
    }
    setIsOpen(!isOpen);
  };

  const dropdownContent = isOpen && (
    <AnimatePresence>
      <motion.div
        id="notification-dropdown"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        style={{
          position: 'fixed',
          top: dropdownPosition.top,
          left: dropdownPosition.left,
          zIndex: 9999,
          pointerEvents: 'auto',
        }}
        className="w-96 bg-white rounded-lg shadow-2xl border border-gray-200"
      >
        <div className="p-3 border-b">
          <h3 className="font-semibold text-base mb-3">Thông báo</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setNotifTab('all')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                notifTab === 'all' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setNotifTab('unread')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                notifTab === 'unread' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Chưa đọc {unreadCount > 0 && `(${unreadCount})`}
            </button>
          </div>
        </div>
        
        {displayedNotifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Bell className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">
              {notifTab === 'unread' 
                ? 'Bạn đã đọc hết thông báo' 
                : 'Bạn chưa có thông báo nào'}
            </p>
          </div>
        ) : (
          <>
            <div className="max-h-96 overflow-y-auto">
              {displayedNotifications.slice(0, 10).map(notification => (
                <div 
                  key={notification.id}
                  className={`p-3 border-b hover:bg-gray-50 cursor-pointer transition-colors ${
                    !notification.read ? 'bg-blue-50/50' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {!notification.read && (
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm mb-1 ${!notification.read ? 'font-bold' : 'font-medium'}`}>
                        {notification.title}
                      </p>
                      <p className="text-xs text-gray-600 mb-1 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500">
                        {getTimeAgo(notification.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="p-2 border-t bg-gray-50">
              {unreadCount > 0 && (
                <Button 
                  variant="ghost" 
                  className="w-full text-sm" 
                  size="sm"
                  onClick={handleMarkAllRead}
                >
                  <CheckCircle className="mr-2" size={14} />
                  Đánh dấu tất cả là đã đọc
                </Button>
              )}
              <Button 
                variant="ghost" 
                className="w-full text-sm mt-1" 
                size="sm"
                onClick={() => {
                  setIsOpen(false);
                  navigate('/thong-bao');
                }}
              >
                Xem tất cả thông báo
              </Button>
            </div>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );

  const uiLayer = typeof document !== 'undefined' ? document.getElementById('ui-layer') : null;

  return (
    <>
      <button
        ref={buttonRef}
        onClick={handleToggle}
        className="relative inline-flex items-center justify-center px-3 py-2 rounded-md hover:bg-gray-100 transition-colors"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span 
            className={`absolute -top-1 -right-1 min-w-[20px] h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center px-1 ${
              unreadCount > 0 ? 'animate-pulse' : ''
            }`}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
      {uiLayer && dropdownContent && createPortal(dropdownContent, uiLayer)}
    </>
  );
};

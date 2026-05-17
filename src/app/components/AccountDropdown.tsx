import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router';
import { useApp } from '../contexts/AppContext';
import { PlanBadge } from './design-system/PlanBadge';
import { AvatarInitials } from './brand/AvatarInitials';
import { Settings, CreditCard, UserCircle, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { notifySuccess } from '../utils/notify';
import { eventTracker } from '../utils/eventTracker';

export const AccountDropdown: React.FC = () => {
  const { state, logout } = useApp();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [logoutPending, setLogoutPending] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 8,
        left: rect.right - 256,
      });
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (logoutDialogOpen) {
        setLogoutDialogOpen(false);
        setLogoutPending(false);
      } else if (isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, logoutDialogOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!isOpen || logoutDialogOpen) return;
      if (buttonRef.current?.contains(e.target as Node)) return;
      const dropdown = document.getElementById('account-dropdown');
      if (dropdown && !dropdown.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, logoutDialogOpen]);

  const handleLogout = async () => {
    await logout();
    localStorage.removeItem('interviet_notifications');
    setLogoutDialogOpen(false);
    setIsOpen(false);
    setLogoutPending(false);
    eventTracker.track('logout');
    notifySuccess('Đã đăng xuất');
    navigate('/dang-nhap');
  };

  const handleMenuItemClick = (path: string) => {
    setIsOpen(false);
    navigate(path);
  };

  const requestLogoutConfirm = useCallback(() => {
    setLogoutPending(true);
    setIsOpen(false);
  }, []);

  const handleDropdownExitComplete = useCallback(() => {
    if (logoutPending) {
      setLogoutDialogOpen(true);
      setLogoutPending(false);
    }
  }, [logoutPending]);

  const dropdownContent = (
    <AnimatePresence onExitComplete={handleDropdownExitComplete}>
      {isOpen && (
        <motion.div
          id="account-dropdown"
          initial={{ opacity: 0, y: -8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.98 }}
          transition={{ duration: 0.15 }}
          style={{
            position: 'fixed',
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            zIndex: 9999,
            pointerEvents: 'auto',
          }}
          className="w-64 overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-xl shadow-slate-900/10"
        >
          <div className="border-b border-slate-100 p-3">
            <div className="flex items-center gap-3">
              <AvatarInitials
                name={state.user?.name || 'User'}
                size="md"
                plan={state.user?.subscriptionPlan}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-slate-900">
                  {state.user?.name || 'User'}
                </p>
                <p className="truncate text-sm text-slate-500">{state.user?.email || ''}</p>
                <div className="mt-1">
                  <PlanBadge
                    role={state.user?.role || 'free'}
                    plan={state.user?.subscriptionPlan}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="py-1">
            <button
              type="button"
              onClick={() => handleMenuItemClick('/cai-dat')}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-slate-50"
            >
              <UserCircle size={16} />
              Hồ sơ
            </button>
            <button
              type="button"
              onClick={() => handleMenuItemClick('/cai-dat')}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-slate-50"
            >
              <Settings size={16} />
              Cài đặt
            </button>
            <button
              type="button"
              onClick={() => handleMenuItemClick('/goi-dich-vu')}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-slate-50"
            >
              <CreditCard size={16} />
              Gói dịch vụ
            </button>
          </div>

          <div className="border-t border-slate-100 py-1">
            <button
              type="button"
              onClick={requestLogoutConfirm}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 transition-colors hover:bg-red-50"
            >
              <LogOut size={16} />
              Đăng xuất
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const uiLayer = typeof document !== 'undefined' ? document.getElementById('ui-layer') : null;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="flex items-center gap-2 rounded-md px-2 py-1 transition-colors hover:bg-gray-100"
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        <AvatarInitials
          name={state.user?.name || 'User'}
          size="sm"
          plan={state.user?.subscriptionPlan}
        />
        <div className="hidden text-left lg:block">
          <p className="text-sm font-medium">{state.user?.name || 'User'}</p>
          <div className="text-xs">
            <PlanBadge role={state.user?.role || 'free'} plan={state.user?.subscriptionPlan} />
          </div>
        </div>
      </button>

      {uiLayer && createPortal(dropdownContent, uiLayer)}

      <AlertDialog
        open={logoutDialogOpen}
        onOpenChange={(open) => {
          setLogoutDialogOpen(open);
          if (!open) setLogoutPending(false);
        }}
      >
        <AlertDialogContent className="gap-0 overflow-hidden p-0 sm:max-w-[400px]">
          <div className="border-b border-slate-100 bg-slate-50/80 px-6 py-5">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                <LogOut size={22} />
              </div>
              <AlertDialogHeader className="space-y-1.5 text-left">
                <AlertDialogTitle className="text-base font-semibold text-slate-900">
                  Đăng xuất khỏi tài khoản?
                </AlertDialogTitle>
                <AlertDialogDescription className="text-sm leading-relaxed text-slate-600">
                  Bạn sẽ cần đăng nhập lại để tiếp tục sử dụng INTER-VIET.
                </AlertDialogDescription>
              </AlertDialogHeader>
            </div>
          </div>
          <AlertDialogFooter className="gap-2 bg-white px-6 py-4 sm:flex-row sm:justify-end">
            <AlertDialogCancel className="mt-0 min-w-[100px]">Ở lại</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void handleLogout();
              }}
              className="min-w-[100px] bg-red-600 hover:bg-red-700"
            >
              Đăng xuất
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

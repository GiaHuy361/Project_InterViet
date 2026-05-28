import React, { useState } from "react";
import { useNavigate } from "react-router";
import { useApp } from "../contexts/AppContext";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { NotificationDropdown } from "./NotificationDropdown";
import { AccountDropdown } from "./AccountDropdown";
import { Sun, Moon, Search, MessageSquare, CalendarClock } from "lucide-react";
import { BrandLogo } from "./brand/BrandLogo";

interface AppHeaderProps {
  onOpenFeedback: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ onOpenFeedback }) => {
  const { state, toggleTheme } = useApp();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/bao-cao?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  let dashboardPath = "/dashboard";
  if (state.user?.systemRole === 'admin') dashboardPath = "/admin/dashboard";
  else if (state.user?.systemRole === 'support') dashboardPath = "/support/dashboard";
  else if (state.user?.systemRole === 'mentor') dashboardPath = "/mentor/dashboard";

  return (
    <header id="app-header" className="sticky top-0 z-50 shrink-0 border-b border-gray-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="h-20 flex items-center justify-between gap-6 px-8">
        {/* Logo */}
        <div className="flex h-20 shrink-0 items-center border-b border-gray-200 px-6">
          <BrandLogo href={dashboardPath} size="lg" />
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="min-w-0 flex-1 max-w-2xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="Tìm kiếm báo cáo, CV..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-12 rounded-xl pl-10 pr-[4.5rem]"
            />
            <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded border border-gray-300 bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
              Ctrl+K
            </kbd>
          </div>
        </form>

        <div className="flex shrink-0 items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="hidden md:flex"
          >
            {state.theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
          </Button>

          {/* Only show Feedback to user or admin */}
          {(state.user?.systemRole === 'candidate' || state.user?.systemRole === 'admin') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onOpenFeedback}
              className="hidden md:flex"
            >
              <MessageSquare size={18} />
            </Button>
          )}

          {/* Only show Candidate's Bookings button to candidate (user) */}
          {(state.user?.systemRole === 'candidate') && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/mentor-bookings")}
              className="hidden md:inline-flex gap-2 rounded-full border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <CalendarClock size={18} />
              Lịch hẹn của tôi
            </Button>
          )}

          {/* Notifications Dropdown - Portal based */}
          <NotificationDropdown />

          {state.user?.systemRole && (
            <Badge 
              variant="outline" 
              className={`hidden md:inline-flex ${
                state.user.systemRole === 'admin' ? 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-400 border-violet-200 dark:border-violet-800' :
                state.user.systemRole === 'support' ? 'bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800' :
                state.user.systemRole === 'mentor' ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' :
                state.user.systemRole === 'candidate' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800' :
                'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
            >
              {
                state.user.systemRole === 'admin' ? 'Quản trị viên' :
                state.user.systemRole === 'support' ? 'Hỗ trợ' :
                state.user.systemRole === 'mentor' ? 'Mentor' :
                state.user.systemRole === 'candidate' ? 'Thành viên' :
                state.user.systemRole
              }
            </Badge>
          )}

          {/* Account Dropdown - Portal based */}
          <AccountDropdown />
        </div>
      </div>

      {/* Trial/Cancelled/Expired Banners */}
      {state.user?.role === "trial" && state.user.trialEndsAt && (
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 px-6">
          <div className="flex items-center justify-between">
            <p className="text-sm">
              🎉 Bạn đang dùng thử miễn phí. Còn lại{" "}
              <strong>
                {Math.ceil(
                  (state.user.trialEndsAt.getTime() - Date.now()) /
                  (1000 * 60 * 60 * 24),
                )}{" "}
                ngày
              </strong>
            </p>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => navigate("/goi-dich-vu")}
            >
              Nâng cấp ngay
            </Button>
          </div>
        </div>
      )}

      {state.user?.role === "cancelled" && state.user.subscriptionEndsAt && (
        <div className="bg-yellow-500 text-white py-2 px-6">
          <div className="flex items-center justify-between">
            <p className="text-sm">
              ⚠️ Gói của bạn sẽ hết hạn vào{" "}
              <strong>
                {state.user.subscriptionEndsAt.toLocaleDateString("vi-VN")}
              </strong>
            </p>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => navigate("/goi-dich-vu")}
            >
              Gia hạn
            </Button>
          </div>
        </div>
      )}

      {state.user?.role === "expired" && (
        <div className="bg-red-600 text-white py-2 px-6">
          <div className="flex items-center justify-between">
            <p className="text-sm">
              ⛔ Gói của bạn đã hết hạn. Nâng cấp để tiếp tục sử dụng đầy đủ
              tính năng.
            </p>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => navigate("/goi-dich-vu")}
            >
              Nâng cấp
            </Button>
          </div>
        </div>
      )}

      {state.user?.role === "suspended" && (
        <div className="bg-gray-900 text-white py-2 px-6">
          <p className="text-sm">
            🚫 Tài khoản của bạn đã bị tạm khóa. Vui lòng liên hệ hỗ trợ để biết
            thêm chi tiết.
          </p>
        </div>
      )}
    </header>
  );
};

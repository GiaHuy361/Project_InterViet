import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router';
import { 
  Home, 
  FileText, 
  Mic, 
  BarChart3,
  Settings,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  FileUp,
  Users,
  Target,
  Briefcase,
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { cn } from './ui/utils';
import { BrandLogo } from './brand/BrandLogo';

const SIDEBAR_STORAGE_KEY = 'interviet_sidebar_collapsed';

interface NavItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  badge?: string;
}

const navItems: NavItem[] = [
  { label: 'Bảng điều khiển', icon: Home, path: '/dashboard' },
  { label: 'CV Matching', icon: FileText, path: '/cv-matching' },
  { label: 'So khớp đa JD', icon: Target, path: '/multi-jd-matching', badge: 'MỚI' },
  { label: 'Kết nối', icon: Users, path: '/network', badge: 'MỚI' },
  { label: 'Phỏng vấn', icon: Mic, path: '/phong-van-setup' },
  { label: 'Báo cáo', icon: BarChart3, path: '/bao-cao' },
  { label: 'Trợ giúp', icon: HelpCircle, path: '/tro-giup' },
];

const bottomNavItems: NavItem[] = [
  { label: 'Gói dịch vụ', icon: CreditCard, path: '/goi-dich-vu' },
  { label: 'Cài đặt', icon: Settings, path: '/cai-dat' },
];

export const AppSidebar: React.FC = () => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(() => {
    const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY);
    return stored === 'true';
  });

  useEffect(() => {
    localStorage.setItem(SIDEBAR_STORAGE_KEY, collapsed.toString());
  }, [collapsed]);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const NavLink: React.FC<{ item: NavItem }> = ({ item }) => {
    const Icon = item.icon;
    const active = isActive(item.path);

    const linkContent = (
      <Link
        to={item.path}
        className={cn(
          'flex items-center gap-4 rounded-2xl px-5 py-3.5 text-[15px] transition-colors',
          active
            ? 'bg-blue-50 text-blue-600 shadow-sm shadow-blue-100'
            : 'text-gray-700 hover:bg-gray-100'
        )}
      >
        <Icon className={cn('h-6 w-6 flex-shrink-0', active && 'text-blue-600')} />
        {!collapsed && <span className="font-semibold">{item.label}</span>}
        {active && !collapsed && (
          <div className="ml-auto h-2 w-2 rounded-full bg-blue-600" />
        )}
        {item.badge && !collapsed && (
          <div className="ml-auto rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
            {item.badge}
          </div>
        )}
      </Link>
    );

    if (collapsed) {
      return (
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              {linkContent}
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>{item.label}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return linkContent;
  };

  return (
    <aside 
      className={cn(
        'sticky top-0 flex h-screen flex-col border-r border-gray-200 bg-white transition-all duration-300',
        collapsed ? 'w-20' : 'w-80'
      )}
    >
      {/* Logo */}
      <div className="flex h-20 shrink-0 items-center border-b border-gray-200 px-6">
        {collapsed ? (
          <BrandLogo href="/dashboard" size="sm" showWordmark={false} className="mx-auto" />
        ) : (
          <BrandLogo href="/dashboard" size="sm" />
        )}
      </div>

      {/* Main navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-5">
        {navItems.map((item) => (
          <NavLink key={item.path} item={item} />
        ))}
      </nav>

      {/* Bottom navigation */}
      <div className="space-y-1 border-t border-gray-200 p-5">
        {bottomNavItems.map((item) => (
          <NavLink key={item.path} item={item} />
        ))}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-center border-t border-gray-200 p-5 transition-colors hover:bg-gray-50"
        aria-label={collapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
      >
        {collapsed ? (
          <ChevronRight className="w-5 h-5 text-gray-600" />
        ) : (
          <div className="flex items-center gap-2 text-gray-600">
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm">Thu gọn</span>
          </div>
        )}
      </button>
    </aside>
  );
};
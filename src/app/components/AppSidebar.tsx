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
          'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
          active 
            ? 'bg-blue-50 text-blue-600' 
            : 'text-gray-700 hover:bg-gray-100'
        )}
      >
        <Icon className={cn('w-5 h-5 flex-shrink-0', active && 'text-blue-600')} />
        {!collapsed && <span className="font-medium">{item.label}</span>}
        {active && !collapsed && (
          <div className="ml-auto w-1.5 h-1.5 bg-blue-600 rounded-full" />
        )}
        {item.badge && !collapsed && (
          <div className="ml-auto px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
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
        'bg-white border-r border-gray-200 h-screen sticky top-0 flex flex-col transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="p-4 border-b border-gray-200">
        {collapsed ? (
          <BrandLogo href="/dashboard" size="sm" showWordmark={false} className="mx-auto" />
        ) : (
          <BrandLogo href="/dashboard" size="sm" />
        )}
      </div>

      {/* Main navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink key={item.path} item={item} />
        ))}
      </nav>

      {/* Bottom navigation */}
      <div className="p-3 border-t border-gray-200 space-y-1">
        {bottomNavItems.map((item) => (
          <NavLink key={item.path} item={item} />
        ))}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="p-3 border-t border-gray-200 hover:bg-gray-50 transition-colors flex items-center justify-center"
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
import React, { useState, useEffect, useRef } from 'react';
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
  MessageSquare,
  Shield,
  Headphones,
  Activity,
  Server,
  LayoutDashboard,
  ChevronDown,
  ChevronUp,
  UserCircle,
  Mail,
  CalendarDays,
  UserCheck
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { cn } from './ui/utils';
import { useApp } from '../contexts/AppContext';
import type { SystemRole } from '../../lib/auth/jwtDecode';
import { isFeatureDisabled } from '../../lib/featureGate';

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
  { label: 'Trở thành Mentor', icon: UserCircle, path: '/tro-thanh-mentor' },
  { label: 'Phỏng vấn', icon: Mic, path: '/phong-van-setup' },
  { label: 'Báo cáo', icon: BarChart3, path: '/bao-cao' },
  { label: 'Trợ giúp', icon: HelpCircle, path: '/tro-giup' },
];

const bottomNavItems: NavItem[] = [
  { label: 'Gói dịch vụ', icon: CreditCard, path: '/goi-dich-vu' },
  { label: 'Cài đặt', icon: Settings, path: '/cai-dat' },
];

// Admin-only navigation items (role: admin)
const adminNavItems: NavItem[] = [
  { label: 'Admin Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
  { label: 'Quản lý nội dung (CMS)', icon: FileText, path: '/admin/cms' },
  { label: 'Lịch Mentor', icon: Briefcase, path: '/admin/mentor-bookings' },
  { label: 'Quản lý người dùng', icon: Users, path: '/admin/users' },
  { label: 'Kiểm duyệt Mentor', icon: UserCheck, path: '/admin/mentors' },
  { label: 'Quản lý chuyên môn', icon: Shield, path: '/admin/specialties' },
  { label: 'Billing & Hóa đơn', icon: CreditCard, path: '/admin/billing' },
  { label: 'Audit Logs', icon: Activity, path: '/admin/audit-logs' },
  { label: 'Health Check', icon: Server, path: '/admin/health' },
];

// Mentor navigation items (role: mentor)
const mentorNavItems: NavItem[] = [
  { label: 'Mentor Dashboard', icon: LayoutDashboard, path: '/mentor/dashboard' },
  { label: 'Lịch hẹn của tôi', icon: Briefcase, path: '/mentor/bookings' },
  { label: 'Khung giờ rảnh', icon: CalendarDays, path: '/mentor/availability' },
  { label: 'Hồ sơ chuyên gia', icon: UserCircle, path: '/mentor/profile' },
];

const supportNavItems: NavItem[] = [
  { label: 'Support Dashboard', icon: LayoutDashboard, path: '/support/dashboard' },
  { label: 'Support Tickets', icon: Headphones, path: '/support/tickets' },
  { label: 'Liên hệ khách hàng', icon: Mail, path: '/support/contact-requests' },
];

const NavLink: React.FC<{ item: NavItem; isActive: boolean; collapsed: boolean }> = ({ item, isActive, collapsed }) => {
  const Icon = item.icon;
  const linkClass = cn(
    'rounded-2xl text-[15px] transition-colors',
    collapsed ? 'flex items-center justify-center px-0 py-3.5' : 'flex items-center gap-4 px-5 py-3.5',
    isActive ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 shadow-sm shadow-blue-100 dark:shadow-none' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
  );

  const iconClass = cn(
    'h-6 w-6',
    collapsed ? 'mx-auto' : 'flex-shrink-0',
    isActive && 'text-blue-600'
  );

  const linkContent = (
    <Link to={item.path} className={linkClass}>
      <Icon className={iconClass} />
      {!collapsed && <span className="font-semibold">{item.label}</span>}
      {isActive && !collapsed && (
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

const NavSection: React.FC<{
  label: string;
  items: NavItem[];
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  isActive: (path: string) => boolean;
  collapsed: boolean;
}> = ({ label, items, icon: SectionIcon, accentColor, isActive, collapsed }) => (
  <div className="mt-2">
    {!collapsed && (
      <div className={`mb-1 flex items-center gap-2 px-5 py-2`}>
        <SectionIcon className={`h-3.5 w-3.5 ${accentColor}`} />
        <span className={`text-xs font-bold uppercase tracking-wider ${accentColor}`}>
          {label}
        </span>
      </div>
    )}
    {collapsed && (
      <div className="mx-auto my-2 h-px w-8 bg-gray-200 dark:bg-gray-700" />
    )}
    {items.map((item) => (
      <NavLink key={item.path} item={item} isActive={isActive(item.path)} collapsed={collapsed} />
    ))}
  </div>
);

export const AppSidebar: React.FC = () => {
  const location = useLocation();
  const { state } = useApp();
  const [collapsed, setCollapsed] = useState(() => {
    const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY);
    return stored === 'true';
  });

  const systemRole: SystemRole = state.user?.systemRole || 'candidate';
  const isAdmin = systemRole === 'admin';
  const isSupport = systemRole === 'support';
  const isMentor = systemRole === 'mentor';
  const isUser = systemRole === 'candidate';

  // Feature gate state — hide menu sections when features are disabled by backend
  const [adminDisabled, setAdminDisabled] = useState(() => isFeatureDisabled('admin'));
  const [supportDisabled, setSupportDisabled] = useState(() => isFeatureDisabled('support'));

  // Sticky behavior: compute top offset from header height so sidebar sits below header
  const asideRef = useRef<HTMLDivElement | null>(null);
  const navRef = useRef<HTMLDivElement | null>(null);
  const [hasMoreBelow, setHasMoreBelow] = useState(false);
  const [hasMoreAbove, setHasMoreAbove] = useState(false);
  const [topOffset, setTopOffset] = useState<number>(0);

  useEffect(() => {
    const header = document.getElementById('app-header');
    if (!header) return;

    const update = () => {
      const h = header.offsetHeight || 0;
      setTopOffset(h);
      // set CSS variable on root so we avoid inline styles
      document.documentElement.style.setProperty('--iv-header-height', `${h}px`);
    };
    update();

    const ro = new ResizeObserver(() => update());
    ro.observe(header);
    window.addEventListener('resize', update);

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
    };
  }, []);

  // detect if nav has scrollable content below
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;

    const check = () => {
      setHasMoreAbove(nav.scrollTop > 1);
      setHasMoreBelow(nav.scrollTop + nav.clientHeight < nav.scrollHeight - 1);
    };

    check();
    nav.addEventListener('scroll', check, { passive: true });
    const ro = new ResizeObserver(check);
    ro.observe(nav);
    window.addEventListener('resize', check);

    return () => {
      nav.removeEventListener('scroll', check);
      ro.disconnect();
      window.removeEventListener('resize', check);
    };
  }, [navRef.current, collapsed]);

  // Listen for feature gate changes (dispatched by featureGate module)
  useEffect(() => {
    const handleGateChange = () => {
      setAdminDisabled(isFeatureDisabled('admin'));
      setSupportDisabled(isFeatureDisabled('support'));
    };

    window.addEventListener('interviet:feature-gate-change', handleGateChange);
    return () => window.removeEventListener('interviet:feature-gate-change', handleGateChange);
  }, []);

  useEffect(() => {
    localStorage.setItem(SIDEBAR_STORAGE_KEY, collapsed.toString());
  }, [collapsed]);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <aside 
      ref={asideRef}
      className={cn(
        'app-sidebar left-0 flex flex-col border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-900 transition-all duration-300 overflow-hidden',
        collapsed ? 'w-20' : 'w-80'
      )}
    >
      
      {/* Main navigation */}
      <nav ref={navRef} className={cn('flex-1 relative space-y-1 overflow-y-auto hide-scrollbar', collapsed ? 'py-2' : 'p-5')}>
        {/* Top gradient + up chevron when there is content above */}
        <div className={cn('sticky top-0 w-full flex justify-center pointer-events-none transition-all duration-300 ease-out', hasMoreAbove ? 'opacity-100' : 'opacity-0')}>
          <div className={cn('absolute -top-2 w-full h-7 bg-gradient-to-b from-white/95 to-transparent dark:from-slate-900/95 transition-opacity duration-300 ease-out', hasMoreAbove ? 'opacity-100' : 'opacity-0')} />
        </div>
        <div className="sticky top-0 flex justify-center pointer-events-none">
          <div className={cn('rounded-full p-1.5 shadow-sm ring-1 ring-black/5 dark:ring-white/10 bg-white/80 dark:bg-slate-900/80 transition-all duration-300 ease-out', hasMoreAbove ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1')}> 
            <ChevronUp className="w-4 h-4 text-gray-400" />
          </div>
        </div>

        {/* Candidate / User Section */}
        {isUser && (
          <NavSection
            label="Ứng viên"
            items={navItems}
            icon={Users}
            accentColor="text-blue-600"
            isActive={isActive}
            collapsed={collapsed}
          />
        )}

        {/* Mentor section */}
        {isMentor && (
          <NavSection
            label="Chuyên gia"
            items={mentorNavItems}
            icon={Briefcase}
            accentColor="text-orange-600"
            isActive={isActive}
            collapsed={collapsed}
          />
        )}

        {/* Support section — visible to support only unless feature gate is disabled */}
        {isSupport && !supportDisabled && (
          <NavSection
            label="Hỗ trợ"
            items={supportNavItems}
            icon={Headphones}
            accentColor="text-teal-600"
            isActive={isActive}
            collapsed={collapsed}
          />
        )}

        {/* Admin section — visible to admin only unless feature gate is disabled */}
        {isAdmin && !adminDisabled && (
          <NavSection
            label="Quản trị"
            items={adminNavItems}
            icon={Shield}
            accentColor="text-violet-600"
            isActive={isActive}
            collapsed={collapsed}
          />
        )}

        {/* Gradient fade to indicate more content below (positioned after sections so it sits below admin when present) */}
        <div className={cn('sticky bottom-6 w-full flex justify-center pointer-events-none transition-all duration-300 ease-out', hasMoreBelow ? 'opacity-100' : 'opacity-0')}>
          <div className={cn('absolute -bottom-2 w-full h-7 bg-gradient-to-t from-white/95 to-transparent dark:from-slate-900/95 transition-opacity duration-300 ease-out', hasMoreBelow ? 'opacity-100' : 'opacity-0')} />
        </div>

        {/* Sticky chevron indicator shown when there's more content below */}
        <div className="sticky bottom-0 flex justify-center pointer-events-none">
          <div className={cn('rounded-full p-1.5 shadow-sm ring-1 ring-black/5 dark:ring-white/10 bg-white/80 dark:bg-slate-900/80 transition-all duration-300 ease-out', hasMoreBelow ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1')}> 
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </div>
        </div>
      </nav>

      {/* Bottom navigation */}
      <div className={cn('space-y-1 border-t border-gray-200 dark:border-gray-800', collapsed ? 'py-2' : 'p-5')}>
        {bottomNavItems
          .filter(item => !(item.path === '/goi-dich-vu' && (isMentor || isAdmin)))
          .map((item) => (
          <NavLink key={item.path} item={item} isActive={isActive(item.path)} collapsed={collapsed} />
        ))}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-center border-t border-gray-200 dark:border-gray-800 p-5 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
        aria-label={collapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
      >
        {collapsed ? (
          <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        ) : (
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm">Thu gọn</span>
          </div>
        )}
      </button>
    </aside>
  );
};

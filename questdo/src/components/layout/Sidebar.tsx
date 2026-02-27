// 데스크탑 사이드바 — Apple Settings 스타일 내비게이션
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  CheckSquare,
  CalendarDays,
  Rss,
  Trophy,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/uiStore';
import { useAuthStore } from '@/stores/authStore';
import { useTranslation } from '@/hooks/useTranslation';
import { Sheet, SheetContent } from '@/components/ui/sheet';

// 네비게이션 메뉴 아이템 정의
const getNavItems = (t: (key: string) => string) => [
  { href: '/dashboard', icon: LayoutDashboard, label: t('nav.home') },
  { href: '/tasks', icon: CheckSquare, label: t('nav.tasks') },
  { href: '/calendar', icon: CalendarDays, label: t('nav.calendar') },
  { href: '/feed', icon: Rss, label: t('nav.feed') },
  { href: '/achievements', icon: Trophy, label: t('nav.achievements') },
  { href: '/analytics', icon: BarChart3, label: t('nav.analytics') },
  { href: '/settings', icon: Settings, label: t('nav.settings') },
];

// 사이드바 내용 (데스크탑/모바일 공유)
const SidebarContent = ({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) => {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const { t } = useTranslation();
  const navItems = getNavItems(t);

  return (
    <div className="flex h-full flex-col">
      {/* 프로필 영역 */}
      {user && (
        <div className={cn(
          'flex items-center gap-3 px-4 py-5',
          collapsed && 'justify-center px-2',
        )}>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#007AFF] to-[#5856D6] text-sm font-semibold text-white">
            {user.nickname?.charAt(0) || '?'}
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold tracking-tight">{user.nickname}</p>
              <p className="truncate text-[11px] text-muted-foreground">
                Lv.{user.level} · {user.title}
              </p>
            </div>
          )}
        </div>
      )}

      {/* 구분선 */}
      <div className="mx-4 border-b border-border/50" />

      {/* 네비게이션 메뉴 */}
      <nav className="flex-1 space-y-0.5 px-3 py-3">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                'relative flex items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-medium transition-all duration-200',
                collapsed && 'justify-center px-2',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground',
              )}
            >
              <item.icon className={cn(
                'h-[18px] w-[18px] shrink-0 transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground',
              )} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* 하단 버전 */}
      {!collapsed && (
        <div className="px-4 py-3">
          <p className="text-[10px] text-muted-foreground/60 text-center tracking-wide">
            QuestDo v1.0
          </p>
        </div>
      )}
    </div>
  );
};

export const Sidebar = () => {
  const { sidebarOpen, setSidebarOpen, sidebarCollapsed, toggleSidebarCollapsed } = useUIStore();

  return (
    <>
      {/* 데스크탑 사이드바 */}
      <aside
        className={cn(
          'hidden md:flex fixed left-0 top-12 bottom-0 z-30 flex-col border-r border-border/50 glass transition-all duration-300',
          sidebarCollapsed ? 'w-16' : 'w-60',
        )}
      >
        <SidebarContent collapsed={sidebarCollapsed} />

        {/* 접기/펼치기 버튼 */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute -right-3 top-6 h-6 w-6 rounded-full border border-border/50 bg-background shadow-sm hover:bg-accent"
          onClick={toggleSidebarCollapsed}
          aria-label={sidebarCollapsed ? '사이드바 펼치기' : '사이드바 접기'}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-3 w-3" />
          ) : (
            <ChevronLeft className="h-3 w-3" />
          )}
        </Button>
      </aside>

      {/* 모바일 사이드바 (Sheet) */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-72 p-0 border-none">
          <SidebarContent collapsed={false} onNavigate={() => setSidebarOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  );
};

// 상단 헤더 — Apple 스타일 글래스모피즘 내비게이션 바
'use client';

import { Menu, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from './ThemeToggle';
import { useUIStore } from '@/stores/uiStore';
import { useAuthStore } from '@/stores/authStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { useTranslation } from '@/hooks/useTranslation';
import Link from 'next/link';

export const Header = () => {
  const { setSidebarOpen } = useUIStore();
  const user = useAuthStore((state) => state.user);
  const unreadCount = useNotificationStore((state) => state.unreadCount);
  const { t } = useTranslation();

  return (
    <header className="sticky top-0 z-40 w-full glass border-b border-border/50">
      <div className="flex h-12 items-center px-4 md:px-5">
        {/* 모바일 메뉴 버튼 */}
        <Button
          variant="ghost"
          size="icon"
          className="mr-2 h-8 w-8 rounded-lg md:hidden"
          onClick={() => setSidebarOpen(true)}
          aria-label="메뉴 열기"
        >
          <Menu className="h-[18px] w-[18px]" />
        </Button>

        {/* 로고 */}
        <Link href="/dashboard" className="flex items-center gap-1.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
            <span className="text-xs font-bold text-primary-foreground">Q</span>
          </div>
          <span className="text-[15px] font-semibold tracking-tight hidden sm:inline">
            QuestDo
          </span>
        </Link>

        {/* 오른쪽 영역 */}
        <div className="ml-auto flex items-center gap-1">
          <ThemeToggle />

          {/* 알림 버튼 */}
          <Link href="/notifications">
            <Button
              variant="ghost"
              size="icon"
              className="relative h-8 w-8 rounded-lg"
              aria-label={t('nav.notifications')}
            >
              <Bell className="h-[18px] w-[18px]" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#FF3B30] px-1 text-[10px] font-bold text-white ring-2 ring-background">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Button>
          </Link>

          {/* 프로필 아바타 */}
          {user && (
            <Link href="/profile" className="ml-1">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[#007AFF] to-[#5856D6] text-[11px] font-semibold text-white ring-2 ring-background transition-transform hover:scale-105">
                {user.nickname?.charAt(0) || '?'}
              </div>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

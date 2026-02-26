// 모바일 하단 네비게이션 바 — iOS Tab Bar 스타일
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  CheckSquare,
  Rss,
  Bell,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNotificationStore } from '@/stores/notificationStore';
import { useTranslation } from '@/hooks/useTranslation';

export const BottomNav = () => {
  const pathname = usePathname();
  const unreadCount = useNotificationStore((state) => state.unreadCount);
  const { t } = useTranslation();

  // iOS 스타일 하단 네비 5개 탭
  const navItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: t('nav.home') },
    { href: '/tasks', icon: CheckSquare, label: t('nav.tasks') },
    { href: '/feed', icon: Rss, label: t('nav.feed') },
    { href: '/notifications', icon: Bell, label: t('nav.notifications'), badge: unreadCount },
    { href: '/profile', icon: User, label: t('nav.profile') },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 glass border-t border-border/30 md:hidden">
      <div className="flex h-[52px] items-end justify-around px-2 pb-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'relative flex flex-col items-center gap-0 px-3 py-1 transition-colors',
              )}
            >
              <div className="relative">
                <item.icon
                  className={cn(
                    'h-[22px] w-[22px] transition-colors',
                    isActive ? 'text-primary' : 'text-muted-foreground',
                  )}
                  strokeWidth={isActive ? 2.2 : 1.8}
                />
                {/* 알림 배지 */}
                {item.badge && item.badge > 0 && (
                  <span className="absolute -top-1 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#FF3B30] px-0.5 text-[9px] font-bold text-white">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>
              <span className={cn(
                'text-[10px] mt-0.5',
                isActive ? 'font-semibold text-primary' : 'font-medium text-muted-foreground',
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
      {/* iOS 하단 안전 영역 */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
};

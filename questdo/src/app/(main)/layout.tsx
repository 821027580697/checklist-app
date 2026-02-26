// 메인 레이아웃 — Apple 스타일
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { BottomNav } from '@/components/layout/BottomNav';
import GamificationProvider from '@/components/gamification/GamificationProvider';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { cn } from '@/lib/utils';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, isLoading, needsOnboarding } = useAuthStore();
  const sidebarCollapsed = useUIStore((state) => state.sidebarCollapsed);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated && !needsOnboarding) {
        router.push('/login');
      } else if (needsOnboarding) {
        router.push('/onboarding');
      }
    }
  }, [isAuthenticated, isLoading, needsOnboarding, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-primary/20 border-t-primary" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <GamificationProvider>
      <div className="min-h-screen bg-background">
        <Header />
        <Sidebar />

        <main
          className={cn(
            'min-h-[calc(100vh-3rem)] transition-all duration-300',
            'pb-24 md:pb-0',
            sidebarCollapsed ? 'md:ml-16' : 'md:ml-60',
          )}
        >
          <div className="mx-auto max-w-4xl px-4 py-6 md:px-8 md:py-8">
            {children}
          </div>
        </main>

        <BottomNav />
      </div>
    </GamificationProvider>
  );
}

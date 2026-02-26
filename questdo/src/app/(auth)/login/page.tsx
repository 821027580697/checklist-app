// 로그인 페이지 — Google 전용
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { signInWithGoogle } from '@/lib/firebase/auth';
import { useAuthStore } from '@/stores/authStore';
import { useTranslation } from '@/hooks/useTranslation';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { isAuthenticated, needsOnboarding, isLoading } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    if (isAuthenticated) {
      router.replace('/dashboard');
    } else if (needsOnboarding) {
      router.replace('/onboarding');
    }
  }, [isAuthenticated, needsOnboarding, isLoading, router]);

  const handleGoogleLogin = async () => {
    setIsSubmitting(true);
    try {
      const { user, error, message } = await signInWithGoogle();
      if (error || !user) {
        toast.error(message || 'Google 로그인에 실패했습니다');
        setIsSubmitting(false);
      }
    } catch {
      toast.error('오류가 발생했습니다. 다시 시도해주세요.');
      setIsSubmitting(false);
    }
  };

  if (isLoading || isAuthenticated || needsOnboarding) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-primary/20 border-t-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      {/* 배경 그라데이션 */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-1/4 -translate-x-1/2 h-[600px] w-[600px] rounded-full bg-gradient-to-br from-[#007AFF]/6 to-[#5856D6]/4 blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="w-full max-w-sm text-center"
      >
        {/* 로고 */}
        <div className="mb-12">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#007AFF] to-[#5856D6] shadow-lg shadow-[#007AFF]/20">
              <span className="text-2xl font-bold text-white">Q</span>
            </div>
          </Link>
          <h1 className="mt-6 text-[28px] font-bold tracking-tight text-foreground">
            QuestDo
          </h1>
          <p className="mt-2 text-[15px] text-muted-foreground leading-relaxed">
            할 일을 게임처럼, 성장을 눈에 보이게
          </p>
        </div>

        {/* Google 로그인 버튼 */}
        <div className="space-y-4">
          <Button
            variant="outline"
            className="w-full h-12 rounded-2xl text-[15px] font-medium border-border/60 bg-background hover:bg-secondary dark:hover:bg-[#2C2C2E] shadow-sm transition-all duration-200 hover:shadow-md"
            onClick={handleGoogleLogin}
            disabled={isSubmitting}
          >
            <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            {isSubmitting ? '로그인 중...' : 'Google로 계속하기'}
          </Button>

          <p className="text-[12px] text-muted-foreground/60 leading-relaxed px-4">
            계속하면 QuestDo의{' '}
            <span className="text-muted-foreground">이용약관</span> 및{' '}
            <span className="text-muted-foreground">개인정보처리방침</span>에
            동의하게 됩니다.
          </p>
        </div>
      </motion.div>
    </div>
  );
}

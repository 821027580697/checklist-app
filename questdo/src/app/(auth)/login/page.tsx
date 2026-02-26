// 로그인 페이지 — Apple ID 스타일
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { signInWithEmail, signInWithGoogle } from '@/lib/firebase/auth';
import { useAuthStore } from '@/stores/authStore';
import { useTranslation } from '@/hooks/useTranslation';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { isAuthenticated, needsOnboarding, isLoading } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 상태 기반 리다이렉트 — AuthProvider가 상태를 설정하면 자동으로 이동
  useEffect(() => {
    if (isLoading) return;
    if (isAuthenticated) {
      router.replace('/dashboard');
    } else if (needsOnboarding) {
      router.replace('/onboarding');
    }
  }, [isAuthenticated, needsOnboarding, isLoading, router]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('이메일과 비밀번호를 입력해주세요');
      return;
    }

    setIsSubmitting(true);
    try {
      const { user, error, message } = await signInWithEmail(email, password);
      if (error || !user) {
        toast.error(message || '로그인에 실패했습니다');
        setIsSubmitting(false);
        return;
      }
      // 성공 시 AuthProvider의 onAuthStateChanged가 상태를 업데이트
      // → isAuthenticated=true → useEffect에서 /dashboard로 리다이렉트
      toast.success('로그인 성공!');
    } catch {
      toast.error('오류가 발생했습니다. 다시 시도해주세요.');
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsSubmitting(true);
    try {
      const { user, error, message } = await signInWithGoogle();
      if (error || !user) {
        toast.error(message || 'Google 로그인에 실패했습니다');
        setIsSubmitting(false);
        return;
      }
      // AuthProvider가 상태를 판단하여 자동 리다이렉트
    } catch {
      toast.error('오류가 발생했습니다. 다시 시도해주세요.');
      setIsSubmitting(false);
    }
  };

  // 이미 인증된 사용자는 로딩 스피너 표시
  if (isAuthenticated || needsOnboarding) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-primary/20 border-t-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      {/* 배경 */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-1/3 -translate-x-1/2 h-[500px] w-[500px] rounded-full bg-[#007AFF]/5 blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="w-full max-w-sm"
      >
        {/* 로고 */}
        <div className="mb-10 text-center">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
              <span className="text-lg font-bold text-white">Q</span>
            </div>
          </Link>
          <h1 className="mt-5 text-2xl font-bold tracking-tight">{t('auth.login')}</h1>
          <p className="mt-1.5 text-[13px] text-muted-foreground">
            QuestDo 계정에 로그인하세요
          </p>
        </div>

        <div className="space-y-4">
          {/* 소셜 로그인 */}
          <Button
            variant="outline"
            className="w-full h-11 rounded-xl text-[13px] font-medium"
            onClick={handleGoogleLogin}
            disabled={isSubmitting}
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Google로 계속하기
          </Button>

          <div className="relative py-1">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-3 text-[11px] text-muted-foreground uppercase tracking-wider">
              또는
            </span>
          </div>

          {/* 이메일 로그인 폼 */}
          <form onSubmit={handleEmailLogin} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-[13px] font-medium">{t('auth.email')}</Label>
              <Input
                id="email"
                type="email"
                placeholder="hello@questdo.app"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 rounded-xl text-[14px] bg-secondary/50 border-0 focus-visible:ring-1 focus-visible:ring-primary"
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-[13px] font-medium">{t('auth.password')}</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 rounded-xl text-[14px] pr-10 bg-secondary/50 border-0 focus-visible:ring-1 focus-visible:ring-primary"
                  disabled={isSubmitting}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                </Button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11 rounded-xl text-[14px] font-semibold mt-1"
              disabled={isSubmitting}
            >
              {isSubmitting ? '로그인 중...' : t('auth.login')}
            </Button>
          </form>

          {/* 회원가입 링크 */}
          <p className="text-center text-[13px] text-muted-foreground pt-2">
            {t('auth.noAccount')}{' '}
            <Link href="/signup" className="font-semibold text-primary hover:underline">
              {t('auth.signup')}
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

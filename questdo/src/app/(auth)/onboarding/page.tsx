// 온보딩 페이지 — 닉네임, 아바타, 관심 카테고리 설정
'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useAuthStore } from '@/stores/authStore';
import { createUserDocument, checkNicknameAvailable } from '@/lib/firebase/auth';
import { auth } from '@/lib/firebase/config';
import { AVATAR_EMOJIS, DEFAULT_CATEGORIES } from '@/constants/categories';
import { useTranslation } from '@/hooks/useTranslation';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Check, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react';
import { TaskCategory } from '@/types/task';
import { User } from '@/types/user';

// 온보딩 3단계
const STEPS = ['nickname', 'avatar', 'category'] as const;

export default function OnboardingPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { isAuthenticated, needsOnboarding, isLoading, firebaseUid } = useAuthStore();
  const setUser = useAuthStore((state) => state.setUser);
  const setNeedsOnboarding = useAuthStore((state) => state.setNeedsOnboarding);

  const [step, setStep] = useState(0);
  const [nickname, setNickname] = useState('');
  const [nicknameStatus, setNicknameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [selectedAvatar, setSelectedAvatar] = useState(0);
  const [selectedCategories, setSelectedCategories] = useState<TaskCategory[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 온보딩이 필요 없으면 리다이렉트
  useEffect(() => {
    if (isLoading) return;
    if (isAuthenticated && !needsOnboarding) {
      router.replace('/dashboard');
    } else if (!firebaseUid && !needsOnboarding) {
      router.replace('/login');
    }
  }, [isAuthenticated, needsOnboarding, isLoading, firebaseUid, router]);

  // 닉네임 중복 체크 (디바운스 적용)
  const handleNicknameChange = useCallback(async (value: string) => {
    setNickname(value);

    if (value.length < 2) {
      setNicknameStatus('idle');
      return;
    }

    setNicknameStatus('checking');
    try {
      const available = await checkNicknameAvailable(value);
      setNicknameStatus(available ? 'available' : 'taken');
    } catch {
      setNicknameStatus('idle');
    }
  }, []);

  // 카테고리 선택 토글
  const toggleCategory = (category: TaskCategory) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category],
    );
  };

  // 다음 단계로
  const handleNext = () => {
    if (step === 0 && (nickname.length < 2 || nicknameStatus === 'taken')) {
      toast.error('유효한 닉네임을 입력해주세요');
      return;
    }
    setStep((prev) => Math.min(prev + 1, STEPS.length - 1));
  };

  // 이전 단계로
  const handleBack = () => {
    setStep((prev) => Math.max(prev - 1, 0));
  };

  // 온보딩 완료 처리
  const handleComplete = async () => {
    const currentUser = auth?.currentUser;
    if (!currentUser) {
      toast.error('로그인이 필요합니다');
      router.replace('/login');
      return;
    }

    if (nickname.length < 2) {
      toast.error('닉네임을 2자 이상 입력해주세요');
      return;
    }

    setIsSubmitting(true);
    try {
      const avatarUrl = AVATAR_EMOJIS[selectedAvatar] || '🧑‍💻';
      const { data, error } = await createUserDocument(currentUser, nickname, avatarUrl);

      if (error || !data) {
        toast.error('프로필 설정에 실패했습니다. 다시 시도해주세요.');
        setIsSubmitting(false);
        return;
      }

      // 생성된 사용자 데이터를 스토어에 설정 → isAuthenticated: true
      setUser(data as User);
      setNeedsOnboarding(false);

      toast.success('QuestDo에 오신 것을 환영합니다! 🎉');
      router.replace('/dashboard');
    } catch {
      toast.error('오류가 발생했습니다. 다시 시도해주세요.');
      setIsSubmitting(false);
    }
  };

  // 로딩 중이면 스피너
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-primary/20 border-t-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      {/* 배경 */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-1/3 -translate-x-1/2 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-blue-500/10 to-purple-500/10 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        {/* 로고 */}
        <div className="mb-6 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary mb-3">
            <span className="text-xl font-bold text-white">Q</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">프로필 설정</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('onboarding.title')}</p>
        </div>

        {/* 진행 표시기 */}
        <div className="mb-6 flex items-center justify-center gap-2">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all',
                  i < step
                    ? 'bg-primary text-primary-foreground'
                    : i === step
                    ? 'bg-primary text-primary-foreground ring-2 ring-primary/30 ring-offset-2'
                    : 'bg-muted text-muted-foreground',
                )}
              >
                {i < step ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className={cn('h-0.5 w-8', i < step ? 'bg-primary' : 'bg-muted')} />
              )}
            </div>
          ))}
        </div>

        <Card className="border-border/50 shadow-lg">
          <CardContent className="p-6">
            <AnimatePresence mode="wait">
              {/* Step 1: 닉네임 */}
              {step === 0 && (
                <motion.div
                  key="nickname"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="text-center mb-6">
                    <h2 className="text-xl font-semibold">{t('onboarding.step1')}</h2>
                    <p className="text-sm text-muted-foreground mt-1">다른 사용자에게 보여질 이름이에요</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nickname">{t('onboarding.nicknameLabel')}</Label>
                    <Input
                      id="nickname"
                      value={nickname}
                      onChange={(e) => handleNicknameChange(e.target.value)}
                      placeholder={t('onboarding.nicknamePlaceholder')}
                      maxLength={20}
                      className="rounded-xl h-11"
                    />
                    {nicknameStatus === 'available' && (
                      <p className="text-xs text-green-500 flex items-center gap-1">
                        <Check className="h-3 w-3" />
                        {t('onboarding.nicknameAvailable')}
                      </p>
                    )}
                    {nicknameStatus === 'taken' && (
                      <p className="text-xs text-red-500">
                        {t('onboarding.nicknameTaken')}
                      </p>
                    )}
                    {nicknameStatus === 'checking' && (
                      <p className="text-xs text-muted-foreground">확인 중...</p>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Step 2: 아바타 선택 */}
              {step === 1 && (
                <motion.div
                  key="avatar"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="text-center mb-6">
                    <h2 className="text-xl font-semibold">{t('onboarding.step2')}</h2>
                    <p className="text-sm text-muted-foreground mt-1">{t('onboarding.avatarLabel')}</p>
                  </div>

                  <div className="grid grid-cols-4 gap-3">
                    {AVATAR_EMOJIS.map((emoji, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedAvatar(index)}
                        className={cn(
                          'flex h-16 w-full items-center justify-center rounded-2xl text-3xl transition-all duration-200',
                          selectedAvatar === index
                            ? 'bg-primary/10 ring-2 ring-primary scale-110 shadow-lg'
                            : 'bg-muted hover:bg-muted/80 hover:scale-105',
                        )}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Step 3: 카테고리 선택 */}
              {step === 2 && (
                <motion.div
                  key="category"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="text-center mb-6">
                    <h2 className="text-xl font-semibold">{t('onboarding.step3')}</h2>
                    <p className="text-sm text-muted-foreground mt-1">{t('onboarding.categorySubtitle')}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {DEFAULT_CATEGORIES.map((cat) => {
                      const isSelected = selectedCategories.includes(cat.value);
                      return (
                        <button
                          key={cat.value}
                          onClick={() => toggleCategory(cat.value)}
                          className={cn(
                            'flex items-center gap-3 rounded-2xl border-2 p-4 transition-all duration-200',
                            isSelected
                              ? 'border-primary bg-primary/5 shadow-sm'
                              : 'border-border hover:border-primary/30 hover:bg-accent',
                          )}
                        >
                          <span className="text-2xl">{cat.icon}</span>
                          <span className="text-sm font-medium">{cat.label.ko}</span>
                          {isSelected && (
                            <Check className="ml-auto h-4 w-4 text-primary" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 네비게이션 버튼 */}
            <div className="mt-8 flex items-center justify-between">
              {step > 0 ? (
                <Button
                  variant="ghost"
                  onClick={handleBack}
                  className="rounded-xl"
                >
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  {t('common.back')}
                </Button>
              ) : (
                <div />
              )}

              {step < STEPS.length - 1 ? (
                <Button onClick={handleNext} className="rounded-xl">
                  {t('common.next')}
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleComplete}
                  disabled={isSubmitting}
                  className="rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:opacity-90"
                >
                  <Sparkles className="mr-1 h-4 w-4" />
                  {isSubmitting ? '설정 중...' : t('onboarding.startButton')}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

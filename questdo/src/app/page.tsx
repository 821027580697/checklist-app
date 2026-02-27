// 랜딩 페이지 — Apple 프로덕트 스타일 + 3D 체크리스트 애니메이션
'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/authStore';
import { CheckSquare, Flame, Trophy, Users, ArrowRight, Sparkles, Check } from 'lucide-react';

// ── 3D 체크리스트 카드 ──
function ChecklistCard3D() {
  const ref = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useSpring(useTransform(mouseY, [-200, 200], [15, -15]), { stiffness: 150, damping: 20 });
  const rotateY = useSpring(useTransform(mouseX, [-200, 200], [-15, 15]), { stiffness: 150, damping: 20 });

  const handleMouse = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left - rect.width / 2);
    mouseY.set(e.clientY - rect.top - rect.height / 2);
  };

  const handleLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const [checkedItems, setCheckedItems] = useState([false, false, false, false, false]);

  // 자동 체크 애니메이션
  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];
    checkedItems.forEach((_, i) => {
      timers.push(
        setTimeout(() => {
          setCheckedItems((prev) => {
            const next = [...prev];
            next[i] = true;
            return next;
          });
        }, 1200 + i * 600),
      );
    });

    // 리셋 후 반복
    const resetTimer = setTimeout(() => {
      setCheckedItems([false, false, false, false, false]);
    }, 6000);

    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(resetTimer);
    };
  }, [checkedItems[4]]); // eslint-disable-line react-hooks/exhaustive-deps

  const items = [
    { text: '아침 운동하기', emoji: '🏃' },
    { text: 'React 공부하기', emoji: '📘' },
    { text: '물 2L 마시기', emoji: '💧' },
    { text: '일기 쓰기', emoji: '📝' },
    { text: '9시 취침', emoji: '🌙' },
  ];

  const completedCount = checkedItems.filter(Boolean).length;
  const progress = (completedCount / items.length) * 100;

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={handleLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
        perspective: '1200px',
      }}
      className="relative mx-auto w-full max-w-[320px]"
    >
      {/* 글로우 효과 */}
      <motion.div
        className="absolute -inset-4 rounded-3xl opacity-50 blur-2xl"
        style={{
          background: `linear-gradient(135deg, rgba(0,122,255,${0.1 + progress * 0.003}), rgba(88,86,214,${0.1 + progress * 0.003}), rgba(52,199,89,${progress > 50 ? 0.15 : 0}))`,
        }}
        animate={{
          scale: [1, 1.02, 1],
        }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* 카드 */}
      <motion.div
        className="relative rounded-2xl border border-border/50 bg-card p-6 shadow-xl dark:bg-[#1C1C1E] dark:border-white/10"
        style={{ transform: 'translateZ(50px)' }}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
              <CheckSquare className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="text-[14px] font-bold tracking-tight dark:text-white">오늘의 퀘스트</h3>
              <p className="text-[10px] text-muted-foreground">{completedCount}/{items.length} 완료</p>
            </div>
          </div>
          <motion.div
            className="flex h-10 w-10 items-center justify-center rounded-full"
            style={{
              background: progress === 100
                ? 'linear-gradient(135deg, #34C759, #30D158)'
                : `conic-gradient(#007AFF ${progress}%, #E5E5EA ${progress}%)`,
            }}
            animate={progress === 100 ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 0.5 }}
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-card dark:bg-[#1C1C1E]">
              {progress === 100 ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 500 }}
                >
                  <Check className="h-4 w-4 text-[#34C759]" strokeWidth={3} />
                </motion.div>
              ) : (
                <span className="text-[10px] font-bold text-primary">{Math.round(progress)}%</span>
              )}
            </div>
          </motion.div>
        </div>

        {/* 진행률 바 */}
        <div className="h-1.5 rounded-full bg-secondary overflow-hidden mb-4">
          <motion.div
            className="h-full rounded-full"
            animate={{
              width: `${progress}%`,
              backgroundColor: progress === 100 ? '#34C759' : '#007AFF',
            }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        </div>

        {/* 체크리스트 아이템들 */}
        <div className="space-y-2">
          {items.map((item, i) => (
            <motion.div
              key={item.text}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-300 ${
                checkedItems[i]
                  ? 'bg-[#34C759]/8 dark:bg-[#34C759]/15'
                  : 'bg-secondary/50 dark:bg-white/5'
              }`}
              onClick={() =>
                setCheckedItems((prev) => {
                  const next = [...prev];
                  next[i] = !next[i];
                  return next;
                })
              }
              style={{ cursor: 'pointer' }}
            >
              <motion.div
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-all duration-300 ${
                  checkedItems[i]
                    ? 'bg-[#34C759] shadow-md shadow-[#34C759]/20'
                    : 'border-2 border-dashed border-muted-foreground/30'
                }`}
                animate={checkedItems[i] ? { scale: [0.8, 1.15, 1] } : {}}
                transition={{ duration: 0.3 }}
              >
                {checkedItems[i] && (
                  <motion.div
                    initial={{ scale: 0, rotate: -45 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                  >
                    <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />
                  </motion.div>
                )}
              </motion.div>
              <span
                className={`text-[13px] font-medium transition-all duration-300 ${
                  checkedItems[i]
                    ? 'text-muted-foreground line-through'
                    : 'text-foreground dark:text-white'
                }`}
              >
                {item.emoji} {item.text}
              </span>
              {checkedItems[i] && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="ml-auto text-[10px] font-semibold text-[#34C759]"
                >
                  +5 XP
                </motion.span>
              )}
            </motion.div>
          ))}
        </div>

        {/* 레벨 바 */}
        {completedCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 flex items-center gap-2 rounded-xl bg-primary/5 dark:bg-primary/10 px-3 py-2"
          >
            <span className="text-[11px] font-bold text-primary">Lv.1</span>
            <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-primary"
                animate={{ width: `${(completedCount / items.length) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <span className="text-[10px] text-primary font-medium">+{completedCount * 5} XP</span>
          </motion.div>
        )}
      </motion.div>

      {/* 떠다니는 파티클 */}
      {completedCount === items.length && (
        <>
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={`particle-${i}`}
              className="absolute rounded-full"
              style={{
                width: 6 + Math.random() * 6,
                height: 6 + Math.random() * 6,
                background: ['#FF3B30', '#FF9500', '#FFCC00', '#34C759', '#007AFF', '#AF52DE'][i],
                left: `${20 + Math.random() * 60}%`,
                top: `${10 + Math.random() * 80}%`,
              }}
              animate={{
                y: [0, -30 - Math.random() * 40, 0],
                x: [0, (Math.random() - 0.5) * 40, 0],
                opacity: [0, 1, 0],
                scale: [0, 1.5, 0],
              }}
              transition={{
                duration: 1.5 + Math.random(),
                repeat: Infinity,
                delay: i * 0.2,
                ease: 'easeInOut',
              }}
            />
          ))}
        </>
      )}
    </motion.div>
  );
}

export default function LandingPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  const features = [
    {
      icon: CheckSquare,
      title: '스마트 할 일 관리',
      titleEn: 'Smart Task Management',
      desc: '카테고리, 우선순위, 서브태스크로 체계적으로 관리하세요',
      color: '#007AFF',
    },
    {
      icon: Flame,
      title: '습관 트래커',
      titleEn: 'Habit Tracker',
      desc: 'GitHub 잔디처럼 습관을 시각화하고 스트릭을 이어가세요',
      color: '#FF9500',
    },
    {
      icon: Trophy,
      title: '게이미피케이션',
      titleEn: 'Gamification',
      desc: 'XP를 모아 레벨업하고, 30종+ 배지를 수집하세요',
      color: '#AF52DE',
    },
    {
      icon: Users,
      title: '소셜 피드',
      titleEn: 'Social Feed',
      desc: '성과를 공유하고, 친구들과 함께 성장하세요',
      color: '#34C759',
    },
  ];

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* ─── 히어로 섹션 ─── */}
      <section className="relative flex min-h-screen flex-col items-center justify-center px-6 text-center">
        {/* 배경 그라데이션 — Apple 스타일 */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-[#007AFF]/8 blur-[120px]" />
          <div className="absolute right-1/4 top-1/2 h-[400px] w-[400px] rounded-full bg-[#AF52DE]/6 blur-[100px]" />
          <div className="absolute left-1/4 bottom-1/4 h-[300px] w-[300px] rounded-full bg-[#34C759]/6 blur-[80px]" />
        </div>

        {/* 내비게이션 바 */}
        <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/30">
          <div className="mx-auto max-w-6xl flex h-12 items-center justify-between px-6">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
                <span className="text-xs font-bold text-white">Q</span>
              </div>
              <span className="text-[15px] font-semibold tracking-tight">QuestDo</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                className="text-[13px] font-medium h-8 rounded-full px-4"
                onClick={() => router.push('/login')}
              >
                시작하기
              </Button>
            </div>
          </div>
        </nav>

        {/* 히어로 콘텐츠 — 2열 레이아웃 */}
        <div className="mx-auto max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* 왼쪽 텍스트 */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="text-left"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="mb-6 inline-flex items-center gap-1.5 rounded-full bg-primary/8 px-3.5 py-1.5 text-[13px] font-medium text-primary"
            >
              <Sparkles className="h-3.5 w-3.5" />
              할 일을 게임처럼
            </motion.div>

            <h1 className="mb-5 text-4xl font-bold tracking-tight leading-[1.1] md:text-6xl lg:text-7xl">
              <span className="text-foreground">할 일 완료가</span>
              <br />
              <span className="bg-gradient-to-r from-[#007AFF] to-[#5856D6] bg-clip-text text-transparent">
                레벨업이 되는 순간
              </span>
            </h1>

            <p className="mb-10 text-lg text-muted-foreground leading-relaxed max-w-xl md:text-xl">
              습관을 기록하고, 배지를 모으고, 친구와 함께 성장하세요.
              <br className="hidden md:block" />
              QuestDo가 일상을 모험으로 바꿔드립니다.
            </p>

            <div className="flex flex-col items-start gap-3 sm:flex-row">
              <Button
                size="lg"
                className="h-12 w-full rounded-full px-8 text-[15px] font-semibold shadow-lg shadow-primary/20 sm:w-auto"
                onClick={() => router.push('/login')}
              >
                Google로 시작하기
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </div>
          </motion.div>

          {/* 오른쪽 3D 체크리스트 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="hidden lg:block"
          >
            <ChecklistCard3D />
          </motion.div>
        </div>

        {/* 모바일 3D 카드 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="lg:hidden mt-10 w-full"
        >
          <ChecklistCard3D />
        </motion.div>

        {/* 스크롤 인디케이터 */}
        <motion.div
          className="absolute bottom-10"
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div className="h-8 w-5 rounded-full border-2 border-muted-foreground/20 p-1">
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 mx-auto"
            />
          </div>
        </motion.div>
      </section>

      {/* ─── 기능 소개 섹션 ─── */}
      <section className="apple-section-alt px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              왜 QuestDo인가요?
            </h2>
            <p className="mt-3 text-muted-foreground text-lg">
              단순한 체크리스트를 넘어, 성장하는 경험을 제공합니다.
            </p>
          </motion.div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="apple-card p-6 text-center group"
              >
                <div
                  className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl transition-transform group-hover:scale-110"
                  style={{ backgroundColor: feature.color + '14' }}
                >
                  <feature.icon
                    className="h-6 w-6"
                    style={{ color: feature.color }}
                  />
                </div>
                <h3 className="mb-1.5 text-[15px] font-semibold tracking-tight">{feature.title}</h3>
                <p className="text-[13px] text-muted-foreground leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA 섹션 ─── */}
      <section className="px-6 py-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-xl"
        >
          <h2 className="text-3xl font-bold tracking-tight mb-4 md:text-4xl">
            지금 바로 시작하세요
          </h2>
          <p className="text-muted-foreground text-lg mb-8">
            무료로 QuestDo를 체험하고, 일상의 변화를 경험하세요.
          </p>
          <Button
            size="lg"
            className="h-12 rounded-full px-10 text-[15px] font-semibold shadow-lg shadow-primary/20"
            onClick={() => router.push('/login')}
          >
            Google로 시작하기
            <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>
        </motion.div>
      </section>

      {/* ─── 푸터 ─── */}
      <footer className="border-t border-border/50 px-6 py-6 text-center">
        <p className="text-[12px] text-muted-foreground/60">
          © 2026 QuestDo. All rights reserved.
        </p>
      </footer>
    </div>
  );
}

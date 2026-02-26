// 랜딩 페이지 — Apple 프로덕트 스타일
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/authStore';
import { CheckSquare, Flame, Trophy, Users, ArrowRight, Sparkles } from 'lucide-react';

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

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="max-w-3xl"
        >
          {/* 배지 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mb-6 inline-flex items-center gap-1.5 rounded-full bg-primary/8 px-3.5 py-1.5 text-[13px] font-medium text-primary"
          >
            <Sparkles className="h-3.5 w-3.5" />
            할 일을 게임처럼
          </motion.div>

          <h1 className="mb-5 text-5xl font-bold tracking-tight leading-[1.1] md:text-7xl">
            <span className="text-foreground">할 일 완료가</span>
            <br />
            <span className="bg-gradient-to-r from-[#007AFF] to-[#5856D6] bg-clip-text text-transparent">
              레벨업이 되는 순간
            </span>
          </h1>

          <p className="mb-10 text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto md:text-xl">
            습관을 기록하고, 배지를 모으고, 친구와 함께 성장하세요.
            <br className="hidden md:block" />
            QuestDo가 일상을 모험으로 바꿔드립니다.
          </p>

          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
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

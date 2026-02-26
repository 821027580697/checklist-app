// 생산성 리포트 페이지 — Recharts 차트
'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useAuthStore } from '@/stores/authStore';
import { useTaskStore } from '@/stores/taskStore';
import { useTranslation } from '@/hooks/useTranslation';
import { CATEGORY_LABELS, TaskCategory } from '@/types/task';
import { BarChart3, TrendingUp, Target, Flame } from 'lucide-react';

// Recharts 동적 임포트 (SSR 비활성화)
const ResponsiveContainer = dynamic(
  () => import('recharts').then((mod) => mod.ResponsiveContainer),
  { ssr: false },
);
const BarChart = dynamic(() => import('recharts').then((mod) => mod.BarChart), { ssr: false });
const Bar = dynamic(() => import('recharts').then((mod) => mod.Bar), { ssr: false });
const XAxis = dynamic(() => import('recharts').then((mod) => mod.XAxis), { ssr: false });
const YAxis = dynamic(() => import('recharts').then((mod) => mod.YAxis), { ssr: false });
const CartesianGrid = dynamic(() => import('recharts').then((mod) => mod.CartesianGrid), { ssr: false });
const RechartsTooltip = dynamic(() => import('recharts').then((mod) => mod.Tooltip), { ssr: false });
const PieChart = dynamic(() => import('recharts').then((mod) => mod.PieChart), { ssr: false });
const Pie = dynamic(() => import('recharts').then((mod) => mod.Pie), { ssr: false });
const Cell = dynamic(() => import('recharts').then((mod) => mod.Cell), { ssr: false });

// 카테고리 색상
const COLORS = ['#007AFF', '#34C759', '#FF9500', '#FF3B30', '#5856D6', '#AF52DE', '#00C7BE', '#8E8E93'];

export default function AnalyticsPage() {
  const { t, language } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const tasks = useTaskStore((state) => state.tasks);
  const lang = language as 'ko' | 'en';

  // 주간 완료율 데이터 (데모)
  const weeklyData = useMemo(() => {
    const labels = lang === 'ko'
      ? ['1주차', '2주차', '3주차', '이번 주']
      : ['Week 1', 'Week 2', 'Week 3', 'This Week'];

    return labels.map((name, i) => ({
      name,
      completed: Math.floor(Math.random() * 15) + 5 + i * 2,
      total: Math.floor(Math.random() * 5) + 15 + i,
    }));
  }, [lang]);

  // 카테고리 분배 데이터
  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    tasks.forEach((task) => {
      if (task.status === 'completed') {
        const label = CATEGORY_LABELS[task.category][lang];
        counts[label] = (counts[label] || 0) + 1;
      }
    });

    // 데모 데이터
    if (Object.keys(counts).length === 0) {
      return [
        { name: CATEGORY_LABELS.work[lang], value: 40 },
        { name: CATEGORY_LABELS.health[lang], value: 25 },
        { name: CATEGORY_LABELS.study[lang], value: 20 },
        { name: CATEGORY_LABELS.personal[lang], value: 15 },
      ];
    }

    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [tasks, lang]);

  // 이번 주 요약 통계
  const weeklySummary = useMemo(() => {
    const completedThisWeek = tasks.filter((t) => t.status === 'completed').length;
    return {
      tasksCompleted: completedThisWeek || 12,
      habitRate: 85,
      xpEarned: user?.totalXp || 280,
      streakDays: user?.stats.currentStreak || 5,
    };
  }, [tasks, user]);

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold">{t('analytics.title')}</h1>
      </motion.div>

      {/* 이번 주 요약 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: Target, label: t('analytics.tasksCompleted'), value: weeklySummary.tasksCompleted, suffix: lang === 'ko' ? '개' : '' },
          { icon: TrendingUp, label: t('analytics.habitRate'), value: weeklySummary.habitRate, suffix: '%' },
          { icon: BarChart3, label: t('analytics.xpEarned'), value: weeklySummary.xpEarned, suffix: ' XP' },
          { icon: Flame, label: t('analytics.streakDays'), value: weeklySummary.streakDays, suffix: lang === 'ko' ? '일' : ' days' },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card>
              <CardContent className="p-4">
                <stat.icon className="h-5 w-5 text-muted-foreground mb-2" />
                <p className="text-2xl font-bold">{stat.value}{stat.suffix}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* 주간/월간 탭 */}
      <Tabs defaultValue="weekly">
        <TabsList>
          <TabsTrigger value="weekly">{t('analytics.weekly')}</TabsTrigger>
          <TabsTrigger value="monthly">{t('analytics.monthly')}</TabsTrigger>
        </TabsList>

        <TabsContent value="weekly" className="space-y-4 mt-4">
          {/* 완료율 추이 차트 */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{t('analytics.completionRate')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <RechartsTooltip />
                    <Bar dataKey="completed" fill="#007AFF" radius={[6, 6, 0, 0]} name={t('tasks.completed')} />
                    <Bar dataKey="total" fill="#E5E5EA" radius={[6, 6, 0, 0]} name={lang === 'ko' ? '전체' : 'Total'} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* 카테고리 분배 차트 */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{t('analytics.categoryDistribution')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={4}
                      dataKey="value"
                      label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    >
                      {categoryData.map((_, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monthly" className="mt-4">
          <Card>
            <CardContent className="p-8 text-center">
              <BarChart3 className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                {lang === 'ko' ? '월간 리포트는 더 많은 데이터가 쌓이면 확인할 수 있어요' : 'Monthly report will be available with more data'}
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

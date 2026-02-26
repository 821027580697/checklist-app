// 생산성 리포트 페이지 — 실제 사용자 데이터 기반
'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useAuthStore } from '@/stores/authStore';
import { useTaskStore } from '@/stores/taskStore';
import { useHabitStore } from '@/stores/habitStore';
import { useTranslation } from '@/hooks/useTranslation';
import { CATEGORY_LABELS } from '@/types/task';
import { BarChart3, TrendingUp, Target, Flame, CheckCircle2, ListTodo } from 'lucide-react';

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

const COLORS = ['#007AFF', '#34C759', '#FF9500', '#FF3B30', '#5856D6', '#AF52DE', '#00C7BE', '#8E8E93'];

export default function AnalyticsPage() {
  const { t, language } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const tasks = useTaskStore((state) => state.tasks);
  const habits = useHabitStore((state) => state.habits);
  const lang = language as 'ko' | 'en';

  // 실제 완료된 작업 수
  const completedTasks = useMemo(() => tasks.filter((t) => t.status === 'completed'), [tasks]);
  const pendingTasks = useMemo(() => tasks.filter((t) => t.status !== 'completed'), [tasks]);

  // 최근 7일 완료율 데이터 (실제 데이터)
  const weeklyData = useMemo(() => {
    const days: { name: string; completed: number; total: number }[] = [];
    const dayNames = lang === 'ko'
      ? ['일', '월', '화', '수', '목', '금', '토']
      : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const dayCompleted = tasks.filter((task) => {
        if (task.status !== 'completed' || !task.completedAt) return false;
        try {
          const completedDate = task.completedAt.toDate();
          return completedDate >= date && completedDate < nextDate;
        } catch {
          return false;
        }
      }).length;

      const dayTotal = tasks.filter((task) => {
        if (!task.dueDate) return false;
        try {
          const dueDate = task.dueDate.toDate();
          return dueDate >= date && dueDate < nextDate;
        } catch {
          return false;
        }
      }).length;

      days.push({
        name: dayNames[date.getDay()],
        completed: dayCompleted,
        total: Math.max(dayTotal, dayCompleted),
      });
    }

    return days;
  }, [tasks, lang]);

  // 카테고리 분배 데이터 (실제 데이터만)
  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    completedTasks.forEach((task) => {
      const label = CATEGORY_LABELS[task.category]?.[lang] || task.category;
      counts[label] = (counts[label] || 0) + 1;
    });

    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [completedTasks, lang]);

  // 습관 달성률 (실제 데이터)
  const habitRate = useMemo(() => {
    if (habits.length === 0) return 0;
    const today = new Date().toISOString().split('T')[0];
    const todayChecked = habits.filter((h) => h.completedDates?.includes(today)).length;
    return Math.round((todayChecked / habits.length) * 100);
  }, [habits]);

  // 이번 주 요약 통계 (실제 데이터)
  const weeklySummary = useMemo(() => ({
    tasksCompleted: completedTasks.length,
    habitRate,
    xpEarned: user?.totalXp || 0,
    streakDays: user?.stats?.currentStreak || 0,
  }), [completedTasks, habitRate, user]);

  const hasData = tasks.length > 0 || habits.length > 0;

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-[28px] font-bold tracking-tight">{t('analytics.title')}</h1>
        <p className="text-[13px] text-muted-foreground mt-1">
          {lang === 'ko' ? '나의 생산성과 성장 현황' : 'Your productivity & growth'}
        </p>
      </motion.div>

      {/* 이번 주 요약 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: Target, label: lang === 'ko' ? '완료한 할 일' : 'Completed', value: weeklySummary.tasksCompleted, suffix: lang === 'ko' ? '개' : '', color: 'text-[#007AFF]' },
          { icon: TrendingUp, label: lang === 'ko' ? '습관 달성률' : 'Habit Rate', value: weeklySummary.habitRate, suffix: '%', color: 'text-[#34C759]' },
          { icon: BarChart3, label: lang === 'ko' ? '총 경험치' : 'Total XP', value: weeklySummary.xpEarned, suffix: ' XP', color: 'text-[#AF52DE]' },
          { icon: Flame, label: lang === 'ko' ? '연속 달성' : 'Streak', value: weeklySummary.streakDays, suffix: lang === 'ko' ? '일' : 'd', color: 'text-[#FF9500]' },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
          >
            <Card className="border-border/50">
              <CardContent className="p-4">
                <stat.icon className={`h-5 w-5 ${stat.color} mb-2`} />
                <p className="text-2xl font-bold tracking-tight">{stat.value}{stat.suffix}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{stat.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {!hasData ? (
        /* 데이터 없을 때 빈 상태 */
        <Card className="border-border/50">
          <CardContent className="py-16 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary dark:bg-[#2C2C2E]">
                <ListTodo className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-[15px] font-medium text-foreground">
                  {lang === 'ko' ? '아직 데이터가 없습니다' : 'No data yet'}
                </p>
                <p className="text-[13px] text-muted-foreground mt-1">
                  {lang === 'ko' ? '할 일과 습관을 추가하면 분석 리포트가 생성됩니다' : 'Add tasks and habits to see your analytics'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* 데이터가 있을 때 차트 표시 */
        <Tabs defaultValue="weekly">
          <TabsList className="rounded-xl bg-secondary/60 p-1">
            <TabsTrigger value="weekly" className="rounded-lg text-[13px] font-medium">
              {t('analytics.weekly')}
            </TabsTrigger>
            <TabsTrigger value="overview" className="rounded-lg text-[13px] font-medium">
              {lang === 'ko' ? '전체 현황' : 'Overview'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="weekly" className="space-y-4 mt-4">
            {/* 주간 완료 추이 */}
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-[15px] font-semibold">{t('analytics.completionRate')}</CardTitle>
              </CardHeader>
              <CardContent>
                {weeklyData.some((d) => d.completed > 0 || d.total > 0) ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={weeklyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                        <RechartsTooltip />
                        <Bar dataKey="completed" fill="#007AFF" radius={[6, 6, 0, 0]} name={lang === 'ko' ? '완료' : 'Completed'} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center">
                    <p className="text-[13px] text-muted-foreground">
                      {lang === 'ko' ? '이번 주 완료된 할 일이 없습니다' : 'No completed tasks this week'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 카테고리 분배 */}
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-[15px] font-semibold">{t('analytics.categoryDistribution')}</CardTitle>
              </CardHeader>
              <CardContent>
                {categoryData.length > 0 ? (
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
                          label={({ name, percent }: { name?: string; percent?: number }) =>
                            `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`
                          }
                        >
                          {categoryData.map((_, index) => (
                            <Cell key={index} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-48 flex items-center justify-center">
                    <p className="text-[13px] text-muted-foreground">
                      {lang === 'ko' ? '완료된 할 일이 없어 카테고리 분석을 할 수 없습니다' : 'No completed tasks to analyze'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="overview" className="space-y-4 mt-4">
            {/* 전체 현황 카드 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Card className="border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-[15px] font-semibold flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#34C759]" />
                    {lang === 'ko' ? '할 일 현황' : 'Task Status'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] text-muted-foreground">{lang === 'ko' ? '전체' : 'Total'}</span>
                    <span className="text-[15px] font-semibold">{tasks.length}{lang === 'ko' ? '개' : ''}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] text-muted-foreground">{lang === 'ko' ? '완료' : 'Completed'}</span>
                    <span className="text-[15px] font-semibold text-[#34C759]">{completedTasks.length}{lang === 'ko' ? '개' : ''}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] text-muted-foreground">{lang === 'ko' ? '진행 중' : 'In Progress'}</span>
                    <span className="text-[15px] font-semibold text-[#007AFF]">{pendingTasks.length}{lang === 'ko' ? '개' : ''}</span>
                  </div>
                  {tasks.length > 0 && (
                    <div className="pt-2 border-t border-border/50">
                      <div className="flex items-center justify-between">
                        <span className="text-[13px] text-muted-foreground">{lang === 'ko' ? '완료율' : 'Rate'}</span>
                        <span className="text-[15px] font-bold text-[#007AFF]">
                          {Math.round((completedTasks.length / tasks.length) * 100)}%
                        </span>
                      </div>
                      <div className="mt-2 h-2 rounded-full bg-secondary overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#007AFF] transition-all duration-500"
                          style={{ width: `${(completedTasks.length / tasks.length) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-[15px] font-semibold flex items-center gap-2">
                    <Flame className="h-4 w-4 text-[#FF9500]" />
                    {lang === 'ko' ? '습관 현황' : 'Habit Status'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] text-muted-foreground">{lang === 'ko' ? '등록된 습관' : 'Active Habits'}</span>
                    <span className="text-[15px] font-semibold">{habits.length}{lang === 'ko' ? '개' : ''}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] text-muted-foreground">{lang === 'ko' ? '오늘 달성률' : "Today's Rate"}</span>
                    <span className="text-[15px] font-semibold text-[#34C759]">{habitRate}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] text-muted-foreground">{lang === 'ko' ? '최장 연속' : 'Longest Streak'}</span>
                    <span className="text-[15px] font-semibold text-[#FF9500]">{user?.stats?.longestStreak || 0}{lang === 'ko' ? '일' : 'd'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] text-muted-foreground">{lang === 'ko' ? '총 체크' : 'Total Checks'}</span>
                    <span className="text-[15px] font-semibold">{user?.stats?.totalHabitChecks || 0}{lang === 'ko' ? '회' : ''}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 레벨 & 성장 정보 */}
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-[15px] font-semibold flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-[#AF52DE]" />
                  {lang === 'ko' ? '성장 기록' : 'Growth'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] text-muted-foreground">{lang === 'ko' ? '현재 레벨' : 'Level'}</span>
                  <span className="text-[15px] font-semibold">Lv.{user?.level || 1}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[13px] text-muted-foreground">{lang === 'ko' ? '총 경험치' : 'Total XP'}</span>
                  <span className="text-[15px] font-semibold text-[#AF52DE]">{user?.totalXp || 0} XP</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[13px] text-muted-foreground">{lang === 'ko' ? '획득 배지' : 'Badges'}</span>
                  <span className="text-[15px] font-semibold">{user?.badges?.length || 0}{lang === 'ko' ? '개' : ''}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[13px] text-muted-foreground">{lang === 'ko' ? '칭호' : 'Title'}</span>
                  <span className="text-[13px] font-medium text-[#007AFF]">{user?.title || (lang === 'ko' ? '초보 모험가' : 'Beginner')}</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

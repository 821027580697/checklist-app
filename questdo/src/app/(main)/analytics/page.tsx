// 생산성 리포트 페이지 — 실 데이터 기반 고도화 시각화
'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useAuthStore } from '@/stores/authStore';
import { useTaskStore } from '@/stores/taskStore';
import { useHabitStore } from '@/stores/habitStore';
import { useTranslation } from '@/hooks/useTranslation';
import { CATEGORY_LABELS, PRIORITY_LABELS } from '@/types/task';
import { BarChart3, TrendingUp, Target, Flame, CheckCircle2, ListTodo, Repeat, Calendar, Clock } from 'lucide-react';
import { format, subDays, startOfWeek, isWithinInterval } from 'date-fns';

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
const LineChart = dynamic(() => import('recharts').then((mod) => mod.LineChart), { ssr: false });
const Line = dynamic(() => import('recharts').then((mod) => mod.Line), { ssr: false });
const AreaChart = dynamic(() => import('recharts').then((mod) => mod.AreaChart), { ssr: false });
const Area = dynamic(() => import('recharts').then((mod) => mod.Area), { ssr: false });

const COLORS = ['#007AFF', '#34C759', '#FF9500', '#FF3B30', '#5856D6', '#AF52DE', '#00C7BE', '#8E8E93'];
const PRIORITY_CHART_COLORS: Record<string, string> = {
  urgent: '#FF3B30',
  high: '#FF9500',
  medium: '#007AFF',
  low: '#8E8E93',
};

export default function AnalyticsPage() {
  const { t, language } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const tasks = useTaskStore((state) => state.tasks);
  const habits = useHabitStore((state) => state.habits);
  const lang = language as 'ko' | 'en';

  const completedTasks = useMemo(() => tasks.filter((t) => t.status === 'completed'), [tasks]);
  const pendingTasks = useMemo(() => tasks.filter((t) => t.status !== 'completed'), [tasks]);

  // 최근 7일 완료 데이터
  const weeklyData = useMemo(() => {
    const days: { name: string; date: string; completed: number; total: number; habits: number }[] = [];
    const dayNames = lang === 'ko'
      ? ['일', '월', '화', '수', '목', '금', '토']
      : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      const dateStr = format(date, 'yyyy-MM-dd');

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

      // 습관 체크 수
      const habitChecks = habits.reduce((sum, h) => {
        return sum + ((h.completedDates || []).includes(dateStr) ? 1 : 0);
      }, 0);

      days.push({
        name: dayNames[date.getDay()],
        date: format(date, 'M/d'),
        completed: dayCompleted,
        total: Math.max(dayTotal, dayCompleted),
        habits: habitChecks,
      });
    }

    return days;
  }, [tasks, habits, lang]);

  // 최근 30일 추이
  const monthlyTrend = useMemo(() => {
    const data: { date: string; tasks: number; habits: number }[] = [];

    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      const dateStr = format(date, 'yyyy-MM-dd');

      const taskCount = tasks.filter((task) => {
        if (task.status !== 'completed' || !task.completedAt) return false;
        try {
          const completedDate = task.completedAt.toDate();
          return completedDate >= date && completedDate < nextDate;
        } catch {
          return false;
        }
      }).length;

      const habitCount = habits.reduce((sum, h) => {
        return sum + ((h.completedDates || []).includes(dateStr) ? 1 : 0);
      }, 0);

      data.push({
        date: format(date, 'M/d'),
        tasks: taskCount,
        habits: habitCount,
      });
    }

    return data;
  }, [tasks, habits]);

  // 카테고리 분배 (전체)
  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    tasks.forEach((task) => {
      const label = CATEGORY_LABELS[task.category]?.[lang] || task.category;
      counts[label] = (counts[label] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [tasks, lang]);

  // 우선순위 분배
  const priorityData = useMemo(() => {
    const counts: Record<string, number> = {};
    tasks.forEach((task) => {
      const label = PRIORITY_LABELS[task.priority]?.[lang] || task.priority;
      counts[label] = (counts[label] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [tasks, lang]);

  // 습관 달성률
  const habitRate = useMemo(() => {
    if (habits.length === 0) return 0;
    const today = format(new Date(), 'yyyy-MM-dd');
    const todayChecked = habits.filter((h) => (h.completedDates || []).includes(today)).length;
    return Math.round((todayChecked / habits.length) * 100);
  }, [habits]);

  // 이번 주 요약
  const weeklySummary = useMemo(() => {
    const weekStart = startOfWeek(new Date());
    const thisWeekCompleted = tasks.filter((task) => {
      if (task.status !== 'completed' || !task.completedAt) return false;
      try {
        const completedDate = task.completedAt.toDate();
        return completedDate >= weekStart;
      } catch {
        return false;
      }
    }).length;

    const totalHabitChecks = user?.stats?.totalHabitChecks || habits.reduce((sum, h) => sum + (h.completedDates?.length || 0), 0);

    // XP 계산: Firestore의 totalXp 사용 (실시간 정확한 값)
    const totalXp = user?.totalXp || 0;

    return {
      tasksCompleted: thisWeekCompleted,
      totalCompleted: user?.stats?.totalCompleted || completedTasks.length,
      habitRate,
      totalHabitChecks,
      xpEarned: totalXp,
      streakDays: user?.stats?.currentStreak || 0,
    };
  }, [tasks, completedTasks, habits, habitRate, user]);

  // 습관별 완료율 데이터
  const habitCompletionData = useMemo(() => {
    return habits
      .filter((h) => h.isActive)
      .map((h) => ({
        name: `${h.icon} ${h.title}`,
        checks: h.completedDates?.length || 0,
        color: h.color || '#34C759',
      }))
      .sort((a, b) => b.checks - a.checks)
      .slice(0, 8);
  }, [habits]);

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

      {/* 핵심 지표 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: Target, label: lang === 'ko' ? '이번 주 완료' : 'This Week', value: weeklySummary.tasksCompleted, suffix: lang === 'ko' ? '개' : '', color: 'text-[#007AFF]', bg: 'bg-[#007AFF]/5' },
          { icon: TrendingUp, label: lang === 'ko' ? '습관 달성률' : 'Habit Rate', value: weeklySummary.habitRate, suffix: '%', color: 'text-[#34C759]', bg: 'bg-[#34C759]/5' },
          { icon: BarChart3, label: lang === 'ko' ? '총 경험치' : 'Total XP', value: weeklySummary.xpEarned, suffix: ' XP', color: 'text-[#AF52DE]', bg: 'bg-[#AF52DE]/5' },
          { icon: Flame, label: lang === 'ko' ? '연속 달성' : 'Streak', value: weeklySummary.streakDays, suffix: lang === 'ko' ? '일' : 'd', color: 'text-[#FF9500]', bg: 'bg-[#FF9500]/5' },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
          >
            <Card className="border-border/50">
              <CardContent className="p-4">
                <div className={`inline-flex p-2 rounded-xl ${stat.bg} mb-2`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
                <p className="text-[22px] font-bold tracking-tight">{stat.value}{stat.suffix}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{stat.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {!hasData ? (
        <Card className="border-border/50">
          <CardContent className="py-16 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary">
                <ListTodo className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-[15px] font-medium">{lang === 'ko' ? '아직 데이터가 없습니다' : 'No data yet'}</p>
                <p className="text-[13px] text-muted-foreground mt-1">
                  {lang === 'ko' ? '할 일과 습관을 추가하면 분석 리포트가 생성됩니다' : 'Add tasks and habits to see your analytics'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="weekly">
          <TabsList className="rounded-xl bg-secondary/60 p-1">
            <TabsTrigger value="weekly" className="rounded-lg text-[13px] font-medium">
              {lang === 'ko' ? '주간' : 'Weekly'}
            </TabsTrigger>
            <TabsTrigger value="monthly" className="rounded-lg text-[13px] font-medium">
              {lang === 'ko' ? '월간' : 'Monthly'}
            </TabsTrigger>
            <TabsTrigger value="overview" className="rounded-lg text-[13px] font-medium">
              {lang === 'ko' ? '전체 현황' : 'Overview'}
            </TabsTrigger>
          </TabsList>

          {/* 주간 탭 */}
          <TabsContent value="weekly" className="space-y-4 mt-4">
            {/* 주간 할 일 + 습관 완료 추이 */}
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-[15px] font-semibold flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-[#007AFF]" />
                  {lang === 'ko' ? '주간 활동' : 'Weekly Activity'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {weeklyData.some((d) => d.completed > 0 || d.habits > 0) ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={weeklyData} barGap={2}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                        <RechartsTooltip
                          contentStyle={{ borderRadius: 12, fontSize: 12, border: '1px solid var(--border)' }}
                        />
                        <Bar dataKey="completed" fill="#007AFF" radius={[4, 4, 0, 0]} name={lang === 'ko' ? '할 일 완료' : 'Tasks'} />
                        <Bar dataKey="habits" fill="#34C759" radius={[4, 4, 0, 0]} name={lang === 'ko' ? '습관 체크' : 'Habits'} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-48 flex items-center justify-center">
                    <p className="text-[13px] text-muted-foreground">
                      {lang === 'ko' ? '이번 주 활동 기록이 없습니다' : 'No activity this week'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 카테고리 분배 */}
            {categoryData.length > 0 && (
              <Card className="border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-[15px] font-semibold">{t('analytics.categoryDistribution')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="h-52">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={categoryData}
                            cx="50%"
                            cy="50%"
                            innerRadius={45}
                            outerRadius={75}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {categoryData.map((_, index) => (
                              <Cell key={index} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <RechartsTooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-2 flex flex-col justify-center">
                      {categoryData.map((item, index) => (
                        <div key={item.name} className="flex items-center gap-2">
                          <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                          <span className="text-[12px] flex-1 truncate">{item.name}</span>
                          <span className="text-[12px] font-semibold">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* 월간 탭 */}
          <TabsContent value="monthly" className="space-y-4 mt-4">
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-[15px] font-semibold flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-[#AF52DE]" />
                  {lang === 'ko' ? '30일 활동 추이' : '30-Day Activity Trend'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {monthlyTrend.some((d) => d.tasks > 0 || d.habits > 0) ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={monthlyTrend}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 10 }}
                          interval={4}
                        />
                        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                        <RechartsTooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                        <Area type="monotone" dataKey="tasks" stroke="#007AFF" fill="#007AFF" fillOpacity={0.1} name={lang === 'ko' ? '할 일' : 'Tasks'} />
                        <Area type="monotone" dataKey="habits" stroke="#34C759" fill="#34C759" fillOpacity={0.1} name={lang === 'ko' ? '습관' : 'Habits'} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-48 flex items-center justify-center">
                    <p className="text-[13px] text-muted-foreground">
                      {lang === 'ko' ? '30일간 활동 기록이 없습니다' : 'No activity in 30 days'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 습관별 체크 횟수 */}
            {habitCompletionData.length > 0 && (
              <Card className="border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-[15px] font-semibold flex items-center gap-2">
                    <Repeat className="h-4 w-4 text-[#34C759]" />
                    {lang === 'ko' ? '습관별 체크 횟수' : 'Habit Check Counts'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {habitCompletionData.map((habit) => (
                      <div key={habit.name} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[12px] font-medium truncate flex-1">{habit.name}</span>
                          <span className="text-[12px] font-semibold ml-2">{habit.checks}{lang === 'ko' ? '회' : ''}</span>
                        </div>
                        <div className="h-2 rounded-full bg-secondary overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${Math.min(100, (habit.checks / Math.max(...habitCompletionData.map((h) => h.checks), 1)) * 100)}%`,
                              backgroundColor: habit.color,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* 전체 현황 탭 */}
          <TabsContent value="overview" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* 할 일 현황 */}
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
                    <span className="text-[13px] text-muted-foreground">{lang === 'ko' ? '진행 중' : 'Pending'}</span>
                    <span className="text-[15px] font-semibold text-[#007AFF]">{pendingTasks.length}{lang === 'ko' ? '개' : ''}</span>
                  </div>
                  {tasks.length > 0 && (
                    <div className="pt-2 border-t border-border/50">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[13px] text-muted-foreground">{lang === 'ko' ? '완료율' : 'Rate'}</span>
                        <span className="text-[15px] font-bold text-[#007AFF]">
                          {Math.round((completedTasks.length / tasks.length) * 100)}%
                        </span>
                      </div>
                      <Progress value={(completedTasks.length / tasks.length) * 100} className="h-2" />
                    </div>
                  )}

                  {/* 우선순위 분배 */}
                  {priorityData.length > 0 && (
                    <div className="pt-2 border-t border-border/50">
                      <p className="text-[12px] font-medium mb-2">{lang === 'ko' ? '우선순위 분배' : 'Priority Distribution'}</p>
                      <div className="space-y-1.5">
                        {priorityData.map((item, index) => (
                          <div key={item.name} className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: Object.values(PRIORITY_CHART_COLORS)[index] || '#8E8E93' }} />
                            <span className="text-[11px] flex-1">{item.name}</span>
                            <span className="text-[11px] font-medium">{item.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* 습관 현황 */}
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
                    <span className="text-[13px] text-muted-foreground">{lang === 'ko' ? '총 체크 횟수' : 'Total Checks'}</span>
                    <span className="text-[15px] font-semibold">{weeklySummary.totalHabitChecks}{lang === 'ko' ? '회' : ''}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] text-muted-foreground">{lang === 'ko' ? '현재 스트릭' : 'Current Streak'}</span>
                    <span className="text-[15px] font-semibold text-[#FF9500]">{user?.stats?.currentStreak || 0}{lang === 'ko' ? '일' : 'd'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] text-muted-foreground">{lang === 'ko' ? '최장 연속' : 'Longest Streak'}</span>
                    <span className="text-[15px] font-semibold text-[#FF9500]">{user?.stats?.longestStreak || 0}{lang === 'ko' ? '일' : 'd'}</span>
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
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 rounded-xl bg-secondary/50">
                    <p className="text-[18px] font-bold text-[#007AFF]">Lv.{user?.level || 1}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{lang === 'ko' ? '현재 레벨' : 'Level'}</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-secondary/50">
                    <p className="text-[18px] font-bold text-[#AF52DE]">{user?.totalXp || 0}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{lang === 'ko' ? '총 XP' : 'Total XP'}</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-secondary/50">
                    <p className="text-[18px] font-bold text-[#FF9500]">{user?.badges?.length || 0}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{lang === 'ko' ? '배지' : 'Badges'}</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-secondary/50">
                    <p className="text-[14px] font-bold text-[#34C759] truncate">{user?.title || (lang === 'ko' ? '초보 모험가' : 'Beginner')}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{lang === 'ko' ? '칭호' : 'Title'}</p>
                  </div>
                </div>

                {/* XP 상세 내역 */}
                <div className="mt-4 pt-3 border-t border-border/30 space-y-2">
                  <p className="text-[12px] font-medium mb-2">{lang === 'ko' ? 'XP 누적 내역' : 'XP Breakdown'}</p>
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <CheckCircle2 className="h-3 w-3 text-[#34C759]" />
                      {lang === 'ko' ? '할 일 완료' : 'Task Completions'}
                    </span>
                    <span className="font-medium text-[#34C759]">
                      +{(user?.stats?.totalCompleted || 0) * 10} XP
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Repeat className="h-3 w-3 text-[#007AFF]" />
                      {lang === 'ko' ? '습관 체크' : 'Habit Checks'}
                    </span>
                    <span className="font-medium text-[#007AFF]">
                      +{(user?.stats?.totalHabitChecks || 0) * 5} XP
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[12px] pt-1 border-t border-border/20">
                    <span className="font-medium">{lang === 'ko' ? '현재 누적 XP' : 'Current Total XP'}</span>
                    <span className="font-bold text-[#AF52DE]">{user?.totalXp || 0} XP</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

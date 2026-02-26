// 홈 대시보드 — Apple 스타일
'use client';

import { motion } from 'framer-motion';
import { LevelProgress } from '@/components/dashboard/LevelProgress';
import { StreakCounter } from '@/components/dashboard/StreakCounter';
import { TodayTasks } from '@/components/dashboard/TodayTasks';
import { HabitCheck } from '@/components/dashboard/HabitCheck';
import { QuickAddTask } from '@/components/dashboard/QuickAddTask';
import { useTasks } from '@/hooks/useTasks';
import { useHabits } from '@/hooks/useHabits';
import { useAuthStore } from '@/stores/authStore';
import { useTranslation } from '@/hooks/useTranslation';
import { Timestamp } from 'firebase/firestore';

export default function DashboardPage() {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const { createTask, toggleComplete } = useTasks();
  const { toggleTodayCheck } = useHabits();

  const handleQuickAdd = (title: string) => {
    createTask({
      title,
      description: '',
      category: 'personal',
      priority: 'medium',
      status: 'todo',
      dueDate: Timestamp.fromDate(new Date()),
      dueTime: null,
      reminder: { enabled: false, type: 'at_time' },
      isRecurring: false,
      recurringPattern: null,
      subtasks: [],
    });
  };

  return (
    <div className="space-y-5">
      {/* 인사말 */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <h1 className="text-[28px] font-bold tracking-tight">
          {t('dashboard.greeting', { name: user?.nickname || '' })}
        </h1>
      </motion.div>

      {/* 레벨 & 스트릭 */}
      <div className="grid gap-3 md:grid-cols-2">
        <LevelProgress />
        <StreakCounter />
      </div>

      {/* 빠른 할 일 추가 */}
      <QuickAddTask onAdd={handleQuickAdd} />

      {/* 오늘의 할 일 & 습관 */}
      <div className="grid gap-3 md:grid-cols-2">
        <TodayTasks onToggleComplete={toggleComplete} />
        <HabitCheck onToggleCheck={toggleTodayCheck} />
      </div>
    </div>
  );
}

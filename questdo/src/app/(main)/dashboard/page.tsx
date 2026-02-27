// 홈 대시보드 — 할 일+습관 전체 표시, Apple 스타일
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { LevelProgress } from '@/components/dashboard/LevelProgress';
import { StreakCounter } from '@/components/dashboard/StreakCounter';
import { TodayTasks } from '@/components/dashboard/TodayTasks';
import { HabitCheck } from '@/components/dashboard/HabitCheck';
import { QuickAddTask } from '@/components/dashboard/QuickAddTask';
import { TaskForm } from '@/components/tasks/TaskForm';
import { HabitForm } from '@/components/habits/HabitForm';
import { useTasks } from '@/hooks/useTasks';
import { useHabits } from '@/hooks/useHabits';
import { useAuthStore } from '@/stores/authStore';
import { useTranslation } from '@/hooks/useTranslation';
import { Task, TaskCategory, TaskPriority } from '@/types/task';
import { HabitFrequencyType } from '@/types/habit';
import { Timestamp } from 'firebase/firestore';
import { Plus, CheckSquare, Repeat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function DashboardPage() {
  const { t, language } = useTranslation();
  const lang = language as 'ko' | 'en';
  const user = useAuthStore((state) => state.user);
  const { createTask, toggleComplete, editTask, deleteTask } = useTasks();
  const { toggleTodayCheck, createHabit } = useHabits();

  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showHabitForm, setShowHabitForm] = useState(false);

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

  const handleEditSubmit = (data: {
    title: string;
    description: string;
    category: TaskCategory;
    priority: TaskPriority;
    dueDate: string;
    dueTime: string;
    isRecurring: boolean;
    subtasks: { id: string; title: string; isCompleted: boolean }[];
  }) => {
    if (!editingTask) return;
    editTask(editingTask.id, {
      title: data.title,
      description: data.description,
      category: data.category,
      priority: data.priority,
      dueDate: data.dueDate ? Timestamp.fromDate(new Date(data.dueDate)) : null,
      dueTime: data.dueTime || null,
      isRecurring: data.isRecurring,
      subtasks: data.subtasks,
    });
    setEditingTask(null);
  };

  const handleCreateHabit = (data: {
    title: string;
    description: string;
    category: TaskCategory;
    icon: string;
    color: string;
    frequencyType: HabitFrequencyType;
    daysOfWeek: number[];
    reminderTime: string;
  }) => {
    createHabit({
      title: data.title,
      description: data.description,
      category: data.category,
      icon: data.icon,
      color: data.color,
      frequency: {
        type: data.frequencyType,
        daysOfWeek: data.daysOfWeek,
        timesPerWeek: data.frequencyType === 'weekly' ? data.daysOfWeek.length : 7,
      },
      reminderTime: data.reminderTime || null,
      isActive: true,
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

      {/* 오늘의 할 일 — 전체 표시 */}
      <div>
        <TodayTasks
          onToggleComplete={toggleComplete}
          onEdit={(task) => setEditingTask(task)}
          onDelete={(taskId) => deleteTask(taskId)}
        />
      </div>

      {/* 오늘의 습관 — 전체 표시 */}
      <div>
        <HabitCheck
          onToggleCheck={toggleTodayCheck}
          onAddHabit={() => setShowHabitForm(true)}
        />
      </div>

      {/* 전체 보기 바로가기 */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="flex gap-3"
      >
        <Link href="/tasks" className="flex-1">
          <div className="apple-card p-4 flex items-center gap-3 hover:bg-secondary/30 transition-colors cursor-pointer group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <CheckSquare className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-semibold tracking-tight group-hover:text-primary transition-colors">
                {lang === 'ko' ? '전체 할 일 관리' : 'Manage All Tasks'}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {lang === 'ko' ? '필터, 정렬, 편집' : 'Filter, sort, edit'}
              </p>
            </div>
          </div>
        </Link>
        <Link href="/tasks?tab=habits" className="flex-1">
          <div className="apple-card p-4 flex items-center gap-3 hover:bg-secondary/30 transition-colors cursor-pointer group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#34C759]/10 text-[#34C759]">
              <Repeat className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-semibold tracking-tight group-hover:text-[#34C759] transition-colors">
                {lang === 'ko' ? '전체 습관 관리' : 'Manage All Habits'}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {lang === 'ko' ? '스트릭, 진행률' : 'Streaks, progress'}
              </p>
            </div>
          </div>
        </Link>
      </motion.div>

      {/* 할 일 편집 모달 */}
      {editingTask && (
        <TaskForm
          open={!!editingTask}
          onClose={() => setEditingTask(null)}
          onSubmit={handleEditSubmit}
          initialData={{
            title: editingTask.title,
            description: editingTask.description,
            category: editingTask.category,
            priority: editingTask.priority,
            dueDate: editingTask.dueDate
              ? editingTask.dueDate.toDate().toISOString().split('T')[0]
              : '',
            dueTime: editingTask.dueTime || '',
            isRecurring: editingTask.isRecurring,
            subtasks: editingTask.subtasks,
          }}
          isEdit
        />
      )}

      {/* 습관 추가 모달 */}
      <HabitForm
        open={showHabitForm}
        onClose={() => setShowHabitForm(false)}
        onSubmit={handleCreateHabit}
      />
    </div>
  );
}

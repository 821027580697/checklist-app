// 홈 대시보드 — Apple 스타일 (완전 CRUD 지원)
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { LevelProgress } from '@/components/dashboard/LevelProgress';
import { StreakCounter } from '@/components/dashboard/StreakCounter';
import { TodayTasks } from '@/components/dashboard/TodayTasks';
import { HabitCheck } from '@/components/dashboard/HabitCheck';
import { QuickAddTask } from '@/components/dashboard/QuickAddTask';
import { TaskForm } from '@/components/tasks/TaskForm';
import { useTasks } from '@/hooks/useTasks';
import { useHabits } from '@/hooks/useHabits';
import { useAuthStore } from '@/stores/authStore';
import { useTranslation } from '@/hooks/useTranslation';
import { Task, TaskCategory, TaskPriority } from '@/types/task';
import { Timestamp } from 'firebase/firestore';

export default function DashboardPage() {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const { createTask, toggleComplete, editTask, deleteTask } = useTasks();
  const { toggleTodayCheck } = useHabits();

  const [editingTask, setEditingTask] = useState<Task | null>(null);

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
        <TodayTasks
          onToggleComplete={toggleComplete}
          onEdit={(task) => setEditingTask(task)}
          onDelete={(taskId) => deleteTask(taskId)}
        />
        <HabitCheck onToggleCheck={toggleTodayCheck} />
      </div>

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
    </div>
  );
}

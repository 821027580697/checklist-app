// 할 일 + 습관 통합 페이지 — Apple 스타일 탭 UI
'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { TaskList } from '@/components/tasks/TaskList';
import { TaskFilter } from '@/components/tasks/TaskFilter';
import { TaskForm } from '@/components/tasks/TaskForm';
import { HabitCard } from '@/components/habits/HabitCard';
import { HabitForm } from '@/components/habits/HabitForm';
import { StreakCalendar } from '@/components/habits/StreakCalendar';
import { useTasks } from '@/hooks/useTasks';
import { useHabits } from '@/hooks/useHabits';
import { useTaskStore } from '@/stores/taskStore';
import { useHabitStore } from '@/stores/habitStore';
import { useTranslation } from '@/hooks/useTranslation';
import { Task, TaskCategory, TaskPriority } from '@/types/task';
import { HabitFrequencyType, Habit } from '@/types/habit';
import { Timestamp } from 'firebase/firestore';
import { Plus, CheckSquare, Repeat, Info, Hand } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

type TabType = 'tasks' | 'habits';

export default function TasksHabitsPage() {
  const { t, language } = useTranslation();
  const lang = language as 'ko' | 'en';

  // Tasks
  const { createTask, toggleComplete, editTask, deleteTask } = useTasks();
  const getFilteredTasks = useTaskStore((state) => state.getFilteredTasks);
  const filteredTasks = getFilteredTasks();

  // Habits
  const { createHabit, toggleTodayCheck, deleteHabit } = useHabits();
  const habits = useHabitStore((state) => state.habits);
  const getActiveHabits = useHabitStore((state) => state.getActiveHabits);
  const activeHabits = getActiveHabits();

  // URL query params
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');

  // State
  const [activeTab, setActiveTab] = useState<TabType>(tabParam === 'habits' ? 'habits' : 'tasks');

  // URL 파라미터 변경 시 탭 동기화
  useEffect(() => {
    if (tabParam === 'habits') {
      setActiveTab('habits');
    }
  }, [tabParam]);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showHabitForm, setShowHabitForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);
  const [deletingHabit, setDeletingHabit] = useState<Habit | null>(null);
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);

  const selectedHabit = selectedHabitId
    ? habits.find((h) => h.id === selectedHabitId)
    : activeHabits[0];

  // 오늘 습관 진행률
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todayChecked = activeHabits.filter((h) => (h.completedDates || []).includes(todayStr)).length;
  const todayTotal = activeHabits.length;
  const todayProgress = todayTotal > 0 ? Math.round((todayChecked / todayTotal) * 100) : 0;

  // Handlers — Tasks
  const handleCreateTask = (data: {
    title: string;
    description: string;
    category: TaskCategory;
    priority: TaskPriority;
    dueDate: string;
    dueTime: string;
    isRecurring: boolean;
    subtasks: { id: string; title: string; isCompleted: boolean }[];
  }) => {
    createTask({
      title: data.title,
      description: data.description,
      category: data.category,
      priority: data.priority,
      status: 'todo',
      dueDate: data.dueDate ? Timestamp.fromDate(new Date(data.dueDate)) : null,
      dueTime: data.dueTime || null,
      reminder: { enabled: false, type: 'at_time' },
      isRecurring: data.isRecurring,
      recurringPattern: null,
      subtasks: data.subtasks,
    });
  };

  const handleEditTask = (data: {
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

  // Handlers — Habits
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

  const handleDeleteHabit = () => {
    if (deletingHabit) {
      deleteHabit(deletingHabit.id);
      if (selectedHabitId === deletingHabit.id) {
        setSelectedHabitId(null);
      }
      setDeletingHabit(null);
    }
  };

  const tabs: { key: TabType; label: string; icon: React.ReactNode; count: number }[] = [
    {
      key: 'tasks',
      label: lang === 'ko' ? '할 일' : 'Tasks',
      icon: <CheckSquare className="h-4 w-4" />,
      count: filteredTasks.length,
    },
    {
      key: 'habits',
      label: lang === 'ko' ? '습관' : 'Habits',
      icon: <Repeat className="h-4 w-4" />,
      count: activeHabits.length,
    },
  ];

  return (
    <div className="space-y-5">
      {/* 페이지 헤더 */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-[28px] font-bold tracking-tight">
            {lang === 'ko' ? '할 일 · 습관' : 'Tasks · Habits'}
          </h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            {activeTab === 'tasks'
              ? `${filteredTasks.length} ${lang === 'ko' ? '개 할 일' : 'tasks'}`
              : `${activeHabits.length} ${lang === 'ko' ? '개 습관' : 'habits'}`}
          </p>
        </div>
        <Button
          onClick={() => activeTab === 'tasks' ? setShowTaskForm(true) : setShowHabitForm(true)}
          className="h-9 rounded-full px-4 text-[13px] font-medium"
          size="sm"
        >
          <Plus className="mr-1 h-4 w-4" />
          {activeTab === 'tasks' ? t('tasks.add') : t('habits.add')}
        </Button>
      </motion.div>

      {/* 탭 전환 — Apple Segmented Control */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="relative flex rounded-xl bg-secondary/60 p-1"
      >
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'relative flex-1 flex items-center justify-center gap-2 rounded-lg py-2 text-[13px] font-medium transition-all duration-200',
              activeTab === tab.key
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground/70',
            )}
          >
            {activeTab === tab.key && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 rounded-lg bg-background shadow-sm"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              {tab.icon}
              {tab.label}
              <span className="inline-flex items-center justify-center h-5 min-w-5 px-1 rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
                {tab.count}
              </span>
            </span>
          </button>
        ))}
      </motion.div>

      {/* 탭 콘텐츠 */}
      <AnimatePresence mode="wait">
        {activeTab === 'tasks' ? (
          <motion.div
            key="tasks"
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 16 }}
            transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="space-y-4"
          >
            {/* 필터 */}
            <TaskFilter />

            {/* 할 일 목록 */}
            <div className="apple-card overflow-hidden">
              <div className="p-2">
                <TaskList
                  tasks={filteredTasks}
                  onToggleComplete={toggleComplete}
                  onEdit={(task) => setEditingTask(task)}
                  onDelete={(task) => setDeletingTask(task)}
                />
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="habits"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="space-y-4"
          >
            {/* 오늘의 진행률 */}
            {todayTotal > 0 && (
              <div className="apple-card p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-[13px] font-semibold">
                    {lang === 'ko' ? '오늘의 진행률' : "Today's Progress"}
                  </h4>
                  <span className="text-[13px] font-bold" style={{ color: todayProgress === 100 ? '#34C759' : '#007AFF' }}>
                    {todayProgress}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-secondary overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${todayProgress}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className="h-full rounded-full transition-colors"
                    style={{ backgroundColor: todayProgress === 100 ? '#34C759' : '#007AFF' }}
                  />
                </div>
                <p className="text-[11px] text-muted-foreground mt-1.5">
                  {todayChecked}/{todayTotal} {lang === 'ko' ? '완료' : 'completed'}
                  {todayProgress === 100 && (lang === 'ko' ? ' 🎉 오늘 모두 달성!' : ' 🎉 All done today!')}
                </p>
              </div>
            )}

            {/* 스트릭 캘린더 */}
            {selectedHabit && (
              <div className="apple-card overflow-hidden">
                <div className="px-5 pt-5 pb-2">
                  <h3 className="text-[14px] font-semibold flex items-center gap-2 tracking-tight">
                    <span>{selectedHabit.icon}</span>
                    {selectedHabit.title} — {t('habits.streakCalendar')}
                  </h3>
                </div>
                <div className="px-5 pb-5">
                  <StreakCalendar
                    completedDates={selectedHabit.completedDates || []}
                    color={selectedHabit.color}
                  />
                </div>
              </div>
            )}

            {/* 습관 목록 */}
            {activeHabits.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary">
                  <Repeat className="h-7 w-7 text-muted-foreground/40" />
                </div>
                <p className="text-[14px] font-medium text-muted-foreground">{t('habits.noHabits')}</p>
                <p className="text-[12px] text-muted-foreground/60 mt-1">{t('habits.addFirst')}</p>
                {/* 사용 안내 */}
                <div className="mt-6 rounded-xl bg-blue-50 dark:bg-blue-950/30 p-4 max-w-xs">
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="h-4 w-4 text-[#007AFF]" />
                    <span className="text-[12px] font-semibold text-[#007AFF]">
                      {lang === 'ko' ? '사용 방법' : 'How to use'}
                    </span>
                  </div>
                  <ol className="text-[11px] text-muted-foreground space-y-1 list-decimal list-inside">
                    <li>{lang === 'ko' ? '상단 "추가" 버튼으로 습관을 등록하세요' : 'Add a habit using the "Add" button'}</li>
                    <li>{lang === 'ko' ? '매일 아이콘을 탭하여 완료 체크하세요' : 'Tap the icon daily to mark complete'}</li>
                    <li>{lang === 'ko' ? '연속 달성으로 스트릭을 쌓아보세요!' : 'Build your streak with consecutive days!'}</li>
                  </ol>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {/* 사용 안내 인라인 */}
                <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/20">
                  <Hand className="h-3.5 w-3.5 text-[#007AFF] shrink-0" />
                  <p className="text-[11px] text-[#007AFF]">
                    {lang === 'ko'
                      ? '아이콘을 탭하면 오늘 완료로 체크됩니다'
                      : 'Tap the icon to mark as completed today'}
                  </p>
                </div>

                <div className="apple-card overflow-hidden p-2">
                  {activeHabits.map((habit) => (
                    <HabitCard
                      key={habit.id}
                      habit={habit}
                      onToggleCheck={toggleTodayCheck}
                      onDelete={(h) => setDeletingHabit(h)}
                      onClick={(h) => setSelectedHabitId(h.id)}
                    />
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 할 일 생성 모달 */}
      <TaskForm
        open={showTaskForm}
        onClose={() => setShowTaskForm(false)}
        onSubmit={handleCreateTask}
      />

      {/* 할 일 편집 모달 */}
      {editingTask && (
        <TaskForm
          open={!!editingTask}
          onClose={() => setEditingTask(null)}
          onSubmit={handleEditTask}
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

      {/* 할 일 삭제 확인 */}
      <Dialog open={!!deletingTask} onOpenChange={() => setDeletingTask(null)}>
        <DialogContent className="sm:max-w-[340px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-[17px] text-center">{t('tasks.deleteConfirm')}</DialogTitle>
            <DialogDescription className="text-[13px] text-center">
              &quot;{deletingTask?.title}&quot;
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-2">
            <Button
              variant="outline"
              className="flex-1 h-10 rounded-xl text-[14px]"
              onClick={() => setDeletingTask(null)}
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="destructive"
              className="flex-1 h-10 rounded-xl text-[14px]"
              onClick={() => {
                if (deletingTask) {
                  deleteTask(deletingTask.id);
                  setDeletingTask(null);
                }
              }}
            >
              {t('common.delete')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 습관 생성 모달 */}
      <HabitForm
        open={showHabitForm}
        onClose={() => setShowHabitForm(false)}
        onSubmit={handleCreateHabit}
      />

      {/* 습관 삭제 확인 모달 */}
      <Dialog open={!!deletingHabit} onOpenChange={() => setDeletingHabit(null)}>
        <DialogContent className="sm:max-w-[340px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-[17px] text-center">
              {lang === 'ko' ? '습관 삭제' : 'Delete Habit'}
            </DialogTitle>
            <DialogDescription className="text-[13px] text-center">
              {deletingHabit?.icon} &quot;{deletingHabit?.title}&quot;
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-2">
            <Button variant="outline" className="flex-1 h-10 rounded-xl text-[14px]" onClick={() => setDeletingHabit(null)}>
              {t('common.cancel')}
            </Button>
            <Button variant="destructive" className="flex-1 h-10 rounded-xl text-[14px]" onClick={handleDeleteHabit}>
              {t('common.delete')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 플로팅 추가 버튼 (모바일) */}
      <Button
        onClick={() => activeTab === 'tasks' ? setShowTaskForm(true) : setShowHabitForm(true)}
        className="fixed bottom-24 right-5 h-[52px] w-[52px] rounded-full shadow-lg shadow-primary/30 md:hidden z-30"
        size="icon"
      >
        <Plus className="h-5 w-5" />
      </Button>
    </div>
  );
}

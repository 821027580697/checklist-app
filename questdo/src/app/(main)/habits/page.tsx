// 습관 트래커 — Apple 스타일 + 명확한 UX
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { HabitCard } from '@/components/habits/HabitCard';
import { HabitForm } from '@/components/habits/HabitForm';
import { StreakCalendar } from '@/components/habits/StreakCalendar';
import { useHabits } from '@/hooks/useHabits';
import { useHabitStore } from '@/stores/habitStore';
import { useTranslation } from '@/hooks/useTranslation';
import { HabitFrequencyType, Habit } from '@/types/habit';
import { TaskCategory } from '@/types/task';
import { Plus, Repeat, Info, Hand } from 'lucide-react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

export default function HabitsPage() {
  const { t, language } = useTranslation();
  const lang = language as 'ko' | 'en';
  const { createHabit, toggleTodayCheck, deleteHabit } = useHabits();
  const habits = useHabitStore((state) => state.habits);
  const getActiveHabits = useHabitStore((state) => state.getActiveHabits);
  const activeHabits = getActiveHabits();

  const [showForm, setShowForm] = useState(false);
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);
  const [deletingHabit, setDeletingHabit] = useState<Habit | null>(null);

  const selectedHabit = selectedHabitId
    ? habits.find((h) => h.id === selectedHabitId)
    : activeHabits[0];

  // 오늘 진행률
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todayChecked = activeHabits.filter((h) => (h.completedDates || []).includes(todayStr)).length;
  const todayTotal = activeHabits.length;
  const todayProgress = todayTotal > 0 ? Math.round((todayChecked / todayTotal) * 100) : 0;

  const handleCreate = (data: {
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

  const handleDeleteConfirm = () => {
    if (deletingHabit) {
      deleteHabit(deletingHabit.id);
      if (selectedHabitId === deletingHabit.id) {
        setSelectedHabitId(null);
      }
      setDeletingHabit(null);
    }
  };

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
          <h1 className="text-[28px] font-bold tracking-tight">{t('habits.title')}</h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            {activeHabits.length} {lang === 'ko' ? '개 등록됨' : 'habits active'}
          </p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          className="h-9 rounded-full px-4 text-[13px] font-medium"
          size="sm"
        >
          <Plus className="mr-1 h-4 w-4" />
          {t('habits.add')}
        </Button>
      </motion.div>

      {/* 오늘의 진행률 */}
      {todayTotal > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="apple-card p-4"
        >
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
        </motion.div>
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

      {/* 습관 생성 모달 */}
      <HabitForm
        open={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={handleCreate}
      />

      {/* 삭제 확인 모달 */}
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
            <Button variant="destructive" className="flex-1 h-10 rounded-xl text-[14px]" onClick={handleDeleteConfirm}>
              {t('common.delete')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 플로팅 추가 버튼 (모바일) */}
      <Button
        onClick={() => setShowForm(true)}
        className="fixed bottom-24 right-5 h-[52px] w-[52px] rounded-full shadow-lg shadow-primary/30 md:hidden z-30"
        size="icon"
      >
        <Plus className="h-5 w-5" />
      </Button>
    </div>
  );
}

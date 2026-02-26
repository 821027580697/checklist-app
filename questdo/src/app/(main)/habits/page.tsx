// 습관 트래커 — Apple 스타일
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
import { HabitFrequencyType } from '@/types/habit';
import { TaskCategory } from '@/types/task';
import { Plus, Repeat } from 'lucide-react';

export default function HabitsPage() {
  const { t } = useTranslation();
  const { createHabit, toggleTodayCheck } = useHabits();
  const habits = useHabitStore((state) => state.habits);
  const getActiveHabits = useHabitStore((state) => state.getActiveHabits);
  const activeHabits = getActiveHabits();

  const [showForm, setShowForm] = useState(false);
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);

  const selectedHabit = selectedHabitId
    ? habits.find((h) => h.id === selectedHabitId)
    : activeHabits[0];

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
            {activeHabits.length} {t('habits.title').toLowerCase()}
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
              completedDates={selectedHabit.completedDates}
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
        </div>
      ) : (
        <div className="apple-card overflow-hidden p-2">
          {activeHabits.map((habit) => (
            <HabitCard
              key={habit.id}
              habit={habit}
              onToggleCheck={toggleTodayCheck}
              onClick={(h) => setSelectedHabitId(h.id)}
            />
          ))}
        </div>
      )}

      {/* 습관 생성 모달 */}
      <HabitForm
        open={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={handleCreate}
      />

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

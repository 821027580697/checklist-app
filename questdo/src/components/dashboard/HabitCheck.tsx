// 오늘의 습관 체크 위젯 — Apple 스타일
'use client';

import { Button } from '@/components/ui/button';
import { HabitCard } from '@/components/habits/HabitCard';
import { useHabitStore } from '@/stores/habitStore';
import { useTranslation } from '@/hooks/useTranslation';
import { Habit } from '@/types/habit';
import { Repeat } from 'lucide-react';
import Link from 'next/link';

interface HabitCheckProps {
  onToggleCheck: (habit: Habit) => void;
}

export const HabitCheck = ({ onToggleCheck }: HabitCheckProps) => {
  const { t } = useTranslation();
  const getTodayHabits = useHabitStore((state) => state.getTodayHabits);
  const todayHabits = getTodayHabits();

  return (
    <div className="apple-card overflow-hidden">
      <div className="flex items-center justify-between px-5 pt-5 pb-2">
        <h3 className="text-[15px] font-semibold tracking-tight">{t('dashboard.habitCheck')}</h3>
        <Link href="/habits">
          <Button variant="ghost" size="sm" className="text-[12px] h-7 rounded-lg text-primary font-medium">
            {t('common.seeAll')}
          </Button>
        </Link>
      </div>
      <div className="px-5 pb-5">
        {todayHabits.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-center">
            <Repeat className="h-8 w-8 text-muted-foreground/40 mb-2" />
            <p className="text-[13px] text-muted-foreground">
              {t('habits.noHabits')}
            </p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {todayHabits.map((habit) => (
              <HabitCard
                key={habit.id}
                habit={habit}
                onToggleCheck={onToggleCheck}
                compact
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

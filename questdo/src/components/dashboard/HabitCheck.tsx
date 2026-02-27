// 오늘의 습관 체크 위젯 — Apple 스타일 + 명확한 UX
'use client';

import { Button } from '@/components/ui/button';
import { HabitCard } from '@/components/habits/HabitCard';
import { useHabitStore } from '@/stores/habitStore';
import { useTranslation } from '@/hooks/useTranslation';
import { Habit } from '@/types/habit';
import { Repeat, CheckCircle2, Hand } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

interface HabitCheckProps {
  onToggleCheck: (habit: Habit) => void;
}

export const HabitCheck = ({ onToggleCheck }: HabitCheckProps) => {
  const { t, language } = useTranslation();
  const lang = language as 'ko' | 'en';
  const getTodayHabits = useHabitStore((state) => state.getTodayHabits);
  const todayHabits = getTodayHabits();
  const isLoading = useHabitStore((state) => state.isLoading);

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const checkedCount = todayHabits.filter((h) => (h.completedDates || []).includes(todayStr)).length;
  const totalCount = todayHabits.length;
  const allChecked = totalCount > 0 && checkedCount === totalCount;

  return (
    <div className="apple-card overflow-hidden">
      <div className="flex items-center justify-between px-5 pt-5 pb-2">
        <div>
          <h3 className="text-[15px] font-semibold tracking-tight">{t('dashboard.habitCheck')}</h3>
          {totalCount > 0 && (
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {checkedCount}/{totalCount} {lang === 'ko' ? '완료' : 'checked'}
            </p>
          )}
        </div>
        <Link href="/habits">
          <Button variant="ghost" size="sm" className="text-[12px] h-7 rounded-lg text-primary font-medium">
            {t('common.seeAll')}
          </Button>
        </Link>
      </div>
      <div className="px-5 pb-5">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-[2px] border-primary/20 border-t-primary" />
          </div>
        ) : todayHabits.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-center">
            <Repeat className="h-8 w-8 text-muted-foreground/40 mb-2" />
            <p className="text-[13px] text-muted-foreground">
              {lang === 'ko' ? '오늘 체크할 습관이 없습니다' : 'No habits to check today'}
            </p>
            <Link href="/habits">
              <Button variant="link" size="sm" className="text-[12px] text-primary mt-1">
                {lang === 'ko' ? '습관 추가하기' : 'Add a habit'}
              </Button>
            </Link>
          </div>
        ) : allChecked ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center py-6 text-center"
          >
            <CheckCircle2 className="h-8 w-8 text-[#34C759] mb-2" />
            <p className="text-[13px] font-medium text-[#34C759]">
              {lang === 'ko' ? '오늘 습관 모두 완료!' : 'All habits done!'}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {lang === 'ko' ? `${totalCount}개 습관 달성 🎉` : `${totalCount} habits achieved 🎉`}
            </p>
          </motion.div>
        ) : (
          <div className="space-y-1">
            {/* 사용 안내 */}
            <div className="flex items-center gap-1.5 px-1 py-1 mb-1">
              <Hand className="h-3 w-3 text-primary/50 shrink-0" />
              <p className="text-[10px] text-muted-foreground">
                {lang === 'ko' ? '아이콘을 탭하여 체크하세요' : 'Tap icon to check'}
              </p>
            </div>
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

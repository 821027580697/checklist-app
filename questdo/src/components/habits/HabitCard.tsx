// 습관 카드 — Apple 스타일
'use client';

import { motion } from 'framer-motion';
import { Habit } from '@/types/habit';
import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Flame, Check } from 'lucide-react';

interface HabitCardProps {
  habit: Habit;
  onToggleCheck: (habit: Habit) => void;
  onClick?: (habit: Habit) => void;
  compact?: boolean;
}

export const HabitCard = ({
  habit,
  onToggleCheck,
  onClick,
  compact = false,
}: HabitCardProps) => {
  const { t } = useTranslation();
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const isCheckedToday = (habit.completedDates || []).includes(todayStr);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        'flex items-center gap-3 rounded-xl transition-all duration-200',
        compact ? 'p-2.5' : 'p-3.5 hover:bg-secondary/50 cursor-pointer',
      )}
      onClick={() => onClick?.(habit)}
    >
      {/* 체크 버튼 */}
      <motion.button
        whileTap={{ scale: 0.85 }}
        onClick={(e) => {
          e.stopPropagation();
          onToggleCheck(habit);
        }}
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base transition-all duration-300',
          isCheckedToday
            ? 'bg-[#34C759] text-white shadow-md shadow-[#34C759]/20'
            : 'bg-secondary',
        )}
      >
        {isCheckedToday ? (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
          >
            <Check className="h-4 w-4" strokeWidth={3} />
          </motion.div>
        ) : (
          <span className="text-sm">{habit.icon}</span>
        )}
      </motion.button>

      {/* 콘텐츠 */}
      <div className="flex-1 min-w-0">
        <h3 className={cn(
          'text-[14px] font-medium tracking-tight',
          isCheckedToday && 'text-muted-foreground',
        )}>
          {habit.title}
        </h3>
        {!compact && (
          <div className="flex items-center gap-2 mt-0.5">
            {habit.streak > 0 && (
              <span className="flex items-center gap-0.5 text-[11px] text-[#FF9500] font-medium">
                <Flame className="h-3 w-3" />
                {habit.streak}
              </span>
            )}
            <span className="text-[11px] text-muted-foreground">
              {t('habits.totalChecks', { count: habit.totalChecks })}
            </span>
          </div>
        )}
      </div>

      {/* 오늘 체크 상태 */}
      {isCheckedToday && compact && (
        <span className="text-[11px] text-[#34C759] font-semibold">✓</span>
      )}
    </motion.div>
  );
};

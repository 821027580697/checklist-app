// 습관 카드 — Apple 스타일 + 명확한 완료 UX
'use client';

import { motion } from 'framer-motion';
import { Habit } from '@/types/habit';
import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Flame, Check, Trash2, CircleDot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface HabitCardProps {
  habit: Habit;
  onToggleCheck: (habit: Habit) => void;
  onDelete?: (habit: Habit) => void;
  onClick?: (habit: Habit) => void;
  compact?: boolean;
}

export const HabitCard = ({
  habit,
  onToggleCheck,
  onDelete,
  onClick,
  compact = false,
}: HabitCardProps) => {
  const { language } = useTranslation();
  const lang = language as 'ko' | 'en';
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const isCheckedToday = (habit.completedDates || []).includes(todayStr);

  // 이번 주 체크 수 계산
  const thisWeekChecks = (() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    return (habit.completedDates || []).filter((d) => {
      const date = new Date(d);
      return date >= startOfWeek;
    }).length;
  })();

  const weeklyTarget = habit.frequency?.type === 'daily'
    ? 7
    : habit.frequency?.type === 'weekly'
      ? (habit.frequency?.timesPerWeek || 1)
      : (habit.frequency?.daysOfWeek?.length || 7);

  const weekProgress = Math.min(100, Math.round((thisWeekChecks / weeklyTarget) * 100));

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        'group flex items-center gap-3 rounded-xl transition-all duration-200',
        compact ? 'p-2.5' : 'p-3.5 hover:bg-secondary/50 cursor-pointer',
      )}
      onClick={() => onClick?.(habit)}
    >
      {/* 체크 버튼 */}
      <Tooltip>
        <TooltipTrigger asChild>
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
                : 'bg-secondary hover:bg-secondary/80 border-2 border-dashed border-muted-foreground/20 hover:border-primary/40',
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
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          {isCheckedToday
            ? (lang === 'ko' ? '탭하여 체크 취소' : 'Tap to uncheck')
            : (lang === 'ko' ? '탭하여 오늘 완료' : 'Tap to complete today')}
        </TooltipContent>
      </Tooltip>

      {/* 콘텐츠 */}
      <div className="flex-1 min-w-0">
        <h3 className={cn(
          'text-[14px] font-medium tracking-tight',
          isCheckedToday && 'text-muted-foreground',
        )}>
          {habit.title}
        </h3>
        {!compact ? (
          <div className="mt-1 space-y-1">
            <div className="flex items-center gap-2">
              {habit.streak > 0 && (
                <span className="flex items-center gap-0.5 text-[11px] text-[#FF9500] font-medium">
                  <Flame className="h-3 w-3" />
                  {habit.streak}{lang === 'ko' ? '일 연속' : 'd streak'}
                </span>
              )}
              <span className="text-[11px] text-muted-foreground">
                {lang === 'ko' ? `총 ${habit.totalChecks}회` : `${habit.totalChecks} total`}
              </span>
            </div>
            {/* 이번 주 진행률 */}
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${weekProgress}%` }}
                  transition={{ duration: 0.5 }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: habit.color || '#34C759' }}
                />
              </div>
              <span className="text-[10px] text-muted-foreground shrink-0">
                {thisWeekChecks}/{weeklyTarget}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 mt-0.5">
            {!isCheckedToday && (
              <span className="flex items-center gap-0.5 text-[10px] text-primary/60">
                <CircleDot className="h-2.5 w-2.5" />
                {lang === 'ko' ? '탭하여 체크' : 'Tap to check'}
              </span>
            )}
            {habit.streak > 0 && (
              <span className="flex items-center gap-0.5 text-[10px] text-[#FF9500]">
                <Flame className="h-2.5 w-2.5" />
                {habit.streak}
              </span>
            )}
          </div>
        )}
      </div>

      {/* 오늘 체크 상태 표시 */}
      {isCheckedToday && compact && (
        <span className="text-[11px] text-[#34C759] font-semibold">✓</span>
      )}

      {/* 삭제 버튼 (비compact 모드) */}
      {!compact && onDelete && (
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 text-muted-foreground hover:text-[#FF3B30]"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(habit);
          }}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      )}
    </motion.div>
  );
};

// 스트릭 캘린더 (GitHub 잔디 스타일) 컴포넌트
'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { getRecentDays } from '@/lib/gamification/streakSystem';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { ko, enUS } from 'date-fns/locale';
import { useTranslation } from '@/hooks/useTranslation';

interface StreakCalendarProps {
  completedDates: string[];   // 'YYYY-MM-DD' 배열
  weeks?: number;             // 표시할 주 수 (기본 12주)
  color?: string;             // 달성 색상 (기본 초록)
}

export const StreakCalendar = ({
  completedDates,
  weeks = 12,
  color = '#34C759',
}: StreakCalendarProps) => {
  const { language } = useTranslation();
  const days = weeks * 7;

  // 최근 N일 날짜 목록 생성
  const recentDays = useMemo(() => getRecentDays(days), [days]);

  // 완료된 날짜 Set (빠른 조회)
  const completedSet = useMemo(() => new Set(completedDates), [completedDates]);

  // 7행 × N열 그리드로 변환
  const grid = useMemo(() => {
    const result: string[][] = [];
    for (let col = 0; col < weeks; col++) {
      const week: string[] = [];
      for (let row = 0; row < 7; row++) {
        const index = col * 7 + row;
        week.push(recentDays[index] || '');
      }
      result.push(week);
    }
    return result;
  }, [recentDays, weeks]);

  // 색상 농도 계산
  const getColor = (dateStr: string): string => {
    if (!dateStr) return 'transparent';
    if (!completedSet.has(dateStr)) return 'var(--muted)';
    return color;
  };

  const getOpacity = (dateStr: string): number => {
    if (!completedSet.has(dateStr)) return 0.3;
    return 1;
  };

  // 요일 라벨
  const dayLabels = language === 'ko'
    ? ['일', '월', '화', '수', '목', '금', '토']
    : ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <div className="space-y-2">
      <div className="flex gap-0.5">
        {/* 요일 라벨 */}
        <div className="flex flex-col gap-0.5 mr-1">
          {dayLabels.map((day, i) => (
            <div
              key={i}
              className="h-3 w-6 text-[9px] text-muted-foreground flex items-center justify-end pr-1"
            >
              {i % 2 === 1 ? day : ''}
            </div>
          ))}
        </div>

        {/* 잔디 그리드 */}
        {grid.map((week, colIndex) => (
          <div key={colIndex} className="flex flex-col gap-0.5">
            {week.map((dateStr, rowIndex) => {
              if (!dateStr) return <div key={rowIndex} className="h-3 w-3" />;

              const isCompleted = completedSet.has(dateStr);
              const tooltipDate = format(
                parseISO(dateStr),
                language === 'ko' ? 'yyyy년 M월 d일' : 'MMM d, yyyy',
                { locale: language === 'ko' ? ko : enUS },
              );

              return (
                <Tooltip key={rowIndex}>
                  <TooltipTrigger asChild>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: colIndex * 0.02 + rowIndex * 0.01 }}
                      className={cn(
                        'h-3 w-3 rounded-[2px] transition-colors cursor-default',
                      )}
                      style={{
                        backgroundColor: getColor(dateStr),
                        opacity: getOpacity(dateStr),
                      }}
                    />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    <p>{tooltipDate}</p>
                    <p>{isCompleted ? '✅ 달성' : '⬜ 미달성'}</p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        ))}
      </div>

      {/* 범례 */}
      <div className="flex items-center gap-1 text-[10px] text-muted-foreground justify-end">
        <span>{language === 'ko' ? '적음' : 'Less'}</span>
        <div className="h-3 w-3 rounded-[2px]" style={{ backgroundColor: 'var(--muted)', opacity: 0.3 }} />
        <div className="h-3 w-3 rounded-[2px]" style={{ backgroundColor: color, opacity: 0.4 }} />
        <div className="h-3 w-3 rounded-[2px]" style={{ backgroundColor: color, opacity: 0.7 }} />
        <div className="h-3 w-3 rounded-[2px]" style={{ backgroundColor: color, opacity: 1 }} />
        <span>{language === 'ko' ? '많음' : 'More'}</span>
      </div>
    </div>
  );
};

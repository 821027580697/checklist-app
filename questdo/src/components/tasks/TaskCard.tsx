// 할 일 카드 — Apple 스타일 리스트 아이템
'use client';

import { motion } from 'framer-motion';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Task, PRIORITY_COLORS, CATEGORY_LABELS } from '@/types/task';
import { useTranslation } from '@/hooks/useTranslation';
import { Calendar, Clock, MoreHorizontal, ChevronRight } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { ko, enUS } from 'date-fns/locale';

interface TaskCardProps {
  task: Task;
  onToggleComplete: (task: Task) => void;
  onEdit?: (task: Task) => void;
  onDelete?: (task: Task) => void;
  onClick?: (task: Task) => void;
  compact?: boolean;
}

export const TaskCard = ({
  task,
  onToggleComplete,
  onEdit,
  onDelete,
  onClick,
  compact = false,
}: TaskCardProps) => {
  const { t, language } = useTranslation();
  const isCompleted = task.status === 'completed';
  const priorityColor = PRIORITY_COLORS[task.priority];
  const categoryLabel = CATEGORY_LABELS[task.category][language as 'ko' | 'en'];

  const formattedDueDate = task.dueDate
    ? format(task.dueDate.toDate(), language === 'ko' ? 'M월 d일' : 'MMM d', {
        locale: language === 'ko' ? ko : enUS,
      })
    : null;

  const subtaskProgress =
    task.subtasks.length > 0
      ? task.subtasks.filter((st) => st.isCompleted).length
      : 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      className={cn(
        'group flex items-start gap-3 rounded-xl p-3 transition-all duration-200',
        isCompleted && 'opacity-50',
        !compact && 'hover:bg-secondary/50 cursor-pointer',
        compact && 'py-2.5',
      )}
      onClick={() => onClick?.(task)}
    >
      {/* 체크박스 */}
      <div className="mt-0.5" onClick={(e) => e.stopPropagation()}>
        <Checkbox
          checked={isCompleted}
          onCheckedChange={() => onToggleComplete(task)}
          className={cn(
            'h-[18px] w-[18px] rounded-full border-[1.5px] transition-all',
            isCompleted && 'bg-[#34C759] border-[#34C759]',
          )}
        />
      </div>

      {/* 콘텐츠 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3
            className={cn(
              'text-[14px] font-medium leading-tight tracking-tight',
              isCompleted && 'line-through text-muted-foreground',
            )}
          >
            {task.title}
          </h3>

          {!compact && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 rounded-md opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                >
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-xl">
                <DropdownMenuItem onClick={() => onEdit?.(task)} className="text-[13px]">
                  {t('common.edit')}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDelete?.(task)}
                  className="text-[13px] text-[#FF3B30]"
                >
                  {t('common.delete')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* 메타 정보 */}
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          {/* 우선순위 도트 */}
          <div
            className="h-1.5 w-1.5 rounded-full shrink-0"
            style={{ backgroundColor: priorityColor }}
          />

          {/* 카테고리 */}
          <span className="text-[11px] text-muted-foreground">{categoryLabel}</span>

          {/* 마감일 */}
          {formattedDueDate && (
            <span className="flex items-center gap-0.5 text-[11px] text-muted-foreground">
              <span>·</span>
              {formattedDueDate}
            </span>
          )}

          {/* 서브태스크 */}
          {task.subtasks.length > 0 && (
            <span className="text-[11px] text-muted-foreground">
              · {subtaskProgress}/{task.subtasks.length}
            </span>
          )}
        </div>
      </div>

      {/* 화살표 (compact 모드) */}
      {compact && (
        <ChevronRight className="h-4 w-4 text-muted-foreground/40 shrink-0 mt-0.5" />
      )}
    </motion.div>
  );
};

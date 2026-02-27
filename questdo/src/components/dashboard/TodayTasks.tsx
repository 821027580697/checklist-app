// 오늘의 할 일 위젯 — 실시간 연동 + CRUD 지원
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useTaskStore } from '@/stores/taskStore';
import { useTranslation } from '@/hooks/useTranslation';
import { Task, PRIORITY_COLORS, CATEGORY_LABELS } from '@/types/task';
import { CheckCircle2, CalendarPlus, MoreHorizontal, Pencil, Trash2, Inbox } from 'lucide-react';
import Link from 'next/link';
import { isSameDay } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface TodayTasksProps {
  onToggleComplete: (task: Task) => void;
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
}

export const TodayTasks = ({ onToggleComplete, onEdit, onDelete }: TodayTasksProps) => {
  const { t, language } = useTranslation();
  const lang = language as 'ko' | 'en';
  const tasks = useTaskStore((state) => state.tasks);
  const isLoading = useTaskStore((state) => state.isLoading);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 오늘 마감인 할 일 + 마감일 없는 미완료 할 일 (전체 연동)
  const allTodayTasks = tasks.filter((task) => {
    // 마감일이 오늘인 것
    if (task.dueDate) {
      try {
        if (isSameDay(task.dueDate.toDate(), today)) return true;
      } catch {
        // 파싱 실패 시 무시
      }
    }
    // 마감일 없는 미완료 할 일도 오늘 목록에 포함
    if (!task.dueDate && task.status !== 'completed') return true;
    return false;
  });

  // 미완료 먼저, 완료 뒤에
  const sortedTasks = [...allTodayTasks].sort((a, b) => {
    if (a.status === 'completed' && b.status !== 'completed') return 1;
    if (a.status !== 'completed' && b.status === 'completed') return -1;
    return 0;
  });

  const completedCount = allTodayTasks.filter((t) => t.status === 'completed').length;
  const totalCount = allTodayTasks.length;
  const allCompleted = totalCount > 0 && completedCount === totalCount;

  const handleDelete = () => {
    if (deletingTask && onDelete) {
      onDelete(deletingTask.id);
      setDeletingTask(null);
    }
  };

  return (
    <div className="apple-card overflow-hidden">
      <div className="flex items-center justify-between px-5 pt-5 pb-2">
        <div>
          <h3 className="text-[15px] font-semibold tracking-tight">{t('dashboard.todayTasks')}</h3>
          {totalCount > 0 && (
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {completedCount}/{totalCount} {lang === 'ko' ? '완료' : 'completed'}
            </p>
          )}
        </div>
        <Link href="/tasks">
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
        ) : totalCount === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center py-8 text-center"
          >
            <CalendarPlus className="h-8 w-8 text-muted-foreground/40 mb-2" />
            <p className="text-[13px] text-muted-foreground">
              {lang === 'ko' ? '오늘 등록된 할 일이 없습니다' : 'No tasks for today'}
            </p>
            <Link href="/tasks">
              <Button variant="link" size="sm" className="text-[12px] text-primary mt-1">
                {lang === 'ko' ? '할 일 추가하기' : 'Add a task'}
              </Button>
            </Link>
          </motion.div>
        ) : allCompleted ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center py-6 text-center"
          >
            <CheckCircle2 className="h-8 w-8 text-[#34C759] mb-2" />
            <p className="text-[13px] font-medium text-[#34C759]">
              {t('dashboard.allCompleted')}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {lang === 'ko' ? `${totalCount}개의 할 일을 모두 완료했어요 🎉` : `All ${totalCount} tasks completed 🎉`}
            </p>
          </motion.div>
        ) : (
          <div className="space-y-1">
            <AnimatePresence mode="popLayout">
              {sortedTasks.map((task) => {
                const isCompleted = task.status === 'completed';
                const priorityColor = PRIORITY_COLORS[task.priority];
                const hasNoDueDate = !task.dueDate;

                return (
                  <motion.div
                    key={task.id}
                    layout
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className={cn(
                      'group flex items-center gap-3 rounded-xl p-2.5 transition-all duration-200 hover:bg-secondary/50',
                      isCompleted && 'opacity-50',
                    )}
                  >
                    {/* 체크박스 */}
                    <Checkbox
                      checked={isCompleted}
                      onCheckedChange={() => onToggleComplete(task)}
                      className={cn(
                        'h-[18px] w-[18px] rounded-full border-[1.5px] transition-all shrink-0',
                        isCompleted && 'bg-[#34C759] border-[#34C759]',
                      )}
                    />

                    {/* 콘텐츠 */}
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        'text-[13px] font-medium leading-tight truncate',
                        isCompleted && 'line-through text-muted-foreground',
                      )}>
                        {task.title}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <div className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: priorityColor }} />
                        <span className="text-[10px] text-muted-foreground">
                          {CATEGORY_LABELS[task.category]?.[lang]}
                        </span>
                        {hasNoDueDate && (
                          <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground/50">
                            <Inbox className="h-2.5 w-2.5" />
                            {lang === 'ko' ? '미지정' : 'No date'}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 더보기 메뉴 */}
                    {(onEdit || onDelete) && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 rounded-md opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                          >
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl min-w-[120px]">
                          {onEdit && (
                            <DropdownMenuItem onClick={() => onEdit(task)} className="text-[13px] gap-2">
                              <Pencil className="h-3.5 w-3.5" />
                              {t('common.edit')}
                            </DropdownMenuItem>
                          )}
                          {onDelete && (
                            <DropdownMenuItem onClick={() => setDeletingTask(task)} className="text-[13px] text-[#FF3B30] gap-2">
                              <Trash2 className="h-3.5 w-3.5" />
                              {t('common.delete')}
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* 삭제 확인 모달 */}
      <Dialog open={!!deletingTask} onOpenChange={() => setDeletingTask(null)}>
        <DialogContent className="sm:max-w-[340px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-[17px] text-center">{t('tasks.deleteConfirm')}</DialogTitle>
            <DialogDescription className="text-[13px] text-center">
              &quot;{deletingTask?.title}&quot;
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-2">
            <Button variant="outline" className="flex-1 h-10 rounded-xl text-[14px]" onClick={() => setDeletingTask(null)}>
              {t('common.cancel')}
            </Button>
            <Button variant="destructive" className="flex-1 h-10 rounded-xl text-[14px]" onClick={handleDelete}>
              {t('common.delete')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// 오늘의 할 일 위젯
'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { TaskList } from '@/components/tasks/TaskList';
import { useTaskStore } from '@/stores/taskStore';
import { useTranslation } from '@/hooks/useTranslation';
import { Task } from '@/types/task';
import { CheckCircle2, CalendarPlus } from 'lucide-react';
import Link from 'next/link';
import { isSameDay } from 'date-fns';

interface TodayTasksProps {
  onToggleComplete: (task: Task) => void;
}

export const TodayTasks = ({ onToggleComplete }: TodayTasksProps) => {
  const { t, language } = useTranslation();
  const lang = language as 'ko' | 'en';
  const tasks = useTaskStore((state) => state.tasks);
  const isLoading = useTaskStore((state) => state.isLoading);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 오늘 마감인 모든 할 일 (완료 포함)
  const allTodayTasks = tasks.filter((task) => {
    if (!task.dueDate) return false;
    try {
      return isSameDay(task.dueDate.toDate(), today);
    } catch {
      return false;
    }
  });

  // 표시용: 미완료 + 오늘 완료된 것
  const displayTasks = allTodayTasks
    .filter((task) => {
      if (task.status !== 'completed') return true;
      // 완료된 것은 오늘 완료된 것만 표시
      if (task.completedAt) {
        try {
          return isSameDay(task.completedAt.toDate(), today);
        } catch {
          return false;
        }
      }
      return false;
    })
    .slice(0, 5);

  const completedCount = allTodayTasks.filter((t) => t.status === 'completed').length;
  const totalCount = allTodayTasks.length;
  const allCompleted = totalCount > 0 && completedCount === totalCount;

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
          /* 오늘 등록된 할 일이 없는 경우 */
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
          /* 오늘의 할 일을 모두 완료한 경우 */
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center py-8 text-center"
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
          <TaskList
            tasks={displayTasks}
            onToggleComplete={onToggleComplete}
            compact
          />
        )}
      </div>
    </div>
  );
};

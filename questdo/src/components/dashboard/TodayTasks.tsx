// 오늘의 할 일 위젯 — Apple 스타일
'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TaskList } from '@/components/tasks/TaskList';
import { useTaskStore } from '@/stores/taskStore';
import { useTranslation } from '@/hooks/useTranslation';
import { Task } from '@/types/task';
import { CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { isSameDay } from 'date-fns';

interface TodayTasksProps {
  onToggleComplete: (task: Task) => void;
}

export const TodayTasks = ({ onToggleComplete }: TodayTasksProps) => {
  const { t } = useTranslation();
  const tasks = useTaskStore((state) => state.tasks);

  const todayTasks = tasks
    .filter((task) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (task.dueDate && isSameDay(task.dueDate.toDate(), today)) {
        if (task.status === 'completed') {
          return task.completedAt && isSameDay(task.completedAt.toDate(), today);
        }
        return true;
      }
      return false;
    })
    .slice(0, 5);

  const completedCount = todayTasks.filter((t) => t.status === 'completed').length;
  const totalCount = todayTasks.length;

  return (
    <div className="apple-card overflow-hidden">
      <div className="flex items-center justify-between px-5 pt-5 pb-2">
        <div>
          <h3 className="text-[15px] font-semibold tracking-tight">{t('dashboard.todayTasks')}</h3>
          {totalCount > 0 && (
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {completedCount}/{totalCount} {t('tasks.completed').toLowerCase()}
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
        {todayTasks.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center py-8 text-center"
          >
            <CheckCircle2 className="h-8 w-8 text-[#34C759] mb-2" />
            <p className="text-[13px] text-muted-foreground">
              {t('dashboard.allCompleted')}
            </p>
          </motion.div>
        ) : (
          <TaskList
            tasks={todayTasks}
            onToggleComplete={onToggleComplete}
            compact
          />
        )}
      </div>
    </div>
  );
};

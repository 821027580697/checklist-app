// 할 일 리스트 컴포넌트
'use client';

import { AnimatePresence } from 'framer-motion';
import { TaskCard } from './TaskCard';
import { Task } from '@/types/task';
import { useTranslation } from '@/hooks/useTranslation';
import { ClipboardList } from 'lucide-react';

interface TaskListProps {
  tasks: Task[];
  onToggleComplete: (task: Task) => void;
  onEdit?: (task: Task) => void;
  onDelete?: (task: Task) => void;
  onClick?: (task: Task) => void;
  compact?: boolean;
  emptyMessage?: string;
}

export const TaskList = ({
  tasks,
  onToggleComplete,
  onEdit,
  onDelete,
  onClick,
  compact = false,
  emptyMessage,
}: TaskListProps) => {
  const { t } = useTranslation();

  // 빈 상태
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
          <ClipboardList className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">
          {emptyMessage || t('tasks.noTasks')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <AnimatePresence mode="popLayout">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onToggleComplete={onToggleComplete}
            onEdit={onEdit}
            onDelete={onDelete}
            onClick={onClick}
            compact={compact}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

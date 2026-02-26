// 할 일 목록 — Apple 스타일
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { TaskList } from '@/components/tasks/TaskList';
import { TaskFilter } from '@/components/tasks/TaskFilter';
import { TaskForm } from '@/components/tasks/TaskForm';
import { useTasks } from '@/hooks/useTasks';
import { useTaskStore } from '@/stores/taskStore';
import { useTranslation } from '@/hooks/useTranslation';
import { Task, TaskCategory, TaskPriority } from '@/types/task';
import { Timestamp } from 'firebase/firestore';
import { Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

export default function TasksPage() {
  const { t } = useTranslation();
  const { createTask, toggleComplete, editTask, deleteTask } = useTasks();
  const getFilteredTasks = useTaskStore((state) => state.getFilteredTasks);
  const filteredTasks = getFilteredTasks();

  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);

  const handleCreate = (data: {
    title: string;
    description: string;
    category: TaskCategory;
    priority: TaskPriority;
    dueDate: string;
    dueTime: string;
    isRecurring: boolean;
    subtasks: { id: string; title: string; isCompleted: boolean }[];
  }) => {
    createTask({
      title: data.title,
      description: data.description,
      category: data.category,
      priority: data.priority,
      status: 'todo',
      dueDate: data.dueDate ? Timestamp.fromDate(new Date(data.dueDate)) : null,
      dueTime: data.dueTime || null,
      reminder: { enabled: false, type: 'at_time' },
      isRecurring: data.isRecurring,
      recurringPattern: null,
      subtasks: data.subtasks,
    });
  };

  const handleEdit = (data: {
    title: string;
    description: string;
    category: TaskCategory;
    priority: TaskPriority;
    dueDate: string;
    dueTime: string;
    isRecurring: boolean;
    subtasks: { id: string; title: string; isCompleted: boolean }[];
  }) => {
    if (!editingTask) return;
    editTask(editingTask.id, {
      title: data.title,
      description: data.description,
      category: data.category,
      priority: data.priority,
      dueDate: data.dueDate ? Timestamp.fromDate(new Date(data.dueDate)) : null,
      dueTime: data.dueTime || null,
      isRecurring: data.isRecurring,
      subtasks: data.subtasks,
    });
    setEditingTask(null);
  };

  return (
    <div className="space-y-5">
      {/* 페이지 헤더 */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-[28px] font-bold tracking-tight">{t('tasks.title')}</h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            {filteredTasks.length} {t('tasks.title').toLowerCase()}
          </p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          className="h-9 rounded-full px-4 text-[13px] font-medium"
          size="sm"
        >
          <Plus className="mr-1 h-4 w-4" />
          {t('tasks.add')}
        </Button>
      </motion.div>

      {/* 필터 */}
      <TaskFilter />

      {/* 할 일 목록 */}
      <div className="apple-card overflow-hidden">
        <div className="p-2">
          <TaskList
            tasks={filteredTasks}
            onToggleComplete={toggleComplete}
            onEdit={(task) => setEditingTask(task)}
            onDelete={(task) => setDeletingTask(task)}
          />
        </div>
      </div>

      {/* 할 일 생성 모달 */}
      <TaskForm
        open={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={handleCreate}
      />

      {/* 할 일 편집 모달 */}
      {editingTask && (
        <TaskForm
          open={!!editingTask}
          onClose={() => setEditingTask(null)}
          onSubmit={handleEdit}
          initialData={{
            title: editingTask.title,
            description: editingTask.description,
            category: editingTask.category,
            priority: editingTask.priority,
            dueDate: editingTask.dueDate
              ? editingTask.dueDate.toDate().toISOString().split('T')[0]
              : '',
            dueTime: editingTask.dueTime || '',
            isRecurring: editingTask.isRecurring,
            subtasks: editingTask.subtasks,
          }}
          isEdit
        />
      )}

      {/* 삭제 확인 */}
      <Dialog open={!!deletingTask} onOpenChange={() => setDeletingTask(null)}>
        <DialogContent className="sm:max-w-[340px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-[17px] text-center">{t('tasks.deleteConfirm')}</DialogTitle>
            <DialogDescription className="text-[13px] text-center">
              &quot;{deletingTask?.title}&quot;
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-2">
            <Button
              variant="outline"
              className="flex-1 h-10 rounded-xl text-[14px]"
              onClick={() => setDeletingTask(null)}
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="destructive"
              className="flex-1 h-10 rounded-xl text-[14px]"
              onClick={() => {
                if (deletingTask) {
                  deleteTask(deletingTask.id);
                  setDeletingTask(null);
                }
              }}
            >
              {t('common.delete')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 플로팅 추가 버튼 (모바일) */}
      <Button
        onClick={() => setShowForm(true)}
        className="fixed bottom-24 right-5 h-[52px] w-[52px] rounded-full shadow-lg shadow-primary/30 md:hidden z-30"
        size="icon"
      >
        <Plus className="h-5 w-5" />
      </Button>
    </div>
  );
}

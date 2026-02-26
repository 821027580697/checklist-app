// 할 일 상세/편집 페이지
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { useTaskStore } from '@/stores/taskStore';
import { useTranslation } from '@/hooks/useTranslation';
import {
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  PRIORITY_LABELS,
  PRIORITY_COLORS,
  Task,
} from '@/types/task';
import { TaskForm } from '@/components/tasks/TaskForm';
import { format } from 'date-fns';
import { ko, enUS } from 'date-fns/locale';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Edit3,
  Trash2,
  CheckCircle2,
  Circle,
  AlertTriangle,
} from 'lucide-react';

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { t, language } = useTranslation();
  const tasks = useTaskStore((state) => state.tasks);
  const lang = language as 'ko' | 'en';
  const [showEdit, setShowEdit] = useState(false);

  const task = tasks.find((t) => t.id === params.id);

  if (!task) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertTriangle className="h-10 w-10 text-muted-foreground mb-4" />
        <p className="text-sm text-muted-foreground">
          {lang === 'ko' ? '할 일을 찾을 수 없습니다' : 'Task not found'}
        </p>
        <Button
          variant="outline"
          className="mt-4 rounded-xl"
          onClick={() => router.push('/tasks')}
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          {lang === 'ko' ? '목록으로 돌아가기' : 'Back to list'}
        </Button>
      </div>
    );
  }

  const statusIcon =
    task.status === 'completed' ? (
      <CheckCircle2 className="h-5 w-5 text-green-500" />
    ) : (
      <Circle className="h-5 w-5 text-muted-foreground" />
    );

  return (
    <div className="space-y-6">
      {/* 상단 네비 */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/tasks')}
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          {t('common.back')}
        </Button>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl"
            onClick={() => setShowEdit(true)}
          >
            <Edit3 className="mr-1 h-4 w-4" />
            {t('common.edit')}
          </Button>
        </div>
      </motion.div>

      {/* 태스크 상세 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card>
          <CardContent className="pt-6 space-y-4">
            {/* 상태 + 제목 */}
            <div className="flex items-start gap-3">
              {statusIcon}
              <div className="flex-1">
                <h1 className="text-xl font-bold">{task.title}</h1>
                {task.description && (
                  <p className="mt-1 text-sm text-muted-foreground">{task.description}</p>
                )}
              </div>
            </div>

            <Separator />

            {/* 메타 정보 */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              {/* 카테고리 */}
              <div>
                <p className="text-xs text-muted-foreground mb-1">{t('tasks.categoryLabel')}</p>
                <Badge
                  variant="secondary"
                  className="rounded-full"
                  style={{
                    backgroundColor: CATEGORY_COLORS[task.category] + '20',
                    color: CATEGORY_COLORS[task.category],
                  }}
                >
                  {CATEGORY_LABELS[task.category][lang]}
                </Badge>
              </div>

              {/* 우선순위 */}
              <div>
                <p className="text-xs text-muted-foreground mb-1">{t('tasks.priorityLabel')}</p>
                <Badge
                  variant="secondary"
                  className="rounded-full"
                  style={{
                    backgroundColor: PRIORITY_COLORS[task.priority] + '20',
                    color: PRIORITY_COLORS[task.priority],
                  }}
                >
                  {PRIORITY_LABELS[task.priority][lang]}
                </Badge>
              </div>

              {/* 마감일 */}
              {task.dueDate && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">{t('tasks.dueDateLabel')}</p>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>
                      {format(task.dueDate.toDate(), lang === 'ko' ? 'yyyy.MM.dd' : 'MMM d, yyyy', {
                        locale: lang === 'ko' ? ko : enUS,
                      })}
                    </span>
                  </div>
                </div>
              )}

              {/* 마감 시간 */}
              {task.dueTime && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">{t('tasks.dueTimeLabel')}</p>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{task.dueTime}</span>
                  </div>
                </div>
              )}
            </div>

            {/* 서브태스크 */}
            {task.subtasks.length > 0 && (
              <>
                <Separator />
                <div>
                  <p className="text-xs text-muted-foreground mb-2">{t('tasks.subtasksLabel')}</p>
                  <div className="space-y-2">
                    {task.subtasks.map((sub) => (
                      <div key={sub.id} className="flex items-center gap-2">
                        <Checkbox checked={sub.isCompleted} disabled />
                        <span
                          className={
                            sub.isCompleted
                              ? 'text-sm line-through text-muted-foreground'
                              : 'text-sm'
                          }
                        >
                          {sub.title}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* XP */}
            {task.xpEarned > 0 && (
              <>
                <Separator />
                <div className="flex items-center gap-1 text-sm text-yellow-600 dark:text-yellow-400">
                  ⭐ {t('tasks.xpEarned').replace('{xp}', String(task.xpEarned))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* 편집 모달 */}
      <TaskForm
        open={showEdit}
        onClose={() => setShowEdit(false)}
        onSubmit={() => setShowEdit(false)}
        isEdit
        initialData={{
          title: task.title,
          description: task.description,
          category: task.category,
          priority: task.priority,
          dueDate: task.dueDate ? task.dueDate.toDate().toISOString().split('T')[0] : '',
          dueTime: task.dueTime ?? '',
          isRecurring: task.isRecurring,
          subtasks: task.subtasks,
        }}
      />
    </div>
  );
}

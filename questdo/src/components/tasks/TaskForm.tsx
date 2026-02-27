// 할 일 생성/편집 폼 (모달)
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useTranslation } from '@/hooks/useTranslation';
import { TaskCategory, TaskPriority, CATEGORY_LABELS, PRIORITY_LABELS } from '@/types/task';
import { CATEGORY_ICONS } from '@/constants/categories';
import { Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TaskFormData {
  title: string;
  description: string;
  category: TaskCategory;
  priority: TaskPriority;
  dueDate: string;
  dueTime: string;
  isRecurring: boolean;
  subtasks: { id: string; title: string; isCompleted: boolean }[];
}

interface TaskFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: TaskFormData) => void;
  initialData?: Partial<TaskFormData>;
  isEdit?: boolean;
}

export const TaskForm = ({
  open,
  onClose,
  onSubmit,
  initialData,
  isEdit = false,
}: TaskFormProps) => {
  const { t, language } = useTranslation();

  const [formData, setFormData] = useState<TaskFormData>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    category: initialData?.category || 'personal',
    priority: initialData?.priority || 'medium',
    dueDate: initialData?.dueDate || '',
    dueTime: initialData?.dueTime || '',
    isRecurring: initialData?.isRecurring || false,
    subtasks: initialData?.subtasks || [],
  });

  const [newSubtask, setNewSubtask] = useState('');

  // 서브태스크 추가
  const addSubtask = () => {
    if (!newSubtask.trim()) return;
    setFormData((prev) => ({
      ...prev,
      subtasks: [
        ...prev.subtasks,
        { id: Date.now().toString(), title: newSubtask.trim(), isCompleted: false },
      ],
    }));
    setNewSubtask('');
  };

  // 서브태스크 삭제
  const removeSubtask = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      subtasks: prev.subtasks.filter((st) => st.id !== id),
    }));
  };

  // 폼 제출
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    onSubmit(formData);
    onClose();
  };

  const lang = language as 'ko' | 'en';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t('tasks.edit') : t('tasks.add')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 제목 */}
          <div className="space-y-2">
            <Label htmlFor="title">{t('tasks.titleLabel')}</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              placeholder={t('tasks.titlePlaceholder')}
              maxLength={100}
              className="rounded-xl"
              autoFocus
            />
          </div>

          {/* 설명 */}
          <div className="space-y-2">
            <Label htmlFor="description">{t('tasks.descriptionLabel')}</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder={t('tasks.descriptionPlaceholder')}
              maxLength={500}
              className="rounded-xl min-h-[80px] resize-none"
            />
          </div>

          {/* 카테고리 & 우선순위 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('tasks.categoryLabel')}</Label>
              <Select
                value={formData.category}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, category: value as TaskCategory }))
                }
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(CATEGORY_LABELS) as TaskCategory[]).map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      <span className="flex items-center gap-2">
                        {CATEGORY_ICONS[cat]} {CATEGORY_LABELS[cat][lang]}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t('tasks.priorityLabel')}</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, priority: value as TaskPriority }))
                }
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(PRIORITY_LABELS) as TaskPriority[]).map((p) => (
                    <SelectItem key={p} value={p}>
                      {PRIORITY_LABELS[p][lang]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 마감일 & 시간 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dueDate">{t('tasks.dueDateLabel')}</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData((prev) => ({ ...prev, dueDate: e.target.value }))}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueTime">{t('tasks.dueTimeLabel')}</Label>
              <Input
                id="dueTime"
                type="time"
                value={formData.dueTime}
                onChange={(e) => setFormData((prev) => ({ ...prev, dueTime: e.target.value }))}
                className="rounded-xl"
              />
            </div>
          </div>

          {/* 반복 설정 */}
          <div className="flex items-center justify-between">
            <Label htmlFor="recurring">{t('tasks.recurringLabel')}</Label>
            <Switch
              id="recurring"
              checked={formData.isRecurring}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({ ...prev, isRecurring: checked }))
              }
            />
          </div>

          {/* 서브태스크 */}
          <div className="space-y-3">
            <Label>{t('tasks.subtasksLabel')}</Label>

            {/* 서브태스크 목록 */}
            {formData.subtasks.map((st) => (
              <div
                key={st.id}
                className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2"
              >
                <span className="flex-1 text-sm">{st.title}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => removeSubtask(st.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}

            {/* 서브태스크 추가 입력 */}
            <div className="flex gap-2">
              <Input
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                placeholder={t('tasks.addSubtask')}
                className="rounded-xl"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addSubtask();
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={addSubtask}
                className="rounded-xl shrink-0"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* 제출 버튼 */}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1 rounded-xl" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" className="flex-1 rounded-xl">
              {isEdit ? t('common.save') : t('tasks.add')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

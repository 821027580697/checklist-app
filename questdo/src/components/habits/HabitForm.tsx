// 습관 생성/편집 폼
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { TaskCategory, CATEGORY_LABELS } from '@/types/task';
import { HABIT_ICONS, HABIT_COLORS, HabitFrequencyType } from '@/types/habit';
import { CATEGORY_ICONS } from '@/constants/categories';
import { cn } from '@/lib/utils';

interface HabitFormData {
  title: string;
  description: string;
  category: TaskCategory;
  icon: string;
  color: string;
  frequencyType: HabitFrequencyType;
  daysOfWeek: number[];
  reminderTime: string;
}

interface HabitFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: HabitFormData) => void;
  initialData?: Partial<HabitFormData>;
  isEdit?: boolean;
}

export const HabitForm = ({
  open,
  onClose,
  onSubmit,
  initialData,
  isEdit = false,
}: HabitFormProps) => {
  const { t, language } = useTranslation();
  const lang = language as 'ko' | 'en';

  const [formData, setFormData] = useState<HabitFormData>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    category: initialData?.category || 'health',
    icon: initialData?.icon || '💧',
    color: initialData?.color || '#34C759',
    frequencyType: initialData?.frequencyType || 'daily',
    daysOfWeek: initialData?.daysOfWeek || [1, 2, 3, 4, 5],
    reminderTime: initialData?.reminderTime || '',
  });

  const dayLabels = language === 'ko'
    ? ['일', '월', '화', '수', '목', '금', '토']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // 요일 토글
  const toggleDay = (day: number) => {
    setFormData((prev) => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(day)
        ? prev.daysOfWeek.filter((d) => d !== day)
        : [...prev.daysOfWeek, day],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    onSubmit(formData);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? t('habits.edit') : t('habits.add')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 습관 이름 */}
          <div className="space-y-2">
            <Label>{lang === 'ko' ? '습관 이름' : 'Habit Name'}</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              placeholder={lang === 'ko' ? '습관을 입력하세요' : 'Enter habit name'}
              className="rounded-xl"
              autoFocus
            />
          </div>

          {/* 설명 */}
          <div className="space-y-2">
            <Label>{t('tasks.descriptionLabel')}</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder={t('tasks.descriptionPlaceholder')}
              className="rounded-xl min-h-[60px] resize-none"
            />
          </div>

          {/* 아이콘 선택 */}
          <div className="space-y-2">
            <Label>{lang === 'ko' ? '아이콘' : 'Icon'}</Label>
            <div className="grid grid-cols-8 gap-2">
              {HABIT_ICONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, icon }))}
                  className={cn(
                    'flex h-10 items-center justify-center rounded-xl text-xl transition-all',
                    formData.icon === icon
                      ? 'bg-primary/10 ring-2 ring-primary scale-110'
                      : 'bg-muted hover:bg-muted/80',
                  )}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* 색상 선택 */}
          <div className="space-y-2">
            <Label>{lang === 'ko' ? '색상' : 'Color'}</Label>
            <div className="flex gap-2">
              {HABIT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, color: c }))}
                  className={cn(
                    'h-8 w-8 rounded-full transition-all',
                    formData.color === c && 'ring-2 ring-offset-2 ring-primary scale-110',
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* 카테고리 */}
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
                    {CATEGORY_ICONS[cat]} {CATEGORY_LABELS[cat][lang]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 빈도 */}
          <div className="space-y-2">
            <Label>{t('habits.frequency')}</Label>
            <Select
              value={formData.frequencyType}
              onValueChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  frequencyType: value as HabitFrequencyType,
                }))
              }
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">{t('habits.daily')}</SelectItem>
                <SelectItem value="weekly">{t('habits.weekly')}</SelectItem>
                <SelectItem value="custom">{t('habits.custom')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 커스텀 요일 선택 */}
          {formData.frequencyType === 'custom' && (
            <div className="flex gap-2">
              {dayLabels.map((label, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => toggleDay(index)}
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-full text-xs font-medium transition-all',
                    formData.daysOfWeek.includes(index)
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground',
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          {/* 리마인더 시간 */}
          <div className="space-y-2">
            <Label>{t('habits.reminder')}</Label>
            <Input
              type="time"
              value={formData.reminderTime}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, reminderTime: e.target.value }))
              }
              className="rounded-xl"
            />
          </div>

          {/* 제출 버튼 */}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1 rounded-xl" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" className="flex-1 rounded-xl">
              {isEdit ? t('common.save') : t('habits.add')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

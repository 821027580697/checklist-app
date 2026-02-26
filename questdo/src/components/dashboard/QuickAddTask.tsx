// 빠른 할 일 추가 — Apple 스타일
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/hooks/useTranslation';
import { Plus } from 'lucide-react';

interface QuickAddTaskProps {
  onAdd: (title: string) => void;
}

export const QuickAddTask = ({ onAdd }: QuickAddTaskProps) => {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAdd(title.trim());
    setTitle('');
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      onSubmit={handleSubmit}
      className="flex items-center gap-2"
    >
      <div className="relative flex-1">
        <Plus className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t('dashboard.quickAdd')}
          className="h-11 pl-10 rounded-2xl bg-secondary/50 border-0 text-[14px] focus-visible:ring-1 focus-visible:ring-primary placeholder:text-muted-foreground/50"
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
      </div>
      {(isFocused || title) && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          <Button type="submit" size="sm" className="h-9 rounded-full px-4 text-[13px] font-medium">
            {t('common.add')}
          </Button>
        </motion.div>
      )}
    </motion.form>
  );
};

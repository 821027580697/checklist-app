// 할 일 필터/정렬 컴포넌트
'use client';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useTaskStore } from '@/stores/taskStore';
import { useTranslation } from '@/hooks/useTranslation';
import { CATEGORY_LABELS, PRIORITY_LABELS, TaskCategory, TaskPriority, TaskStatus } from '@/types/task';
import { Search, List, LayoutGrid } from 'lucide-react';
import { cn } from '@/lib/utils';

export const TaskFilter = () => {
  const { t, language } = useTranslation();
  const { filters, setFilters, viewMode, setViewMode } = useTaskStore();
  const lang = language as 'ko' | 'en';

  return (
    <div className="space-y-3">
      {/* 검색 + 뷰 전환 */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('common.search')}
            value={filters.search}
            onChange={(e) => setFilters({ search: e.target.value })}
            className="pl-9 rounded-xl"
          />
        </div>

        {/* 뷰 모드 전환 */}
        <div className="flex rounded-xl border border-border">
          <Button
            variant="ghost"
            size="icon"
            className={cn('h-9 w-9 rounded-l-xl rounded-r-none', viewMode === 'list' && 'bg-muted')}
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={cn('h-9 w-9 rounded-r-xl rounded-l-none', viewMode === 'kanban' && 'bg-muted')}
            onClick={() => setViewMode('kanban')}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 필터 셀렉트 */}
      <div className="flex flex-wrap gap-2">
        {/* 카테고리 필터 */}
        <Select
          value={filters.category}
          onValueChange={(value) => setFilters({ category: value as TaskCategory | 'all' })}
        >
          <SelectTrigger className="w-auto min-w-[120px] rounded-xl h-8 text-xs">
            <SelectValue placeholder={t('tasks.categoryLabel')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{lang === 'ko' ? '전체 카테고리' : 'All Categories'}</SelectItem>
            {(Object.keys(CATEGORY_LABELS) as TaskCategory[]).map((cat) => (
              <SelectItem key={cat} value={cat}>
                {CATEGORY_LABELS[cat][lang]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* 우선순위 필터 */}
        <Select
          value={filters.priority}
          onValueChange={(value) => setFilters({ priority: value as TaskPriority | 'all' })}
        >
          <SelectTrigger className="w-auto min-w-[100px] rounded-xl h-8 text-xs">
            <SelectValue placeholder={t('tasks.priorityLabel')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{lang === 'ko' ? '전체 우선순위' : 'All Priorities'}</SelectItem>
            {(Object.keys(PRIORITY_LABELS) as TaskPriority[]).map((p) => (
              <SelectItem key={p} value={p}>
                {PRIORITY_LABELS[p][lang]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* 상태 필터 */}
        <Select
          value={filters.status}
          onValueChange={(value) => setFilters({ status: value as TaskStatus | 'all' })}
        >
          <SelectTrigger className="w-auto min-w-[100px] rounded-xl h-8 text-xs">
            <SelectValue placeholder={lang === 'ko' ? '상태' : 'Status'} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{lang === 'ko' ? '전체 상태' : 'All Status'}</SelectItem>
            <SelectItem value="todo">{t('tasks.todo')}</SelectItem>
            <SelectItem value="in_progress">{t('tasks.inProgress')}</SelectItem>
            <SelectItem value="completed">{t('tasks.completed')}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

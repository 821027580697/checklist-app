// 캘린더 — 할 일/습관 완전 연동
'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useTaskStore } from '@/stores/taskStore';
import { useHabitStore } from '@/stores/habitStore';
import { useTasks } from '@/hooks/useTasks';
import { useTranslation } from '@/hooks/useTranslation';
import { PRIORITY_COLORS, CATEGORY_LABELS, PRIORITY_LABELS } from '@/types/task';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { ko, enUS } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Check, ListTodo, Repeat } from 'lucide-react';

const FullCalendar = dynamic(
  () => import('@fullcalendar/react').then((mod) => mod.default),
  { ssr: false },
);

import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';

export default function CalendarPage() {
  const { t, language } = useTranslation();
  const tasks = useTaskStore((state) => state.tasks);
  const habits = useHabitStore((state) => state.habits);
  const { toggleComplete } = useTasks();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const lang = language as 'ko' | 'en';

  const taskEvents = useMemo(() => {
    return tasks
      .filter((task) => task.dueDate)
      .map((task) => {
        const isCompleted = task.status === 'completed';
        return {
          id: task.id,
          title: task.title,
          date: task.dueDate!.toDate().toISOString().split('T')[0],
          backgroundColor: isCompleted ? '#34C759' : PRIORITY_COLORS[task.priority],
          borderColor: isCompleted ? '#34C759' : PRIORITY_COLORS[task.priority],
          textColor: '#fff',
          extendedProps: {
            type: 'task' as const,
            category: CATEGORY_LABELS[task.category][lang],
            status: task.status,
            priority: task.priority,
            taskId: task.id,
          },
        };
      });
  }, [tasks, lang]);

  const habitEvents = useMemo(() => {
    return habits
      .filter((h) => h.isActive && Array.isArray(h.completedDates))
      .flatMap((habit) =>
        (habit.completedDates || []).map((date) => ({
          id: `habit-${habit.id}-${date}`,
          title: `${habit.icon} ${habit.title}`,
          date,
          backgroundColor: habit.color || '#34C759',
          borderColor: habit.color || '#34C759',
          textColor: '#fff',
          display: 'list-item' as const,
          extendedProps: {
            type: 'habit' as const,
          },
        })),
      );
  }, [habits]);

  const allEvents = [...taskEvents, ...habitEvents];

  // 선택된 날짜의 할 일과 습관 분리
  const selectedDateTasks = selectedDate
    ? tasks.filter((t) => {
        if (!t.dueDate) return false;
        try {
          return t.dueDate.toDate().toISOString().split('T')[0] === selectedDate;
        } catch {
          return false;
        }
      })
    : [];

  const selectedDateHabitEvents = selectedDate
    ? habitEvents.filter((e) => e.date === selectedDate)
    : [];

  // 날짜별 할 일 수 요약
  const dateTaskCounts = useMemo(() => {
    const counts: Record<string, { total: number; completed: number }> = {};
    tasks.forEach((task) => {
      if (!task.dueDate) return;
      try {
        const dateStr = task.dueDate.toDate().toISOString().split('T')[0];
        if (!counts[dateStr]) counts[dateStr] = { total: 0, completed: 0 };
        counts[dateStr].total++;
        if (task.status === 'completed') counts[dateStr].completed++;
      } catch {
        // ignore
      }
    });
    return counts;
  }, [tasks]);

  return (
    <div className="space-y-5">
      {/* 페이지 헤더 */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <h1 className="text-[28px] font-bold tracking-tight">{t('calendar.title')}</h1>
        <p className="text-[13px] text-muted-foreground mt-0.5">
          {lang === 'ko'
            ? `할 일 ${tasks.filter((t) => t.dueDate).length}개 · 습관 ${habits.filter((h) => h.isActive).length}개 표시됨`
            : `${tasks.filter((t) => t.dueDate).length} tasks · ${habits.filter((h) => h.isActive).length} habits shown`}
        </p>
      </motion.div>

      {/* 캘린더 */}
      <div className="apple-card overflow-hidden p-3 md:p-5">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
          initialView="dayGridMonth"
          locale={language === 'ko' ? 'ko' : 'en'}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,listWeek',
          }}
          events={allEvents}
          dateClick={(info) => setSelectedDate(info.dateStr)}
          height="auto"
          dayMaxEvents={3}
          eventDisplay="block"
          eventClassNames="rounded-md text-xs cursor-pointer"
          buttonText={{
            today: t('calendar.today'),
            month: t('calendar.month'),
            week: t('calendar.week'),
            day: t('calendar.day'),
            list: 'List',
          }}
        />
      </div>

      {/* 범례 */}
      <div className="flex flex-wrap gap-4 text-[11px] text-muted-foreground">
        {[
          { color: '#34C759', label: lang === 'ko' ? '완료' : 'Done' },
          { color: PRIORITY_COLORS.urgent, label: lang === 'ko' ? '긴급' : 'Urgent' },
          { color: PRIORITY_COLORS.high, label: lang === 'ko' ? '높음' : 'High' },
          { color: PRIORITY_COLORS.medium, label: lang === 'ko' ? '보통' : 'Medium' },
          { color: PRIORITY_COLORS.low, label: lang === 'ko' ? '낮음' : 'Low' },
        ].map(({ color, label }) => (
          <span key={label} className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
            {label}
          </span>
        ))}
      </div>

      {/* 날짜 클릭 시 상세 모달 */}
      <Dialog open={!!selectedDate} onOpenChange={() => setSelectedDate(null)}>
        <DialogContent className="sm:max-w-[400px] rounded-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[17px]">
              {selectedDate &&
                format(new Date(selectedDate), language === 'ko' ? 'yyyy년 M월 d일' : 'MMM d, yyyy', {
                  locale: language === 'ko' ? ko : enUS,
                })}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* 해당 날짜 할 일 */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <ListTodo className="h-4 w-4 text-[#007AFF]" />
                <h4 className="text-[13px] font-semibold">
                  {lang === 'ko' ? '할 일' : 'Tasks'}
                  {selectedDateTasks.length > 0 && (
                    <span className="text-muted-foreground font-normal ml-1">
                      ({selectedDateTasks.filter((t) => t.status === 'completed').length}/{selectedDateTasks.length})
                    </span>
                  )}
                </h4>
              </div>

              {selectedDateTasks.length === 0 ? (
                <p className="text-[12px] text-muted-foreground py-3 text-center">
                  {lang === 'ko' ? '이 날짜에 할 일이 없습니다' : 'No tasks on this date'}
                </p>
              ) : (
                <div className="space-y-1.5">
                  {selectedDateTasks.map((task) => {
                    const isCompleted = task.status === 'completed';
                    return (
                      <div
                        key={task.id}
                        className={cn(
                          'flex items-center gap-3 rounded-xl p-2.5 transition-all hover:bg-secondary/50',
                          isCompleted && 'opacity-50',
                        )}
                      >
                        <Checkbox
                          checked={isCompleted}
                          onCheckedChange={() => toggleComplete(task)}
                          className={cn(
                            'h-[16px] w-[16px] rounded-full border-[1.5px] shrink-0',
                            isCompleted && 'bg-[#34C759] border-[#34C759]',
                          )}
                        />
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            'text-[13px] font-medium truncate',
                            isCompleted && 'line-through text-muted-foreground',
                          )}>
                            {task.title}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: PRIORITY_COLORS[task.priority] }} />
                            <span className="text-[10px] text-muted-foreground">{CATEGORY_LABELS[task.category]?.[lang]}</span>
                            <span className="text-[10px] text-muted-foreground">· {PRIORITY_LABELS[task.priority]?.[lang]}</span>
                          </div>
                        </div>
                        {isCompleted && (
                          <Badge variant="secondary" className="text-[9px] h-4 px-1.5 rounded-md bg-[#34C759]/10 text-[#34C759]">
                            {lang === 'ko' ? '완료' : 'Done'}
                          </Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 해당 날짜 습관 체크 */}
            {selectedDateHabitEvents.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Repeat className="h-4 w-4 text-[#34C759]" />
                  <h4 className="text-[13px] font-semibold">
                    {lang === 'ko' ? '습관 체크' : 'Habit Checks'}
                    <span className="text-muted-foreground font-normal ml-1">({selectedDateHabitEvents.length})</span>
                  </h4>
                </div>
                <div className="space-y-1.5">
                  {selectedDateHabitEvents.map((event) => (
                    <div key={event.id} className="flex items-center gap-3 rounded-xl bg-[#34C759]/5 p-2.5">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#34C759]/10 shrink-0">
                        <Check className="h-3 w-3 text-[#34C759]" />
                      </div>
                      <span className="text-[13px] font-medium">{event.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedDateTasks.length === 0 && selectedDateHabitEvents.length === 0 && (
              <p className="text-[13px] text-muted-foreground py-6 text-center">
                {t('calendar.noEvents')}
              </p>
            )}
          </div>

          <Button
            variant="outline"
            className="w-full h-10 rounded-xl text-[14px] mt-1"
            onClick={() => setSelectedDate(null)}
          >
            {t('common.close')}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

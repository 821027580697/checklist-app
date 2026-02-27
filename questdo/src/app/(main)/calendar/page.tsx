// 캘린더 — Apple 스타일
'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useTaskStore } from '@/stores/taskStore';
import { useHabitStore } from '@/stores/habitStore';
import { useTranslation } from '@/hooks/useTranslation';
import { PRIORITY_COLORS, CATEGORY_LABELS } from '@/types/task';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { ko, enUS } from 'date-fns/locale';

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
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const lang = language as 'ko' | 'en';

  const taskEvents = useMemo(() => {
    return tasks
      .filter((task) => task.dueDate)
      .map((task) => ({
        id: task.id,
        title: task.title,
        date: task.dueDate!.toDate().toISOString().split('T')[0],
        backgroundColor: PRIORITY_COLORS[task.priority],
        borderColor: PRIORITY_COLORS[task.priority],
        textColor: '#fff',
        extendedProps: {
          type: 'task' as const,
          category: CATEGORY_LABELS[task.category][lang],
          status: task.status,
          priority: task.priority,
        },
      }));
  }, [tasks, lang]);

  const habitEvents = useMemo(() => {
    return habits
      .filter((h) => h.isActive && Array.isArray(h.completedDates))
      .flatMap((habit) =>
        (habit.completedDates || []).map((date) => ({
          id: `habit-${habit.id}-${date}`,
          title: `${habit.icon} ${habit.title}`,
          date,
          backgroundColor: '#34C759',
          borderColor: '#34C759',
          textColor: '#fff',
          display: 'list-item' as const,
          extendedProps: {
            type: 'habit' as const,
          },
        })),
      );
  }, [habits]);

  const allEvents = [...taskEvents, ...habitEvents];

  const selectedDateEvents = selectedDate
    ? allEvents.filter((e) => e.date === selectedDate)
    : [];

  return (
    <div className="space-y-5">
      {/* 페이지 헤더 */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <h1 className="text-[28px] font-bold tracking-tight">{t('calendar.title')}</h1>
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
          { color: PRIORITY_COLORS.urgent, label: lang === 'ko' ? '긴급' : 'Urgent' },
          { color: PRIORITY_COLORS.high, label: lang === 'ko' ? '높음' : 'High' },
          { color: PRIORITY_COLORS.medium, label: lang === 'ko' ? '보통' : 'Medium' },
          { color: PRIORITY_COLORS.low, label: lang === 'ko' ? '낮음' : 'Low' },
          { color: '#34C759', label: lang === 'ko' ? '습관' : 'Habit' },
        ].map(({ color, label }) => (
          <span key={label} className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
            {label}
          </span>
        ))}
      </div>

      {/* 날짜 클릭 시 이벤트 모달 */}
      <Dialog open={!!selectedDate} onOpenChange={() => setSelectedDate(null)}>
        <DialogContent className="sm:max-w-[360px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-[17px]">
              {selectedDate &&
                format(new Date(selectedDate), language === 'ko' ? 'yyyy년 M월 d일' : 'MMM d, yyyy', {
                  locale: language === 'ko' ? ko : enUS,
                })}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {selectedDateEvents.length === 0 ? (
              <p className="text-[13px] text-muted-foreground py-6 text-center">
                {t('calendar.noEvents')}
              </p>
            ) : (
              selectedDateEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center gap-3 rounded-xl bg-secondary/50 p-3"
                >
                  <div
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: event.backgroundColor }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium truncate">{event.title}</p>
                    {'category' in event.extendedProps && (
                      <p className="text-[11px] text-muted-foreground">
                        {event.extendedProps.category}
                      </p>
                    )}
                  </div>
                </div>
              ))
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

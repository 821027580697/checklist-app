// 캘린더 — 할 일/습관 완전 연동 (완료 항목 항시 표시)
'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useTaskStore } from '@/stores/taskStore';
import { useHabitStore } from '@/stores/habitStore';
import { useTasks } from '@/hooks/useTasks';
import { useHabits } from '@/hooks/useHabits';
import { useTranslation } from '@/hooks/useTranslation';
import { PRIORITY_COLORS, CATEGORY_LABELS, PRIORITY_LABELS } from '@/types/task';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { format, parseISO, isSameDay } from 'date-fns';
import { ko, enUS } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Check, ListTodo, Repeat, CheckCircle2, Circle, CalendarCheck } from 'lucide-react';

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
  // useHabits 호출하여 실시간 리스너 활성화
  const { toggleTodayCheck } = useHabits();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const lang = language as 'ko' | 'en';

  // ── 할 일 이벤트: 마감일 기준 (완료 포함, 항시 표시) ──
  const taskEvents = useMemo(() => {
    const events: Array<{
      id: string;
      title: string;
      date: string;
      backgroundColor: string;
      borderColor: string;
      textColor: string;
      extendedProps: {
        type: 'task';
        category: string;
        status: string;
        priority: string;
        taskId: string;
        isCompleted: boolean;
      };
    }> = [];

    tasks.forEach((task) => {
      // 마감일이 있는 할 일 → 마감일에 표시
      if (task.dueDate) {
        try {
          const isCompleted = task.status === 'completed';
          events.push({
            id: task.id,
            title: isCompleted ? `✓ ${task.title}` : task.title,
            date: task.dueDate.toDate().toISOString().split('T')[0],
            backgroundColor: isCompleted ? '#34C759' : PRIORITY_COLORS[task.priority],
            borderColor: isCompleted ? '#34C759' : PRIORITY_COLORS[task.priority],
            textColor: '#fff',
            extendedProps: {
              type: 'task',
              category: CATEGORY_LABELS[task.category][lang],
              status: task.status,
              priority: task.priority,
              taskId: task.id,
              isCompleted,
            },
          });
        } catch {
          // 날짜 파싱 실패 시 무시
        }
      }

      // 완료일이 마감일과 다른 경우 → 완료일에도 표시
      if (task.status === 'completed' && task.completedAt) {
        try {
          const completedDate = task.completedAt.toDate().toISOString().split('T')[0];
          const dueDate = task.dueDate?.toDate().toISOString().split('T')[0];
          if (completedDate !== dueDate) {
            events.push({
              id: `${task.id}-completed`,
              title: `✓ ${task.title}`,
              date: completedDate,
              backgroundColor: '#34C759',
              borderColor: '#34C759',
              textColor: '#fff',
              extendedProps: {
                type: 'task',
                category: CATEGORY_LABELS[task.category][lang],
                status: 'completed',
                priority: task.priority,
                taskId: task.id,
                isCompleted: true,
              },
            });
          }
        } catch {
          // 무시
        }
      }
    });

    return events;
  }, [tasks, lang]);

  // ── 습관 이벤트: 완료된 날짜에 표시 ──
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
            habitId: habit.id,
            isCompleted: true,
          },
        })),
      );
  }, [habits]);

  const allEvents = [...taskEvents, ...habitEvents];

  // ── 선택된 날짜의 할 일 ──
  const selectedDateTasks = selectedDate
    ? tasks.filter((task) => {
        // 마감일이 선택된 날짜인 것
        if (task.dueDate) {
          try {
            if (task.dueDate.toDate().toISOString().split('T')[0] === selectedDate) return true;
          } catch { /* ignore */ }
        }
        // 완료일이 선택된 날짜인 것 (마감일과 다를 때)
        if (task.status === 'completed' && task.completedAt) {
          try {
            if (task.completedAt.toDate().toISOString().split('T')[0] === selectedDate) return true;
          } catch { /* ignore */ }
        }
        return false;
      })
    : [];

  // ── 선택된 날짜의 습관 (완료 + 미완료) ──
  const selectedDateHabitInfo = useMemo(() => {
    if (!selectedDate) return { checked: [] as typeof habits, unchecked: [] as typeof habits };

    const selDate = parseISO(selectedDate);
    const dayOfWeek = selDate.getDay();
    const isToday = isSameDay(selDate, new Date());
    const isPast = selDate < new Date() && !isToday;

    // 해당 날짜에 활성화된 습관 필터링
    const activeForDate = habits.filter((h) => {
      if (!h.isActive) return false;
      if (h.frequency.type === 'daily') return true;
      if (h.frequency.type === 'custom') {
        return h.frequency.daysOfWeek?.includes(dayOfWeek) || false;
      }
      return true; // weekly
    });

    const checked = activeForDate.filter((h) =>
      (h.completedDates || []).includes(selectedDate),
    );
    const unchecked = activeForDate.filter(
      (h) => !(h.completedDates || []).includes(selectedDate),
    );

    return { checked, unchecked, isToday, isPast };
  }, [selectedDate, habits]);

  // ── 통계 ──
  const totalTasksWithDate = tasks.filter((t) => t.dueDate).length;
  const completedTasks = tasks.filter((t) => t.status === 'completed').length;
  const activeHabitsCount = habits.filter((h) => h.isActive).length;

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
            ? `할 일 ${totalTasksWithDate}개 (완료 ${completedTasks}개) · 습관 ${activeHabitsCount}개`
            : `${totalTasksWithDate} tasks (${completedTasks} done) · ${activeHabitsCount} habits`}
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
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#AF52DE]" />
          {lang === 'ko' ? '습관' : 'Habit'}
        </span>
      </div>

      {/* 날짜 클릭 시 상세 모달 */}
      <Dialog open={!!selectedDate} onOpenChange={() => setSelectedDate(null)}>
        <DialogContent className="sm:max-w-[420px] rounded-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[17px] flex items-center gap-2">
              <CalendarCheck className="h-5 w-5 text-primary" />
              {selectedDate &&
                format(parseISO(selectedDate), language === 'ko' ? 'yyyy년 M월 d일' : 'MMM d, yyyy', {
                  locale: language === 'ko' ? ko : enUS,
                })}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            {/* ── 할 일 섹션 ── */}
            <div>
              <div className="flex items-center gap-2 mb-2.5">
                <ListTodo className="h-4 w-4 text-[#007AFF]" />
                <h4 className="text-[13px] font-semibold">
                  {lang === 'ko' ? '할 일' : 'Tasks'}
                </h4>
                {selectedDateTasks.length > 0 && (
                  <Badge variant="secondary" className="text-[10px] h-5 px-1.5 rounded-md">
                    {selectedDateTasks.filter((t) => t.status === 'completed').length}/{selectedDateTasks.length}
                  </Badge>
                )}
              </div>

              {selectedDateTasks.length === 0 ? (
                <p className="text-[12px] text-muted-foreground py-3 text-center rounded-xl bg-secondary/30">
                  {lang === 'ko' ? '이 날짜에 할 일이 없습니다' : 'No tasks on this date'}
                </p>
              ) : (
                <div className="space-y-1.5">
                  <AnimatePresence>
                    {selectedDateTasks.map((task) => {
                      const isCompleted = task.status === 'completed';
                      return (
                        <motion.div
                          key={task.id}
                          layout
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          className={cn(
                            'flex items-center gap-3 rounded-xl p-2.5 transition-all hover:bg-secondary/50',
                            isCompleted && 'bg-[#34C759]/5',
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
                            <Badge variant="secondary" className="text-[9px] h-4 px-1.5 rounded-md bg-[#34C759]/10 text-[#34C759] shrink-0">
                              {lang === 'ko' ? '완료' : 'Done'}
                            </Badge>
                          )}
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* ── 습관 섹션 ── */}
            {(selectedDateHabitInfo.checked.length > 0 || selectedDateHabitInfo.unchecked.length > 0) && (
              <div>
                <div className="flex items-center gap-2 mb-2.5">
                  <Repeat className="h-4 w-4 text-[#34C759]" />
                  <h4 className="text-[13px] font-semibold">
                    {lang === 'ko' ? '습관' : 'Habits'}
                  </h4>
                  <Badge variant="secondary" className="text-[10px] h-5 px-1.5 rounded-md">
                    {selectedDateHabitInfo.checked.length}/{selectedDateHabitInfo.checked.length + selectedDateHabitInfo.unchecked.length}
                  </Badge>
                </div>

                <div className="space-y-1.5">
                  {/* 완료된 습관 */}
                  {selectedDateHabitInfo.checked.map((habit) => (
                    <div
                      key={habit.id}
                      className="flex items-center gap-3 rounded-xl bg-[#34C759]/5 p-2.5"
                    >
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#34C759]/15 shrink-0">
                        <CheckCircle2 className="h-3.5 w-3.5 text-[#34C759]" />
                      </div>
                      <span className="text-[13px] font-medium flex-1">
                        {habit.icon} {habit.title}
                      </span>
                      <Badge variant="secondary" className="text-[9px] h-4 px-1.5 rounded-md bg-[#34C759]/10 text-[#34C759] shrink-0">
                        {lang === 'ko' ? '완료' : 'Done'}
                      </Badge>
                    </div>
                  ))}

                  {/* 미완료 습관 */}
                  {selectedDateHabitInfo.unchecked.map((habit) => (
                    <div
                      key={habit.id}
                      className="flex items-center gap-3 rounded-xl p-2.5 hover:bg-secondary/50 transition-all"
                    >
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary shrink-0">
                        <Circle className="h-3.5 w-3.5 text-muted-foreground/40" />
                      </div>
                      <span className="text-[13px] font-medium text-muted-foreground flex-1">
                        {habit.icon} {habit.title}
                      </span>
                      {selectedDateHabitInfo.isToday && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-[11px] h-6 rounded-lg text-primary font-medium px-2"
                          onClick={() => toggleTodayCheck(habit)}
                        >
                          {lang === 'ko' ? '체크' : 'Check'}
                        </Button>
                      )}
                      {selectedDateHabitInfo.isPast && (
                        <Badge variant="secondary" className="text-[9px] h-4 px-1.5 rounded-md text-muted-foreground shrink-0">
                          {lang === 'ko' ? '미완료' : 'Missed'}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedDateTasks.length === 0 &&
              selectedDateHabitInfo.checked.length === 0 &&
              selectedDateHabitInfo.unchecked.length === 0 && (
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

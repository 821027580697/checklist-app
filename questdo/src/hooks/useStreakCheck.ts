// 스트릭 체크 훅 — 날짜 기반 1일 1회 카운트 + 미완료 시 리셋 (MongoDB 기반)
'use client';

import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { useTaskStore } from '@/stores/taskStore';
import { useHabitStore } from '@/stores/habitStore';
import { useAuthStore } from '@/stores/authStore';
import { userApi } from '@/lib/api/client';
import { isSameDay, format, subDays } from 'date-fns';

const CHEER_MESSAGES_KO = [
  '대단해요! 오늘도 완벽한 하루! 🎉',
  '꾸준함이 곧 실력! 잘하고 있어요 💪',
  '오늘도 목표 달성! 내일도 함께해요 🌟',
  '멋져요! 연속 달성 중! 🔥',
  '완벽한 하루를 보냈네요! ✨',
  '포기하지 않는 당신이 멋져요! 🏆',
  '습관이 쌓이면 인생이 바뀌어요! 🚀',
  '오늘의 노력이 내일의 나를 만들어요! 💎',
  '짝짝짝! 스트릭이 계속되고 있어요! 👏',
  '빛나는 하루! 내일도 빛나세요! ⭐',
];

const CHEER_MESSAGES_EN = [
  "Amazing! Another perfect day! 🎉",
  "Consistency is key! You're doing great 💪",
  "Goal achieved today! Let's keep it up 🌟",
  "Awesome! Streak is going strong! 🔥",
  "You had a perfect day! ✨",
  "Your persistence is inspiring! 🏆",
  "Building habits changes lives! 🚀",
  "Today's effort builds tomorrow's you! 💎",
  "Bravo! The streak continues! 👏",
  "A shining day! Shine on tomorrow! ⭐",
];

export interface StreakCheckResult {
  tasksAllDone: boolean;
  habitsAllDone: boolean;
  bothComplete: boolean;
  showCelebration: boolean;
  cheerMessage: string;
  currentStreak: number;
}

const STREAK_DATE_KEY = 'questdo_last_streak_date';
const STREAK_COUNT_KEY = 'questdo_current_streak';

function getLocalStreakDate(): string {
  if (typeof window === 'undefined') return '';
  try { return localStorage.getItem(STREAK_DATE_KEY) || ''; } catch { return ''; }
}

function setLocalStreakDate(date: string) {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(STREAK_DATE_KEY, date); } catch { /* ignore */ }
}

function setLocalStreakCount(count: number) {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(STREAK_COUNT_KEY, String(count)); } catch { /* ignore */ }
}

export const useStreakCheck = (lang: 'ko' | 'en' = 'ko'): StreakCheckResult => {
  const tasks = useTaskStore((s) => s.tasks);
  const isFetchedTasks = useTaskStore((s) => s.isFetched);
  const habits = useHabitStore((s) => s.habits);
  const isFetchedHabits = useHabitStore((s) => s.isFetched);
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const [showCelebration, setShowCelebration] = useState(false);
  const [cheerMessage, setCheerMessage] = useState('');
  const isBusyRef = useRef(false);
  const alreadyIncrementedTodayRef = useRef(false);

  const todayStr = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);
  const today = useMemo(() => new Date(), []);

  useEffect(() => {
    const localLastDate = getLocalStreakDate();
    const serverLastDate = user?.stats?.lastStreakDate || '';
    if (localLastDate === todayStr || serverLastDate === todayStr) {
      alreadyIncrementedTodayRef.current = true;
    }
  }, [user?.stats?.lastStreakDate, todayStr]);

  const todayTasksStatus = useMemo(() => {
    if (!isFetchedTasks) return { total: 0, completed: 0, allDone: false };
    const todayTasks = tasks.filter((task) => {
      if (!task.dueDate) return false;
      try { return isSameDay(new Date(task.dueDate), today); } catch { return false; }
    });
    const completed = todayTasks.filter((t) => t.status === 'completed').length;
    return { total: todayTasks.length, completed, allDone: todayTasks.length > 0 && completed === todayTasks.length };
  }, [tasks, isFetchedTasks, today]);

  const todayHabitsStatus = useMemo(() => {
    if (!isFetchedHabits) return { total: 0, checked: 0, allDone: false };
    const todayDayOfWeek = today.getDay();
    const todayHabits = habits.filter((h) => {
      if (!h.isActive) return false;
      if (h.frequency.type === 'daily') return true;
      if (h.frequency.type === 'custom') return h.frequency.daysOfWeek?.includes(todayDayOfWeek) || false;
      return true;
    });
    const checked = todayHabits.filter((h) => (h.completedDates || []).includes(todayStr)).length;
    return { total: todayHabits.length, checked, allDone: todayHabits.length > 0 && checked === todayHabits.length };
  }, [habits, isFetchedHabits, today, todayStr]);

  const bothComplete = useMemo(() => {
    const hasTasks = todayTasksStatus.total > 0;
    const hasHabits = todayHabitsStatus.total > 0;
    if (!hasTasks && !hasHabits) return false;
    const tasksOk = !hasTasks || todayTasksStatus.allDone;
    const habitsOk = !hasHabits || todayHabitsStatus.allDone;
    return tasksOk && habitsOk;
  }, [todayTasksStatus, todayHabitsStatus]);

  const processStreak = useCallback(async () => {
    if (!user) return;
    if (!isFetchedTasks || !isFetchedHabits) return;
    if (isBusyRef.current || alreadyIncrementedTodayRef.current || !bothComplete) return;

    isBusyRef.current = true;
    try {
      let serverLastStreakDate = user.stats?.lastStreakDate || '';
      let serverCurrentStreak = user.stats?.currentStreak || 0;
      let serverLongestStreak = user.stats?.longestStreak || 0;

      try {
        const freshUser = await userApi.me();
        const freshStats = (freshUser as Record<string, unknown>).stats as Record<string, unknown> | undefined;
        if (freshStats) {
          serverLastStreakDate = (freshStats.lastStreakDate as string) || '';
          serverCurrentStreak = (freshStats.currentStreak as number) || 0;
          serverLongestStreak = (freshStats.longestStreak as number) || 0;
        }
      } catch { /* use local data */ }

      const localLastDate = getLocalStreakDate();
      if (serverLastStreakDate === todayStr || localLastDate === todayStr) {
        alreadyIncrementedTodayRef.current = true;
        return;
      }

      alreadyIncrementedTodayRef.current = true;
      const yesterdayStr = format(subDays(today, 1), 'yyyy-MM-dd');
      const isConsecutive = serverLastStreakDate === yesterdayStr;
      const newStreak = isConsecutive ? serverCurrentStreak + 1 : 1;
      const newLongest = Math.max(newStreak, serverLongestStreak);

      const messages = lang === 'ko' ? CHEER_MESSAGES_KO : CHEER_MESSAGES_EN;
      setCheerMessage(messages[Math.floor(Math.random() * messages.length)]);
      setShowCelebration(true);

      await userApi.update({
        'stats.currentStreak': newStreak,
        'stats.longestStreak': newLongest,
        'stats.lastStreakDate': todayStr,
      });

      setLocalStreakDate(todayStr);
      setLocalStreakCount(newStreak);

      setUser({
        ...user,
        stats: { ...user.stats, currentStreak: newStreak, longestStreak: newLongest, lastStreakDate: todayStr },
      });

      setTimeout(() => setShowCelebration(false), 4000);
    } finally {
      isBusyRef.current = false;
    }
  }, [user, isFetchedTasks, isFetchedHabits, bothComplete, todayStr, today, lang, setUser]);

  useEffect(() => {
    if (!user || !isFetchedTasks || !isFetchedHabits) return;
    if (alreadyIncrementedTodayRef.current || !bothComplete) return;
    const timer = setTimeout(() => processStreak(), 300);
    return () => clearTimeout(timer);
  }, [processStreak, user, isFetchedTasks, isFetchedHabits, bothComplete]);

  // 오래된 스트릭 리셋
  useEffect(() => {
    if (!user || !isFetchedTasks || !isFetchedHabits) return;
    const checkStaleStreak = async () => {
      if (isBusyRef.current) return;
      const serverLastDate = user.stats?.lastStreakDate || '';
      if (!serverLastDate) return;
      const yesterdayStr = format(subDays(new Date(), 1), 'yyyy-MM-dd');
      if (serverLastDate !== todayStr && serverLastDate !== yesterdayStr) {
        if ((user.stats?.currentStreak || 0) > 0) {
          isBusyRef.current = true;
          try {
            await userApi.update({ 'stats.currentStreak': 0 });
            setUser({ ...user, stats: { ...user.stats, currentStreak: 0 } });
            setLocalStreakCount(0);
          } finally { isBusyRef.current = false; }
        }
      }
    };
    const timer = setTimeout(checkStaleStreak, 500);
    return () => clearTimeout(timer);
  }, [user?.uid, isFetchedTasks, isFetchedHabits]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    tasksAllDone: todayTasksStatus.allDone,
    habitsAllDone: todayHabitsStatus.allDone,
    bothComplete,
    showCelebration,
    cheerMessage,
    currentStreak: user?.stats?.currentStreak || 0,
  };
};

// 스트릭 체크 훅 — 날짜 기반 1일 1회 카운트 + 미완료 시 리셋
'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { useTaskStore } from '@/stores/taskStore';
import { useHabitStore } from '@/stores/habitStore';
import { useAuthStore } from '@/stores/authStore';
import { updateDocument } from '@/lib/firebase/firestore';
import { isFirebaseConfigured } from '@/lib/firebase/config';
import { isSameDay, format, subDays, parseISO } from 'date-fns';

// 응원 메시지
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

export const useStreakCheck = (lang: 'ko' | 'en' = 'ko'): StreakCheckResult => {
  const tasks = useTaskStore((s) => s.tasks);
  const isFetchedTasks = useTaskStore((s) => s.isFetched);
  const habits = useHabitStore((s) => s.habits);
  const isFetchedHabits = useHabitStore((s) => s.isFetched);
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const [showCelebration, setShowCelebration] = useState(false);
  const [cheerMessage, setCheerMessage] = useState('');
  const processingRef = useRef(false);

  const today = useMemo(() => new Date(), []);
  const todayStr = format(today, 'yyyy-MM-dd');

  // 오늘 할 일 완료 여부
  const todayTasksStatus = useMemo(() => {
    if (!isFetchedTasks) return { total: 0, completed: 0, allDone: false };

    const todayTasks = tasks.filter((task) => {
      if (!task.dueDate) return false;
      try {
        return isSameDay(task.dueDate.toDate(), today);
      } catch {
        return false;
      }
    });

    const completed = todayTasks.filter((t) => t.status === 'completed').length;
    return {
      total: todayTasks.length,
      completed,
      allDone: todayTasks.length > 0 && completed === todayTasks.length,
    };
  }, [tasks, isFetchedTasks, today]);

  // 오늘 습관 완료 여부
  const todayHabitsStatus = useMemo(() => {
    if (!isFetchedHabits) return { total: 0, checked: 0, allDone: false };

    const todayDayOfWeek = today.getDay();
    const todayHabits = habits.filter((h) => {
      if (!h.isActive) return false;
      if (h.frequency.type === 'daily') return true;
      if (h.frequency.type === 'custom') {
        return h.frequency.daysOfWeek?.includes(todayDayOfWeek) || false;
      }
      return true;
    });

    const checked = todayHabits.filter((h) =>
      (h.completedDates || []).includes(todayStr),
    ).length;

    return {
      total: todayHabits.length,
      checked,
      allDone: todayHabits.length > 0 && checked === todayHabits.length,
    };
  }, [habits, isFetchedHabits, today, todayStr]);

  // 할 일 OR 습관 중 하나라도 있고, 있는 것 모두 100% 완료되었을 때 bothComplete
  const bothComplete = useMemo(() => {
    const hasTasks = todayTasksStatus.total > 0;
    const hasHabits = todayHabitsStatus.total > 0;

    if (!hasTasks && !hasHabits) return false;

    const tasksOk = !hasTasks || todayTasksStatus.allDone;
    const habitsOk = !hasHabits || todayHabitsStatus.allDone;

    return tasksOk && habitsOk;
  }, [todayTasksStatus, todayHabitsStatus]);

  const currentStreak = user?.stats?.currentStreak || 0;
  const lastStreakDate = user?.stats?.lastStreakDate || '';

  // 스트릭 업데이트 — 날짜 기반 1일 1회만, 어제 미달성 시 리셋
  useEffect(() => {
    if (!user || !isFirebaseConfigured) return;
    if (!isFetchedTasks || !isFetchedHabits) return;
    if (processingRef.current) return;

    // ── 1) 어제 미달성 시 스트릭 리셋 체크 ──
    const yesterdayStr = format(subDays(today, 1), 'yyyy-MM-dd');

    // lastStreakDate가 어제보다 이전이면 (어제 달성하지 못했으면) 스트릭 리셋
    if (lastStreakDate && lastStreakDate !== todayStr && lastStreakDate !== yesterdayStr) {
      // 어제도, 오늘도 아닌 이전 날짜 → 중간에 빠진 날이 있으므로 리셋
      if (currentStreak > 0) {
        processingRef.current = true;
        updateDocument('users', user.uid, {
          'stats.currentStreak': 0,
        });
        setUser({
          ...user,
          stats: {
            ...user.stats,
            currentStreak: 0,
          },
        });
        processingRef.current = false;
        return;
      }
    }

    // ── 2) 오늘 이미 카운트했으면 스킵 ──
    if (lastStreakDate === todayStr) return;

    // ── 3) 오늘 100% 완료 시 +1 ──
    if (bothComplete) {
      processingRef.current = true;

      // 응원 메시지 선택
      const messages = lang === 'ko' ? CHEER_MESSAGES_KO : CHEER_MESSAGES_EN;
      const msg = messages[Math.floor(Math.random() * messages.length)];
      setCheerMessage(msg);
      setShowCelebration(true);

      // 스트릭 +1 (어제가 마지막 날짜이면 연속, 아니면 1부터 시작)
      const isConsecutive = lastStreakDate === yesterdayStr || lastStreakDate === '';
      const newStreak = isConsecutive ? currentStreak + 1 : 1;
      const newLongest = Math.max(newStreak, user.stats?.longestStreak || 0);

      // Firestore 업데이트 (lastStreakDate로 중복 방지)
      updateDocument('users', user.uid, {
        'stats.currentStreak': newStreak,
        'stats.longestStreak': newLongest,
        'stats.lastStreakDate': todayStr,
      });

      // 로컬 상태 업데이트
      setUser({
        ...user,
        stats: {
          ...user.stats,
          currentStreak: newStreak,
          longestStreak: newLongest,
          lastStreakDate: todayStr,
        },
      });

      // 축하 애니메이션 타이머
      setTimeout(() => {
        setShowCelebration(false);
        processingRef.current = false;
      }, 4000);
    }
  }, [bothComplete, user?.uid, isFetchedTasks, isFetchedHabits, todayStr]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    tasksAllDone: todayTasksStatus.allDone,
    habitsAllDone: todayHabitsStatus.allDone,
    bothComplete,
    showCelebration,
    cheerMessage,
    currentStreak: user?.stats?.currentStreak || 0,
  };
};

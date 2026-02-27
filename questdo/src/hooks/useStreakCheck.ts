// 스트릭 체크 훅 — 날짜 기반 1일 1회 카운트 + 미완료 시 리셋
// ✅ 고도화: localStorage 백업, 엄격한 중복 방지, 마운트 시 재실행 방지
'use client';

import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { useTaskStore } from '@/stores/taskStore';
import { useHabitStore } from '@/stores/habitStore';
import { useAuthStore } from '@/stores/authStore';
import { updateDocument, getDocument } from '@/lib/firebase/firestore';
import { isFirebaseConfigured } from '@/lib/firebase/config';
import { isSameDay, format, subDays } from 'date-fns';

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

// localStorage 키
const STREAK_DATE_KEY = 'questdo_last_streak_date';
const STREAK_COUNT_KEY = 'questdo_current_streak';

// 로컬 스토리지에서 마지막 스트릭 날짜 읽기
function getLocalStreakDate(): string {
  if (typeof window === 'undefined') return '';
  try {
    return localStorage.getItem(STREAK_DATE_KEY) || '';
  } catch {
    return '';
  }
}

// 로컬 스토리지에 스트릭 날짜 저장
function setLocalStreakDate(date: string) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STREAK_DATE_KEY, date);
  } catch {
    // 무시
  }
}

// 로컬 스토리지에 스트릭 카운트 저장
function setLocalStreakCount(count: number) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STREAK_COUNT_KEY, String(count));
  } catch {
    // 무시
  }
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
  const hasProcessedRef = useRef(false); // 이 마운트에서 이미 처리했는지
  const isBusyRef = useRef(false); // 비동기 처리 중인지

  const todayStr = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);
  const today = useMemo(() => new Date(), []);

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

  // 할 일 OR 습관 중 하나라도 있고, 있는 것 모두 100% 완료
  const bothComplete = useMemo(() => {
    const hasTasks = todayTasksStatus.total > 0;
    const hasHabits = todayHabitsStatus.total > 0;

    if (!hasTasks && !hasHabits) return false;

    const tasksOk = !hasTasks || todayTasksStatus.allDone;
    const habitsOk = !hasHabits || todayHabitsStatus.allDone;

    return tasksOk && habitsOk;
  }, [todayTasksStatus, todayHabitsStatus]);

  const currentStreak = user?.stats?.currentStreak || 0;

  // 스트릭 업데이트 함수
  const processStreak = useCallback(async () => {
    if (!user || !isFirebaseConfigured) return;
    if (!isFetchedTasks || !isFetchedHabits) return;
    if (hasProcessedRef.current || isBusyRef.current) return;

    isBusyRef.current = true;

    try {
      // Firestore에서 최신 사용자 데이터 읽기 (로컬 상태가 오래될 수 있으므로)
      let serverLastStreakDate = user.stats?.lastStreakDate || '';
      let serverCurrentStreak = user.stats?.currentStreak || 0;
      let serverLongestStreak = user.stats?.longestStreak || 0;

      try {
        const { data: freshUser } = await getDocument('users', user.uid);
        if (freshUser) {
          const freshStats = (freshUser as Record<string, unknown>).stats as Record<string, unknown> | undefined;
          if (freshStats) {
            serverLastStreakDate = (freshStats.lastStreakDate as string) || '';
            serverCurrentStreak = (freshStats.currentStreak as number) || 0;
            serverLongestStreak = (freshStats.longestStreak as number) || 0;
          }
        }
      } catch {
        // Firestore 읽기 실패 시 로컬 데이터 사용
      }

      // localStorage도 확인 (이중 안전장치)
      const localLastDate = getLocalStreakDate();

      // 오늘 이미 처리했으면 스킵
      if (serverLastStreakDate === todayStr || localLastDate === todayStr) {
        hasProcessedRef.current = true;
        return;
      }

      const yesterdayStr = format(subDays(today, 1), 'yyyy-MM-dd');

      // 어제보다 이전이면 스트릭 리셋
      if (serverLastStreakDate && serverLastStreakDate !== yesterdayStr && serverLastStreakDate !== todayStr) {
        if (serverCurrentStreak > 0) {
          await updateDocument('users', user.uid, {
            'stats.currentStreak': 0,
          });
          setUser({
            ...user,
            stats: {
              ...user.stats,
              currentStreak: 0,
            },
          });
          setLocalStreakCount(0);
          // 리셋 후 100% 완료라면 새로 +1 처리
          serverCurrentStreak = 0;
        }
      }

      // 오늘 100% 완료 시 +1
      if (bothComplete) {
        hasProcessedRef.current = true;

        // 응원 메시지
        const messages = lang === 'ko' ? CHEER_MESSAGES_KO : CHEER_MESSAGES_EN;
        const msg = messages[Math.floor(Math.random() * messages.length)];
        setCheerMessage(msg);
        setShowCelebration(true);

        // 어제가 마지막이면 연속, 아니면 1부터
        const isConsecutive = serverLastStreakDate === yesterdayStr || serverLastStreakDate === '';
        const newStreak = isConsecutive ? serverCurrentStreak + 1 : 1;
        const newLongest = Math.max(newStreak, serverLongestStreak);

        // Firestore 업데이트
        await updateDocument('users', user.uid, {
          'stats.currentStreak': newStreak,
          'stats.longestStreak': newLongest,
          'stats.lastStreakDate': todayStr,
        });

        // localStorage에도 저장 (이중 안전장치)
        setLocalStreakDate(todayStr);
        setLocalStreakCount(newStreak);

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
        }, 4000);
      } else {
        hasProcessedRef.current = true;
      }
    } finally {
      isBusyRef.current = false;
    }
  }, [user, isFetchedTasks, isFetchedHabits, bothComplete, todayStr, today, lang, setUser]);

  // 스트릭 체크 실행 — 데이터가 준비되고 완료 상태가 변경될 때만
  useEffect(() => {
    if (!user || !isFirebaseConfigured) return;
    if (!isFetchedTasks || !isFetchedHabits) return;
    if (hasProcessedRef.current) return;

    // 데이터가 모두 로드된 후 약간의 지연을 두고 실행 (데이터 안정화 대기)
    const timer = setTimeout(() => {
      processStreak();
    }, 500);

    return () => clearTimeout(timer);
  }, [processStreak, user, isFetchedTasks, isFetchedHabits]);

  return {
    tasksAllDone: todayTasksStatus.allDone,
    habitsAllDone: todayHabitsStatus.allDone,
    bothComplete,
    showCelebration,
    cheerMessage,
    currentStreak: user?.stats?.currentStreak || 0,
  };
};

// 습관 CRUD 훅 — Firestore 실시간 리스너 기반
'use client';

import { useEffect, useCallback } from 'react';
import { useHabitStore } from '@/stores/habitStore';
import { useAuthStore } from '@/stores/authStore';
import { Habit } from '@/types/habit';
import {
  createDocument,
  updateDocument,
  deleteDocument,
  subscribeToCollection,
  where,
} from '@/lib/firebase/firestore';
import { isFirebaseConfigured } from '@/lib/firebase/config';
import { Timestamp, DocumentData } from 'firebase/firestore';
import { format } from 'date-fns';
import { toast } from 'sonner';

export const useHabits = () => {
  const habits = useHabitStore((s) => s.habits);
  const isLoading = useHabitStore((s) => s.isLoading);
  const setHabits = useHabitStore((s) => s.setHabits);
  const addHabit = useHabitStore((s) => s.addHabit);
  const updateHabit = useHabitStore((s) => s.updateHabit);
  const removeHabit = useHabitStore((s) => s.removeHabit);
  const setLoading = useHabitStore((s) => s.setLoading);
  const user = useAuthStore((s) => s.user);

  // 습관 생성
  const createHabit = useCallback(
    async (habitData: Omit<Habit, 'id' | 'userId' | 'streak' | 'longestStreak' | 'completedDates' | 'totalChecks' | 'createdAt' | 'updatedAt'>) => {
      if (!user) return;
      try {
        const { id, error } = await createDocument('habits', {
          ...habitData,
          userId: user.uid,
          streak: 0,
          longestStreak: 0,
          completedDates: [],
          totalChecks: 0,
        });
        if (error) throw error;
        if (id) {
          const newHabit = {
            ...habitData,
            id,
            userId: user.uid,
            streak: 0,
            longestStreak: 0,
            completedDates: [],
            totalChecks: 0,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
          } as Habit;
          addHabit(newHabit);
          toast.success('습관이 추가되었습니다');
        }
      } catch (error) {
        console.error('습관 생성 실패:', error);
        toast.error('습관 생성에 실패했습니다');
      }
    },
    [user, addHabit],
  );

  // 오늘 습관 체크/언체크 (낙관적 업데이트)
  const toggleTodayCheck = useCallback(
    async (habit: Habit) => {
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      const currentDates = habit.completedDates || [];
      const alreadyChecked = currentDates.includes(todayStr);

      let newDates: string[];
      let newTotalChecks: number;

      if (alreadyChecked) {
        newDates = currentDates.filter((d) => d !== todayStr);
        newTotalChecks = Math.max(0, (habit.totalChecks || 0) - 1);
      } else {
        newDates = [...currentDates, todayStr];
        newTotalChecks = (habit.totalChecks || 0) + 1;
      }

      const data: Partial<Habit> = {
        completedDates: newDates,
        totalChecks: newTotalChecks,
      };

      // 낙관적 업데이트
      updateHabit(habit.id, data);

      try {
        const { error } = await updateDocument('habits', habit.id, data);
        if (error) {
          updateHabit(habit.id, {
            completedDates: currentDates,
            totalChecks: habit.totalChecks,
          });
          throw error;
        }

        if (!alreadyChecked) {
          toast.success('습관 체크 완료! +5 XP');
        }
      } catch (error) {
        console.error('습관 체크 실패:', error);
        toast.error('습관 체크에 실패했습니다');
      }
    },
    [updateHabit],
  );

  // 습관 삭제 (낙관적 삭제)
  const deleteHabit = useCallback(
    async (habitId: string) => {
      const previousHabit = habits.find((h) => h.id === habitId);
      try {
        removeHabit(habitId);
        const { error } = await deleteDocument('habits', habitId);
        if (error) {
          if (previousHabit) {
            addHabit(previousHabit);
          }
          throw error;
        }
        toast.success('습관이 삭제되었습니다');
      } catch (error) {
        console.error('습관 삭제 실패:', error);
        toast.error('습관 삭제에 실패했습니다');
      }
    },
    [habits, removeHabit, addHabit],
  );

  // Firestore 실시간 리스너로 연동
  useEffect(() => {
    if (!user || !isFirebaseConfigured) {
      useHabitStore.getState().reset();
      return;
    }

    setLoading(true);

    const unsubscribe = subscribeToCollection(
      'habits',
      [where('userId', '==', user.uid)],
      (docs: DocumentData[]) => {
        const sorted = (docs as Habit[]).sort((a, b) => {
          const aTime = a.createdAt?.toMillis?.() || 0;
          const bTime = b.createdAt?.toMillis?.() || 0;
          return bTime - aTime;
        });
        setHabits(sorted);
        setLoading(false);
      },
    );

    return () => {
      unsubscribe();
    };
  }, [user?.uid]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    habits,
    isLoading,
    createHabit,
    toggleTodayCheck,
    deleteHabit,
  };
};

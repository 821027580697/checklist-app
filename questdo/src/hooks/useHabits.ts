// 습관 CRUD 훅
'use client';

import { useEffect, useCallback } from 'react';
import { useHabitStore } from '@/stores/habitStore';
import { useAuthStore } from '@/stores/authStore';
import { Habit } from '@/types/habit';
import {
  createDocument,
  updateDocument,
  deleteDocument,
  getDocuments,
  where,
  orderBy,
} from '@/lib/firebase/firestore';
import { Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import { toast } from 'sonner';

export const useHabits = () => {
  const { habits, setHabits, addHabit, updateHabit, removeHabit, setLoading, isLoading } = useHabitStore();
  const user = useAuthStore((state) => state.user);

  // 습관 목록 불러오기
  const fetchHabits = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await getDocuments('habits', [
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc'),
      ]);
      if (error) throw error;
      setHabits(data as Habit[]);
    } catch (error) {
      console.error('습관 목록 불러오기 실패:', error);
      toast.error('습관 목록을 불러오지 못했습니다');
    } finally {
      setLoading(false);
    }
  }, [user, setHabits, setLoading]);

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

  // 오늘 습관 체크/언체크
  const toggleTodayCheck = useCallback(
    async (habit: Habit) => {
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      const alreadyChecked = habit.completedDates.includes(todayStr);

      let newDates: string[];
      let newTotalChecks: number;

      if (alreadyChecked) {
        // 체크 해제
        newDates = habit.completedDates.filter((d) => d !== todayStr);
        newTotalChecks = habit.totalChecks - 1;
      } else {
        // 체크
        newDates = [...habit.completedDates, todayStr];
        newTotalChecks = habit.totalChecks + 1;
      }

      const data: Partial<Habit> = {
        completedDates: newDates,
        totalChecks: newTotalChecks,
      };

      try {
        const { error } = await updateDocument('habits', habit.id, data);
        if (error) throw error;
        updateHabit(habit.id, data);

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

  // 습관 삭제
  const deleteHabit = useCallback(
    async (habitId: string) => {
      try {
        const { error } = await deleteDocument('habits', habitId);
        if (error) throw error;
        removeHabit(habitId);
        toast.success('습관이 삭제되었습니다');
      } catch (error) {
        console.error('습관 삭제 실패:', error);
        toast.error('습관 삭제에 실패했습니다');
      }
    },
    [removeHabit],
  );

  // 초기 로드
  useEffect(() => {
    fetchHabits();
  }, [fetchHabits]);

  return {
    habits,
    isLoading,
    createHabit,
    toggleTodayCheck,
    deleteHabit,
    fetchHabits,
  };
};

// 습관 CRUD 훅 — MongoDB API 기반 + XP 정확한 ±
'use client';

import { useEffect, useCallback } from 'react';
import { useHabitStore } from '@/stores/habitStore';
import { useAuthStore } from '@/stores/authStore';
import { Habit } from '@/types/habit';
import { habitApi, userApi } from '@/lib/api/client';
import { format } from 'date-fns';
import { toast } from 'sonner';

const XP_BASE_HABIT = 5;

export const useHabits = () => {
  const habits = useHabitStore((s) => s.habits);
  const isLoading = useHabitStore((s) => s.isLoading);
  const isFetched = useHabitStore((s) => s.isFetched);
  const setHabits = useHabitStore((s) => s.setHabits);
  const addHabit = useHabitStore((s) => s.addHabit);
  const updateHabit = useHabitStore((s) => s.updateHabit);
  const removeHabit = useHabitStore((s) => s.removeHabit);
  const setLoading = useHabitStore((s) => s.setLoading);
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  // 습관 목록 가져오기
  const fetchHabits = useCallback(async () => {
    if (!user || isFetched) return;
    setLoading(true);
    try {
      const data = await habitApi.list();
      setHabits(data as unknown as Habit[]);
    } catch (err) {
      console.error('습관 불러오기 실패:', err);
      toast.error('습관을 불러오지 못했습니다');
    } finally {
      setLoading(false);
    }
  }, [user, isFetched, setHabits, setLoading]);

  // 습관 생성
  const createHabit = useCallback(
    async (habitData: Omit<Habit, 'id' | 'userId' | 'streak' | 'longestStreak' | 'completedDates' | 'totalChecks' | 'createdAt' | 'updatedAt'>) => {
      if (!user) return;
      try {
        const created = await habitApi.create(habitData as unknown as Record<string, unknown>);
        addHabit(created as unknown as Habit);
        toast.success('습관이 추가되었습니다');
      } catch (error) {
        console.error('습관 생성 실패:', error);
        toast.error('습관 생성에 실패했습니다');
      }
    },
    [user, addHabit],
  );

  // 오늘 습관 체크/언체크 + XP ± 처리
  const toggleTodayCheck = useCallback(
    async (habit: Habit) => {
      if (!user) return;

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

      const data: Partial<Habit> = { completedDates: newDates, totalChecks: newTotalChecks };
      updateHabit(habit.id, data);

      try {
        await habitApi.update(habit.id, data as unknown as Record<string, unknown>);

        const xpAmount = XP_BASE_HABIT;
        if (!alreadyChecked) {
          const newTotalXp = (user.totalXp || 0) + xpAmount;
          const newXp = (user.xp || 0) + xpAmount;
          const newTotalHabitChecks = (user.stats?.totalHabitChecks || 0) + 1;

          await userApi.update({
            totalXp: newTotalXp,
            xp: newXp,
            'stats.totalHabitChecks': newTotalHabitChecks,
          });

          setUser({
            ...user,
            totalXp: newTotalXp,
            xp: newXp,
            stats: { ...user.stats, totalHabitChecks: newTotalHabitChecks },
          });

          toast.success(`습관 체크 완료! +${xpAmount} XP`);
        } else {
          const newTotalXp = Math.max(0, (user.totalXp || 0) - xpAmount);
          const newXp = Math.max(0, (user.xp || 0) - xpAmount);
          const newTotalHabitChecks = Math.max(0, (user.stats?.totalHabitChecks || 0) - 1);

          await userApi.update({
            totalXp: newTotalXp,
            xp: newXp,
            'stats.totalHabitChecks': newTotalHabitChecks,
          });

          setUser({
            ...user,
            totalXp: newTotalXp,
            xp: newXp,
            stats: { ...user.stats, totalHabitChecks: newTotalHabitChecks },
          });

          toast.info(`습관 체크 취소 -${xpAmount} XP`);
        }
      } catch (error) {
        updateHabit(habit.id, { completedDates: currentDates, totalChecks: habit.totalChecks });
        console.error('습관 체크 실패:', error);
        toast.error('습관 체크에 실패했습니다');
      }
    },
    [user, updateHabit, setUser],
  );

  // 습관 삭제
  const deleteHabit = useCallback(
    async (habitId: string) => {
      const previousHabit = habits.find((h) => h.id === habitId);
      try {
        removeHabit(habitId);
        await habitApi.delete(habitId);
        toast.success('습관이 삭제되었습니다');
      } catch (error) {
        if (previousHabit) addHabit(previousHabit);
        console.error('습관 삭제 실패:', error);
        toast.error('습관 삭제에 실패했습니다');
      }
    },
    [habits, removeHabit, addHabit],
  );

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    if (!user) {
      useHabitStore.getState().reset();
      return;
    }
    fetchHabits();
  }, [user?.uid]); // eslint-disable-line react-hooks/exhaustive-deps

  return { habits, isLoading, createHabit, toggleTodayCheck, deleteHabit, fetchHabits };
};

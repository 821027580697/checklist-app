// 습관 상태 관리 (Zustand)
import { create } from 'zustand';
import { Habit } from '@/types/habit';

interface HabitState {
  // 상태
  habits: Habit[];
  isLoading: boolean;
  isFetched: boolean;

  // 액션
  setHabits: (habits: Habit[]) => void;
  addHabit: (habit: Habit) => void;
  updateHabit: (id: string, data: Partial<Habit>) => void;
  removeHabit: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setFetched: (fetched: boolean) => void;
  reset: () => void;

  // 계산된 값
  getActiveHabits: () => Habit[];
  getTodayHabits: () => Habit[];
}

export const useHabitStore = create<HabitState>((set, get) => ({
  habits: [],
  isLoading: false,
  isFetched: false,

  setHabits: (habits) => set({ habits, isFetched: true }),

  addHabit: (habit) =>
    set((state) => ({ habits: [habit, ...state.habits] })),

  updateHabit: (id, data) =>
    set((state) => ({
      habits: state.habits.map((h) => (h.id === id ? { ...h, ...data } : h)),
    })),

  removeHabit: (id) =>
    set((state) => ({
      habits: state.habits.filter((h) => h.id !== id),
    })),

  setLoading: (loading) => set({ isLoading: loading }),
  setFetched: (fetched) => set({ isFetched: fetched }),
  reset: () => set({ habits: [], isLoading: false, isFetched: false }),

  // 활성 습관만
  getActiveHabits: () => get().habits.filter((h) => h.isActive),

  // 오늘 체크해야 할 습관
  getTodayHabits: () => {
    const today = new Date().getDay(); // 0=일, 6=토
    return get().habits.filter((h) => {
      if (!h.isActive) return false;
      if (h.frequency.type === 'daily') return true;
      if (h.frequency.type === 'custom') {
        return h.frequency.daysOfWeek?.includes(today) || false;
      }
      return true; // weekly는 항상 표시
    });
  },
}));

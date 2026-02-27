// 할 일 상태 관리 (Zustand)
import { create } from 'zustand';
import { Task, TaskCategory, TaskPriority, TaskStatus } from '@/types/task';

interface TaskFilters {
  category: TaskCategory | 'all';
  priority: TaskPriority | 'all';
  status: TaskStatus | 'all';
  search: string;
}

interface TaskState {
  // 상태
  tasks: Task[];
  isLoading: boolean;
  isFetched: boolean; // 데이터 로드 완료 여부
  filters: TaskFilters;
  viewMode: 'list' | 'kanban';

  // 액션
  setTasks: (tasks: Task[]) => void;
  addTask: (task: Task) => void;
  updateTask: (id: string, data: Partial<Task>) => void;
  removeTask: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setFetched: (fetched: boolean) => void;
  setFilters: (filters: Partial<TaskFilters>) => void;
  setViewMode: (mode: 'list' | 'kanban') => void;
  reset: () => void;

  // 계산된 값
  getTodayTasks: () => Task[];
  getFilteredTasks: () => Task[];
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  isLoading: false,
  isFetched: false,
  filters: {
    category: 'all',
    priority: 'all',
    status: 'all',
    search: '',
  },
  viewMode: 'list',

  setTasks: (tasks) => set({ tasks, isFetched: true }),

  addTask: (task) => set((state) => ({ tasks: [task, ...state.tasks] })),

  updateTask: (id, data) =>
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...data } : t)),
    })),

  removeTask: (id) =>
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== id),
    })),

  setLoading: (loading) => set({ isLoading: loading }),
  setFetched: (fetched) => set({ isFetched: fetched }),

  setFilters: (filters) =>
    set((state) => ({
      filters: { ...state.filters, ...filters },
    })),

  setViewMode: (mode) => set({ viewMode: mode }),

  reset: () => set({ tasks: [], isLoading: false, isFetched: false }),

  // 오늘의 할 일
  getTodayTasks: () => {
    const { tasks } = get();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return tasks.filter((t) => {
      if (t.status === 'completed') return false;
      if (!t.dueDate) return false;
      try {
        const dueDate = new Date(t.dueDate);
        return dueDate >= today && dueDate < tomorrow;
      } catch {
        return false;
      }
    });
  },

  // 필터 적용된 할 일 목록
  getFilteredTasks: () => {
    const { tasks, filters } = get();
    return tasks.filter((t) => {
      if (filters.category !== 'all' && t.category !== filters.category) return false;
      if (filters.priority !== 'all' && t.priority !== filters.priority) return false;
      if (filters.status !== 'all' && t.status !== filters.status) return false;
      if (filters.search && !t.title.toLowerCase().includes(filters.search.toLowerCase())) return false;
      return true;
    });
  },
}));

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
  filters: TaskFilters;
  viewMode: 'list' | 'kanban';

  // 액션
  setTasks: (tasks: Task[]) => void;
  addTask: (task: Task) => void;
  updateTask: (id: string, data: Partial<Task>) => void;
  removeTask: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setFilters: (filters: Partial<TaskFilters>) => void;
  setViewMode: (mode: 'list' | 'kanban') => void;

  // 계산된 값
  getTodayTasks: () => Task[];
  getFilteredTasks: () => Task[];
}

export const useTaskStore = create<TaskState>((set, get) => ({
  // 초기 상태
  tasks: [],
  isLoading: false,
  filters: {
    category: 'all',
    priority: 'all',
    status: 'all',
    search: '',
  },
  viewMode: 'list',

  // 할 일 목록 전체 설정
  setTasks: (tasks) => set({ tasks }),

  // 할 일 추가
  addTask: (task) => set((state) => ({ tasks: [task, ...state.tasks] })),

  // 할 일 업데이트
  updateTask: (id, data) =>
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...data } : t)),
    })),

  // 할 일 삭제
  removeTask: (id) =>
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== id),
    })),

  // 로딩 상태
  setLoading: (loading) => set({ isLoading: loading }),

  // 필터 설정
  setFilters: (filters) =>
    set((state) => ({
      filters: { ...state.filters, ...filters },
    })),

  // 뷰 모드 설정
  setViewMode: (mode) => set({ viewMode: mode }),

  // 오늘의 할 일 (미완료)
  getTodayTasks: () => {
    const { tasks } = get();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return tasks.filter((t) => {
      if (t.status === 'completed') return false;
      if (!t.dueDate) return false;
      const dueDate = t.dueDate.toDate();
      return dueDate >= today && dueDate < tomorrow;
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

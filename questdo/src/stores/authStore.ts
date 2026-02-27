// 인증 상태 관리 (Zustand)
import { create } from 'zustand';
import { User } from '@/types/user';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  needsOnboarding: boolean;

  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setNeedsOnboarding: (needs: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  needsOnboarding: false,

  setUser: (user) =>
    set({
      user,
      isAuthenticated: !!user,
      isLoading: false,
    }),

  setLoading: (loading) =>
    set({ isLoading: loading }),

  setNeedsOnboarding: (needs) =>
    set({ needsOnboarding: needs }),

  logout: () =>
    set({
      user: null,
      isAuthenticated: false,
      needsOnboarding: false,
    }),
}));

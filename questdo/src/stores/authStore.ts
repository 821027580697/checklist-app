// 인증 상태 관리 (Zustand)
import { create } from 'zustand';
import { User } from '@/types/user';

interface AuthState {
  // 상태
  user: User | null;
  firebaseUid: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  needsOnboarding: boolean;

  // 액션
  setUser: (user: User | null) => void;
  setFirebaseUid: (uid: string | null) => void;
  setLoading: (loading: boolean) => void;
  setNeedsOnboarding: (needs: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  // 초기 상태
  user: null,
  firebaseUid: null,
  isLoading: true,
  isAuthenticated: false,
  needsOnboarding: false,

  // 사용자 정보 설정
  setUser: (user) =>
    set({
      user,
      isAuthenticated: !!user,
      isLoading: false,
    }),

  // Firebase UID 설정
  setFirebaseUid: (uid) =>
    set({ firebaseUid: uid }),

  // 로딩 상태 설정
  setLoading: (loading) =>
    set({ isLoading: loading }),

  // 온보딩 필요 여부 설정
  setNeedsOnboarding: (needs) =>
    set({ needsOnboarding: needs }),

  // 로그아웃
  logout: () =>
    set({
      user: null,
      firebaseUid: null,
      isAuthenticated: false,
      needsOnboarding: false,
    }),
}));

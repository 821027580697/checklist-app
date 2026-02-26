// UI 상태 관리 (Zustand) — 테마, 사이드바, 언어 등
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark' | 'system';
type Language = 'ko' | 'en';

interface UIState {
  // 상태
  theme: Theme;
  language: Language;
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;

  // 액션
  setTheme: (theme: Theme) => void;
  setLanguage: (language: Language) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebarCollapsed: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      // 초기 상태
      theme: 'system',
      language: 'ko',
      sidebarOpen: false,
      sidebarCollapsed: false,

      // 테마 변경
      setTheme: (theme) => set({ theme }),

      // 언어 변경
      setLanguage: (language) => set({ language }),

      // 사이드바 토글 (모바일)
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

      // 사이드바 열기/닫기
      setSidebarOpen: (open) => set({ sidebarOpen: open }),

      // 사이드바 접기/펼치기 (데스크탑)
      toggleSidebarCollapsed: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
    }),
    {
      name: 'questdo-ui', // localStorage 키
      partialize: (state) => ({
        theme: state.theme,
        language: state.language,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    },
  ),
);

// 습관(Habit) 관련 타입 정의
import { TaskCategory } from './task';

// 습관 빈도 타입
export type HabitFrequencyType = 'daily' | 'weekly' | 'custom';

// 습관 빈도 설정
export interface HabitFrequency {
  type: HabitFrequencyType;
  daysOfWeek: number[];
  timesPerWeek: number;
}

// 습관 메인 인터페이스
export interface Habit {
  id: string;
  userId: string;
  title: string;
  description: string;
  category: TaskCategory;
  icon: string;
  color: string;
  frequency: HabitFrequency;
  reminderTime: string | null;
  streak: number;
  longestStreak: number;
  completedDates: string[];
  totalChecks: number;
  isActive: boolean;
  createdAt: string;  // ISO 문자열
  updatedAt: string;
}

// 습관 기본 아이콘 목록
export const HABIT_ICONS = [
  '💧', '🏃', '📖', '🧘', '💪', '🍎', '😴', '✍️',
  '🎵', '🌅', '🧹', '💊', '🚶', '🎨', '🧠', '☕',
];

// 습관 기본 색상 목록
export const HABIT_COLORS = [
  '#007AFF', '#34C759', '#FF9500', '#FF3B30',
  '#5856D6', '#AF52DE', '#FF2D55', '#00C7BE',
];

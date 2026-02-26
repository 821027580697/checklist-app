// 습관(Habit) 관련 타입 정의
import { Timestamp } from 'firebase/firestore';
import { TaskCategory } from './task';

// 습관 빈도 타입
export type HabitFrequencyType = 'daily' | 'weekly' | 'custom';

// 습관 빈도 설정
export interface HabitFrequency {
  type: HabitFrequencyType;
  daysOfWeek: number[];      // custom일 때 특정 요일 (0=일 ~ 6=토)
  timesPerWeek: number;      // weekly일 때 주 N회
}

// 습관 메인 인터페이스
export interface Habit {
  id: string;
  userId: string;
  title: string;                   // 습관 이름
  description: string;
  category: TaskCategory;
  icon: string;                    // 이모지 또는 아이콘 이름
  color: string;                   // 대표 색상 (#hex)
  frequency: HabitFrequency;
  reminderTime: string | null;     // HH:mm 형식
  streak: number;                  // 현재 연속 달성
  longestStreak: number;           // 최장 연속 달성
  completedDates: string[];        // 'YYYY-MM-DD' 배열
  totalChecks: number;             // 총 체크 수
  isActive: boolean;               // 활성/비활성
  createdAt: Timestamp;
  updatedAt: Timestamp;
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

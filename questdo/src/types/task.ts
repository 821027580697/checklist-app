// 할 일(Task) 관련 타입 정의
import { Timestamp } from 'firebase/firestore';

// 할 일 카테고리
export type TaskCategory =
  | 'work'
  | 'personal'
  | 'health'
  | 'study'
  | 'creative'
  | 'finance'
  | 'social'
  | 'other';

// 우선순위
export type TaskPriority = 'urgent' | 'high' | 'medium' | 'low';

// 상태
export type TaskStatus = 'todo' | 'in_progress' | 'completed';

// 반복 주기
export type RecurringFrequency = 'daily' | 'weekly' | 'monthly';

// 리마인더 타입
export type ReminderType = 'at_time' | '10min' | '30min' | '1hour' | '1day';

// 서브태스크 인터페이스
export interface Subtask {
  id: string;
  title: string;
  isCompleted: boolean;
}

// 반복 패턴 설정
export interface RecurringPattern {
  frequency: RecurringFrequency;
  daysOfWeek: number[];     // 0(일) ~ 6(토)
  endDate: Timestamp | null;
}

// 리마인더 설정
export interface TaskReminder {
  enabled: boolean;
  type: ReminderType;
}

// 할 일 메인 인터페이스
export interface Task {
  id: string;
  userId: string;
  title: string;                // 할 일 제목 (최대 100자)
  description: string;          // 상세 설명 (최대 500자)
  category: TaskCategory;       // 카테고리
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: Timestamp | null;    // 마감일
  dueTime: string | null;       // 마감 시간 (HH:mm)
  reminder: TaskReminder;
  isRecurring: boolean;
  recurringPattern: RecurringPattern | null;
  subtasks: Subtask[];
  xpEarned: number;             // 완료 시 획득한 XP
  completedAt: Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// 카테고리별 색상 매핑
export const CATEGORY_COLORS: Record<TaskCategory, string> = {
  work: '#007AFF',
  personal: '#5856D6',
  health: '#34C759',
  study: '#FF9500',
  creative: '#FF2D55',
  finance: '#AF52DE',
  social: '#00C7BE',
  other: '#8E8E93',
};

// 카테고리 라벨 (다국어)
export const CATEGORY_LABELS: Record<TaskCategory, { ko: string; en: string }> = {
  work: { ko: '업무', en: 'Work' },
  personal: { ko: '개인', en: 'Personal' },
  health: { ko: '건강', en: 'Health' },
  study: { ko: '학습', en: 'Study' },
  creative: { ko: '창작', en: 'Creative' },
  finance: { ko: '재정', en: 'Finance' },
  social: { ko: '소셜', en: 'Social' },
  other: { ko: '기타', en: 'Other' },
};

// 우선순위 색상 매핑
export const PRIORITY_COLORS: Record<TaskPriority, string> = {
  urgent: '#FF3B30',
  high: '#FF9500',
  medium: '#007AFF',
  low: '#8E8E93',
};

// 우선순위 라벨 (다국어)
export const PRIORITY_LABELS: Record<TaskPriority, { ko: string; en: string }> = {
  urgent: { ko: '긴급', en: 'Urgent' },
  high: { ko: '높음', en: 'High' },
  medium: { ko: '보통', en: 'Medium' },
  low: { ko: '낮음', en: 'Low' },
};

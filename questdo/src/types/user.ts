// 사용자 관련 타입 정의
import { Timestamp } from 'firebase/firestore';

// 사용자 프로필 인터페이스
export interface User {
  uid: string;
  email: string;
  nickname: string;
  avatarUrl: string;        // 기본 아바타 또는 커스텀 이미지
  bio: string;              // 자기소개 (최대 150자)
  level: number;            // 현재 레벨 (기본값: 1)
  xp: number;               // 현재 경험치 (기본값: 0)
  totalXp: number;          // 누적 총 경험치
  title: string;            // 현재 칭호
  stats: UserStats;
  badges: string[];         // 획득한 배지 ID 배열
  settings: UserSettings;
  followersCount: number;
  followingCount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// 사용자 통계
export interface UserStats {
  totalCompleted: number;   // 총 완료한 할 일 수
  currentStreak: number;    // 현재 연속 달성 일수
  longestStreak: number;    // 최장 연속 달성 일수
  totalHabitChecks: number; // 총 습관 체크 수
}

// 사용자 설정
export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  language: 'ko' | 'en';
  notifications: NotificationSettings;
  privacy: PrivacySettings;
}

// 알림 설정
export interface NotificationSettings {
  taskReminder: boolean;
  habitReminder: boolean;
  socialActivity: boolean;
  achievements: boolean;
}

// 프라이버시 설정
export interface PrivacySettings {
  profilePublic: boolean;
  showStreak: boolean;
  showLevel: boolean;
}

// 신규 사용자 생성 시 기본값
export const DEFAULT_USER_SETTINGS: UserSettings = {
  theme: 'system',
  language: 'ko',
  notifications: {
    taskReminder: true,
    habitReminder: true,
    socialActivity: true,
    achievements: true,
  },
  privacy: {
    profilePublic: true,
    showStreak: true,
    showLevel: true,
  },
};

// 신규 사용자 기본 통계
export const DEFAULT_USER_STATS: UserStats = {
  totalCompleted: 0,
  currentStreak: 0,
  longestStreak: 0,
  totalHabitChecks: 0,
};

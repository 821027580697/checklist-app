// 사용자 관련 타입 정의

// 사용자 프로필 인터페이스
export interface User {
  uid: string;
  email: string;
  nickname: string;
  avatarUrl: string;
  bio: string;
  level: number;
  xp: number;
  totalXp: number;
  title: string;
  stats: UserStats;
  badges: string[];
  settings: UserSettings;
  followersCount: number;
  followingCount: number;
  createdAt: string;  // ISO 문자열
  updatedAt: string;
}

// 사용자 통계
export interface UserStats {
  totalCompleted: number;
  currentStreak: number;
  longestStreak: number;
  totalHabitChecks: number;
  lastStreakDate: string;
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
  lastStreakDate: '',
};

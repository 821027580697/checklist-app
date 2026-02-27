// 알림 관련 타입 정의

// 알림 유형
export type NotificationType =
  | 'task_reminder'
  | 'habit_reminder'
  | 'like'
  | 'comment'
  | 'follow'
  | 'badge'
  | 'level_up'
  | 'challenge';

// 알림 관련 리소스 타입
export type NotificationRelatedType = 'post' | 'task' | 'badge' | 'user' | null;

// 알림 메인 인터페이스
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: { ko: string; en: string };
  message: { ko: string; en: string };
  isRead: boolean;
  relatedId: string | null;
  relatedType: NotificationRelatedType;
  createdAt: string; // ISO 문자열
}

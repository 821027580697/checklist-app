// 배지 관련 타입 정의
import { TaskCategory } from './task';

// 배지 희귀도
export type BadgeRarity = 'common' | 'rare' | 'epic' | 'legendary';

// 배지 달성 조건 유형
export type BadgeConditionType =
  | 'task_complete'
  | 'streak'
  | 'habit_check'
  | 'social'
  | 'level'
  | 'special';

// 배지 달성 조건
export interface BadgeCondition {
  type: BadgeConditionType;
  target: number;
  category?: TaskCategory;
}

// 배지 인터페이스
export interface Badge {
  id: string;
  name: { ko: string; en: string };
  description: { ko: string; en: string };
  icon: string;                    // SVG 파일명 또는 이모지
  rarity: BadgeRarity;
  condition: BadgeCondition;
  xpReward: number;
}

// 배지 희귀도별 색상
export const RARITY_COLORS: Record<BadgeRarity, string> = {
  common: '#8E8E93',
  rare: '#007AFF',
  epic: '#5856D6',
  legendary: '#FFD700',
};

// 배지 희귀도 라벨
export const RARITY_LABELS: Record<BadgeRarity, { ko: string; en: string }> = {
  common: { ko: '일반', en: 'Common' },
  rare: { ko: '레어', en: 'Rare' },
  epic: { ko: '에픽', en: 'Epic' },
  legendary: { ko: '전설', en: 'Legendary' },
};

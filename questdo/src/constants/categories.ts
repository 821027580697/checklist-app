// 기본 카테고리 정의
import { TaskCategory } from '@/types/task';

// 카테고리 아이콘 매핑
export const CATEGORY_ICONS: Record<TaskCategory, string> = {
  work: '💼',
  personal: '🏠',
  health: '💪',
  study: '📚',
  creative: '🎨',
  finance: '💰',
  social: '👥',
  other: '📌',
};

// 기본 카테고리 목록 (온보딩에서 선택 시 사용)
export const DEFAULT_CATEGORIES: {
  value: TaskCategory;
  label: { ko: string; en: string };
  icon: string;
}[] = [
  { value: 'work', label: { ko: '업무', en: 'Work' }, icon: '💼' },
  { value: 'personal', label: { ko: '개인', en: 'Personal' }, icon: '🏠' },
  { value: 'health', label: { ko: '건강', en: 'Health' }, icon: '💪' },
  { value: 'study', label: { ko: '학습', en: 'Study' }, icon: '📚' },
  { value: 'creative', label: { ko: '창작', en: 'Creative' }, icon: '🎨' },
  { value: 'finance', label: { ko: '재정', en: 'Finance' }, icon: '💰' },
  { value: 'social', label: { ko: '소셜', en: 'Social' }, icon: '👥' },
  { value: 'other', label: { ko: '기타', en: 'Other' }, icon: '📌' },
];

// 기본 아바타 목록 (온보딩에서 선택 시 사용)
export const DEFAULT_AVATARS = [
  '/badges/avatar-1.svg',
  '/badges/avatar-2.svg',
  '/badges/avatar-3.svg',
  '/badges/avatar-4.svg',
  '/badges/avatar-5.svg',
  '/badges/avatar-6.svg',
  '/badges/avatar-7.svg',
  '/badges/avatar-8.svg',
];

// 아바타 이모지 (SVG 없을 때 폴백)
export const AVATAR_EMOJIS = ['🧑‍💻', '🧑‍🎨', '🧑‍🔬', '🧑‍🚀', '🧑‍🎓', '🦸', '🧙', '🥷'];

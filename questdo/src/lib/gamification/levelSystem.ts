// 레벨 시스템 — XP 기반 레벨 계산 및 칭호 관리
import { calculateLevel, getLevelProgress, getXpForNextLevel, MAX_LEVEL } from '@/constants/xpTable';
import { getTitleForLevel } from '@/constants/titles';

// 레벨업 결과 인터페이스
export interface LevelUpResult {
  newLevel: number;
  previousLevel: number;
  didLevelUp: boolean;
  newTitle: string | null;
  previousTitle: string | null;
}

// XP 추가 후 레벨업 체크
export const checkLevelUp = (
  currentLevel: number,
  currentTotalXp: number,
  addedXp: number,
  language: 'ko' | 'en' = 'ko',
): LevelUpResult => {
  const newTotalXp = currentTotalXp + addedXp;
  const newLevel = calculateLevel(newTotalXp);
  const didLevelUp = newLevel > currentLevel;

  const previousTitle = getTitleForLevel(currentLevel, language);
  const newTitle = getTitleForLevel(newLevel, language);
  const titleChanged = previousTitle !== newTitle;

  return {
    newLevel,
    previousLevel: currentLevel,
    didLevelUp,
    newTitle: titleChanged ? newTitle : null,
    previousTitle: titleChanged ? previousTitle : null,
  };
};

// 현재 레벨 진행률 정보
export const getLevelInfo = (level: number, totalXp: number) => {
  const progress = getLevelProgress(level, totalXp);
  const xpForNext = getXpForNextLevel(level);
  const isMaxLevel = level >= MAX_LEVEL;

  return {
    level,
    progress,           // 0~1 사이의 비율
    xpForNext,         // 다음 레벨까지 필요한 총 XP
    progressPercent: Math.round(progress * 100),
    isMaxLevel,
  };
};

export { calculateLevel, getLevelProgress, MAX_LEVEL };

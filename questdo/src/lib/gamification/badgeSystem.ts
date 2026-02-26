// 배지 시스템 — 배지 달성 조건 체크
import { BADGES } from '@/constants/badges';
import { Badge } from '@/types/badge';
import { UserStats } from '@/types/user';

// 배지 달성 결과
export interface BadgeCheckResult {
  newBadges: Badge[];       // 새로 획득한 배지
  totalXpReward: number;    // 새 배지로 획득한 총 XP
}

// 사용자 통계 기반으로 새로 달성한 배지 체크
export const checkNewBadges = (
  stats: UserStats,
  currentLevel: number,
  earnedBadgeIds: string[],
): BadgeCheckResult => {
  const newBadges: Badge[] = [];

  for (const badge of BADGES) {
    // 이미 획득한 배지는 건너뛰기
    if (earnedBadgeIds.includes(badge.id)) continue;

    let isAchieved = false;

    switch (badge.condition.type) {
      case 'task_complete':
        isAchieved = stats.totalCompleted >= badge.condition.target;
        break;

      case 'streak':
        // 현재 스트릭 또는 최장 스트릭으로 체크
        isAchieved =
          stats.currentStreak >= badge.condition.target ||
          stats.longestStreak >= badge.condition.target;
        break;

      case 'habit_check':
        isAchieved = stats.totalHabitChecks >= badge.condition.target;
        break;

      case 'level':
        isAchieved = currentLevel >= badge.condition.target;
        break;

      // social, special 배지는 별도 로직에서 처리
      case 'social':
      case 'special':
        break;
    }

    if (isAchieved) {
      newBadges.push(badge);
    }
  }

  const totalXpReward = newBadges.reduce((sum, badge) => sum + badge.xpReward, 0);

  return { newBadges, totalXpReward };
};

// 특정 배지 ID로 배지 정보 조회
export const getBadgeById = (badgeId: string): Badge | undefined => {
  return BADGES.find((b) => b.id === badgeId);
};

// 배지를 희귀도별로 그룹핑
export const getBadgesByRarity = () => {
  return {
    common: BADGES.filter((b) => b.rarity === 'common'),
    rare: BADGES.filter((b) => b.rarity === 'rare'),
    epic: BADGES.filter((b) => b.rarity === 'epic'),
    legendary: BADGES.filter((b) => b.rarity === 'legendary'),
  };
};

// 다음 달성 가능한 배지 목록 (진행률 포함)
export const getNextAchievableBadges = (
  stats: UserStats,
  currentLevel: number,
  earnedBadgeIds: string[],
): (Badge & { progress: number })[] => {
  return BADGES
    .filter((b) => !earnedBadgeIds.includes(b.id))
    .filter((b) => b.condition.type !== 'special') // 특별 배지 제외
    .map((badge) => {
      let current = 0;

      switch (badge.condition.type) {
        case 'task_complete':
          current = stats.totalCompleted;
          break;
        case 'streak':
          current = Math.max(stats.currentStreak, stats.longestStreak);
          break;
        case 'habit_check':
          current = stats.totalHabitChecks;
          break;
        case 'level':
          current = currentLevel;
          break;
        default:
          current = 0;
      }

      const progress = Math.min(1, current / badge.condition.target);
      return { ...badge, progress };
    })
    .sort((a, b) => b.progress - a.progress); // 진행률 높은 순 정렬
};

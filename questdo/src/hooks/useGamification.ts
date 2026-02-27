// 게이미피케이션 통합 훅 — XP 획득, 레벨업, 배지 체크 (MongoDB 기반)
'use client';

import { useState, useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { checkLevelUp } from '@/lib/gamification/levelSystem';
import { checkNewBadges } from '@/lib/gamification/badgeSystem';
import { Badge } from '@/types/badge';
import { userApi } from '@/lib/api/client';
import { useUIStore } from '@/stores/uiStore';

interface GamificationEvent {
  xpGained: number | null;
  levelUp: { level: number; newTitle: string | null } | null;
  badgeUnlocked: Badge | null;
}

export function useGamification() {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const language = useUIStore((state) => state.language);

  const [showXP, setShowXP] = useState(false);
  const [xpAmount, setXpAmount] = useState(0);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [levelUpInfo, setLevelUpInfo] = useState<{ level: number; newTitle: string | null } | null>(null);
  const [showBadge, setShowBadge] = useState(false);
  const [unlockedBadge, setUnlockedBadge] = useState<Badge | null>(null);

  const awardXP = useCallback(
    async (xp: number): Promise<GamificationEvent> => {
      if (!user || xp <= 0) return { xpGained: null, levelUp: null, badgeUnlocked: null };

      const result: GamificationEvent = { xpGained: xp, levelUp: null, badgeUnlocked: null };

      setXpAmount(xp);
      setShowXP(true);
      setTimeout(() => setShowXP(false), 1500);

      const levelResult = checkLevelUp(user.level, user.totalXp, xp, language);
      if (levelResult.didLevelUp) {
        result.levelUp = { level: levelResult.newLevel, newTitle: levelResult.newTitle };
        setTimeout(() => {
          setLevelUpInfo(result.levelUp);
          setShowLevelUp(true);
        }, 1600);
      }

      const newTotalXp = user.totalXp + xp;
      const updatedUser = {
        ...user,
        xp: user.xp + xp,
        totalXp: newTotalXp,
        level: levelResult.newLevel,
        title: levelResult.newTitle || user.title,
      };

      const badgeResult = checkNewBadges(updatedUser.stats, updatedUser.level, updatedUser.badges);
      if (badgeResult.newBadges.length > 0) {
        const firstBadge = badgeResult.newBadges[0];
        result.badgeUnlocked = firstBadge;
        updatedUser.badges = [...updatedUser.badges, ...badgeResult.newBadges.map((b) => b.id)];
        updatedUser.xp += badgeResult.totalXpReward;
        updatedUser.totalXp += badgeResult.totalXpReward;

        const delay = levelResult.didLevelUp ? 4000 : 1600;
        setTimeout(() => {
          setUnlockedBadge(firstBadge);
          setShowBadge(true);
        }, delay);
      }

      setUser(updatedUser);
      await userApi.update({
        xp: updatedUser.xp,
        totalXp: updatedUser.totalXp,
        level: updatedUser.level,
        title: updatedUser.title,
        badges: updatedUser.badges,
      });

      return result;
    },
    [user, setUser, language],
  );

  const updateStats = useCallback(
    async (updates: Partial<NonNullable<typeof user>['stats']>) => {
      if (!user) return;
      const newStats = { ...user.stats, ...updates };
      const updatedUser = { ...user, stats: newStats };
      setUser(updatedUser);
      await userApi.update({ stats: newStats });
    },
    [user, setUser],
  );

  return {
    awardXP,
    updateStats,
    showXP,
    xpAmount,
    dismissXP: () => setShowXP(false),
    showLevelUp,
    levelUpInfo,
    dismissLevelUp: () => setShowLevelUp(false),
    showBadge,
    unlockedBadge,
    dismissBadge: () => setShowBadge(false),
  };
}

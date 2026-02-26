// 게이미피케이션 통합 훅 — XP 획득, 레벨업, 배지 체크를 한곳에서 관리
'use client';

import { useState, useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { checkLevelUp } from '@/lib/gamification/levelSystem';
import { checkNewBadges } from '@/lib/gamification/badgeSystem';
import { Badge } from '@/types/badge';
import { updateDocument } from '@/lib/firebase/firestore';
import { useUIStore } from '@/stores/uiStore';

// 게이미피케이션 이벤트 상태
interface GamificationEvent {
  xpGained: number | null;
  levelUp: { level: number; newTitle: string | null } | null;
  badgeUnlocked: Badge | null;
}

export function useGamification() {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const language = useUIStore((state) => state.language);

  // 애니메이션 표시 상태
  const [showXP, setShowXP] = useState(false);
  const [xpAmount, setXpAmount] = useState(0);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [levelUpInfo, setLevelUpInfo] = useState<{ level: number; newTitle: string | null } | null>(null);
  const [showBadge, setShowBadge] = useState(false);
  const [unlockedBadge, setUnlockedBadge] = useState<Badge | null>(null);

  // XP 획득 처리 + 레벨업 + 배지 체크
  const awardXP = useCallback(
    async (xp: number): Promise<GamificationEvent> => {
      if (!user || xp <= 0) return { xpGained: null, levelUp: null, badgeUnlocked: null };

      const result: GamificationEvent = {
        xpGained: xp,
        levelUp: null,
        badgeUnlocked: null,
      };

      // 1) XP 토스트 표시
      setXpAmount(xp);
      setShowXP(true);
      setTimeout(() => setShowXP(false), 1500);

      // 2) 레벨업 체크
      const levelResult = checkLevelUp(user.level, user.totalXp, xp, language);
      if (levelResult.didLevelUp) {
        result.levelUp = {
          level: levelResult.newLevel,
          newTitle: levelResult.newTitle,
        };
        // 약간의 딜레이 후 레벨업 모달
        setTimeout(() => {
          setLevelUpInfo(result.levelUp);
          setShowLevelUp(true);
        }, 1600);
      }

      // 3) 사용자 정보 업데이트
      const newTotalXp = user.totalXp + xp;
      const updatedUser = {
        ...user,
        xp: user.xp + xp,
        totalXp: newTotalXp,
        level: levelResult.newLevel,
        title: levelResult.newTitle || user.title,
      };

      // 4) 배지 체크
      const badgeResult = checkNewBadges(
        updatedUser.stats,
        updatedUser.level,
        updatedUser.badges,
      );
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

      // 5) Zustand + Firestore 업데이트
      setUser(updatedUser);
      await updateDocument('users', user.uid, {
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

  // 통계 업데이트 (완료 시 등)
  const updateStats = useCallback(
    async (updates: Partial<NonNullable<typeof user>['stats']>) => {
      if (!user) return;

      const newStats = { ...user.stats, ...updates };
      const updatedUser = { ...user, stats: newStats };
      setUser(updatedUser);

      await updateDocument('users', user.uid, { stats: newStats });
    },
    [user, setUser],
  );

  return {
    // 액션
    awardXP,
    updateStats,

    // XP 토스트
    showXP,
    xpAmount,
    dismissXP: () => setShowXP(false),

    // 레벨업 모달
    showLevelUp,
    levelUpInfo,
    dismissLevelUp: () => setShowLevelUp(false),

    // 배지 모달
    showBadge,
    unlockedBadge,
    dismissBadge: () => setShowBadge(false),
  };
}

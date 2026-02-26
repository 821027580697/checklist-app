// 게이미피케이션 프로바이더 — XP/레벨업/배지 애니메이션을 앱 전역에서 사용
'use client';

import React, { createContext, useContext } from 'react';
import { useGamification } from '@/hooks/useGamification';
import XPGainToast from './XPGainToast';
import LevelUpModal from './LevelUpModal';
import BadgeUnlockModal from './BadgeUnlockModal';

type GamificationContextType = ReturnType<typeof useGamification>;

const GamificationContext = createContext<GamificationContextType | null>(null);

export function useGamificationContext() {
  const ctx = useContext(GamificationContext);
  if (!ctx) {
    throw new Error('useGamificationContext must be used within GamificationProvider');
  }
  return ctx;
}

export default function GamificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const gamification = useGamification();

  return (
    <GamificationContext.Provider value={gamification}>
      {children}

      {/* XP 획득 토스트 */}
      <XPGainToast
        xp={gamification.xpAmount}
        visible={gamification.showXP}
        onDone={gamification.dismissXP}
      />

      {/* 레벨업 모달 */}
      <LevelUpModal
        open={gamification.showLevelUp}
        level={gamification.levelUpInfo?.level ?? 0}
        newTitle={gamification.levelUpInfo?.newTitle}
        onClose={gamification.dismissLevelUp}
      />

      {/* 배지 획득 모달 */}
      <BadgeUnlockModal
        open={gamification.showBadge}
        badge={gamification.unlockedBadge}
        onClose={gamification.dismissBadge}
      />
    </GamificationContext.Provider>
  );
}

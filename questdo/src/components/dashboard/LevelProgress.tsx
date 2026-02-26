// 레벨 & XP 프로그레스 바 — Apple 스타일
'use client';

import { motion } from 'framer-motion';
import { Progress } from '@/components/ui/progress';
import { useAuthStore } from '@/stores/authStore';
import { useTranslation } from '@/hooks/useTranslation';
import { getLevelInfo } from '@/lib/gamification/levelSystem';
import { Sparkles } from 'lucide-react';

export const LevelProgress = () => {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);

  if (!user) return null;

  const levelInfo = getLevelInfo(user.level, user.totalXp);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="apple-card p-5"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#007AFF] to-[#5856D6] text-white text-sm font-bold shadow-lg shadow-[#007AFF]/20">
            {user.level}
          </div>
          <div>
            <p className="text-[15px] font-semibold tracking-tight">
              {t('dashboard.level', { level: user.level })}
            </p>
            <p className="text-[12px] text-muted-foreground">{user.title}</p>
          </div>
        </div>

        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <Sparkles className="h-3 w-3 text-[#FF9500]" />
          {user.totalXp} XP
        </div>
      </div>

      <div className="space-y-1.5">
        <Progress value={levelInfo.progressPercent} className="h-[6px] rounded-full" />
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span>{t('dashboard.xpProgress', { current: user.totalXp, next: user.totalXp + levelInfo.xpForNext })}</span>
          <span className="font-medium">{levelInfo.progressPercent}%</span>
        </div>
      </div>
    </motion.div>
  );
};

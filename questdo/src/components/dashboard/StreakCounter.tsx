// 연속 달성 카운터 — Apple 스타일
'use client';

import { motion } from 'framer-motion';
import { useAuthStore } from '@/stores/authStore';
import { useTranslation } from '@/hooks/useTranslation';
import { Flame } from 'lucide-react';

export const StreakCounter = () => {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);

  if (!user) return null;

  const streak = user.stats.currentStreak;
  const hasStreak = streak > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="apple-card p-5"
    >
      <div className="flex items-center gap-4">
        <motion.div
          animate={hasStreak ? { scale: [1, 1.08, 1] } : {}}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FF9500] to-[#FF3B30] text-white shadow-lg shadow-[#FF9500]/20"
        >
          <Flame className="h-6 w-6" />
        </motion.div>
        <div>
          {hasStreak ? (
            <>
              <p className="text-3xl font-bold tracking-tight">{streak}</p>
              <p className="text-[12px] text-muted-foreground">
                {t('dashboard.streak', { count: streak })}
              </p>
            </>
          ) : (
            <p className="text-[14px] text-muted-foreground">
              {t('dashboard.noStreak')}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

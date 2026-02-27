// 연속 달성 카운터 — 실시간 스트릭 + 3D 폭죽 + 응원 메시지
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/stores/authStore';
import { useTranslation } from '@/hooks/useTranslation';
import { useStreakCheck } from '@/hooks/useStreakCheck';
import { Confetti } from '@/components/effects/Confetti';
import { Flame, PartyPopper, CheckCircle2 } from 'lucide-react';

export const StreakCounter = () => {
  const { t, language } = useTranslation();
  const lang = language as 'ko' | 'en';
  const user = useAuthStore((state) => state.user);
  const {
    tasksAllDone,
    habitsAllDone,
    bothComplete,
    showCelebration,
    cheerMessage,
    currentStreak,
  } = useStreakCheck(lang);

  if (!user) return null;

  const hasStreak = currentStreak > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="apple-card p-5 relative overflow-hidden"
    >
      {/* 3D 폭죽 애니메이션 */}
      <Confetti active={showCelebration} particleCount={60} duration={3500} />

      <div className="flex items-center gap-4">
        <motion.div
          animate={
            showCelebration
              ? { scale: [1, 1.3, 1.1, 1.3, 1], rotate: [0, -10, 10, -10, 0] }
              : hasStreak
                ? { scale: [1, 1.08, 1] }
                : {}
          }
          transition={
            showCelebration
              ? { duration: 0.8, ease: 'easeInOut' }
              : { duration: 2, repeat: Infinity, repeatDelay: 3 }
          }
          className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FF9500] to-[#FF3B30] text-white shadow-lg shadow-[#FF9500]/20"
        >
          {showCelebration ? (
            <PartyPopper className="h-6 w-6" />
          ) : (
            <Flame className="h-6 w-6" />
          )}
        </motion.div>
        <div className="flex-1 min-w-0">
          {hasStreak ? (
            <>
              <motion.p
                key={currentStreak}
                initial={{ scale: 1.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-3xl font-bold tracking-tight"
              >
                {currentStreak}
              </motion.p>
              <p className="text-[12px] text-muted-foreground">
                {t('dashboard.streak', { count: currentStreak })}
              </p>
            </>
          ) : (
            <p className="text-[14px] text-muted-foreground">
              {t('dashboard.noStreak')}
            </p>
          )}
        </div>
      </div>

      {/* 오늘 진행 상태 */}
      <div className="flex gap-2 mt-3">
        <div className="flex items-center gap-1.5 text-[11px]">
          <CheckCircle2
            className="h-3.5 w-3.5"
            style={{ color: tasksAllDone ? '#34C759' : '#C7C7CC' }}
          />
          <span className={tasksAllDone ? 'text-[#34C759] font-medium' : 'text-muted-foreground'}>
            {lang === 'ko' ? '할 일' : 'Tasks'}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px]">
          <CheckCircle2
            className="h-3.5 w-3.5"
            style={{ color: habitsAllDone ? '#34C759' : '#C7C7CC' }}
          />
          <span className={habitsAllDone ? 'text-[#34C759] font-medium' : 'text-muted-foreground'}>
            {lang === 'ko' ? '습관' : 'Habits'}
          </span>
        </div>
      </div>

      {/* 응원 메시지 */}
      <AnimatePresence>
        {showCelebration && cheerMessage && (
          <motion.div
            initial={{ opacity: 0, y: 10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -5, height: 0 }}
            transition={{ duration: 0.4 }}
            className="mt-3 rounded-xl bg-gradient-to-r from-[#FF9500]/10 to-[#FF3B30]/10 p-3 border border-[#FF9500]/20"
          >
            <p className="text-[13px] font-medium text-center text-foreground leading-relaxed">
              {cheerMessage}
            </p>
            <p className="text-[11px] text-center text-muted-foreground mt-1">
              {lang === 'ko'
                ? `🔥 ${currentStreak}일 연속 달성!`
                : `🔥 ${currentStreak}-day streak!`}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

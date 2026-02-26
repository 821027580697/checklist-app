// 배지 획득 축하 모달 컴포넌트
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/useTranslation';
import { Badge } from '@/types/badge';
import { RARITY_COLORS, RARITY_LABELS } from '@/types/badge';

interface BadgeUnlockModalProps {
  open: boolean;
  badge: Badge | null;
  onClose: () => void;
}

export default function BadgeUnlockModal({
  open,
  badge,
  onClose,
}: BadgeUnlockModalProps) {
  const { t, language } = useTranslation();
  const lang = language as 'ko' | 'en';

  if (!badge) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="relative mx-4 w-full max-w-sm overflow-hidden rounded-3xl bg-background shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            style={{
              boxShadow: `0 0 60px ${RARITY_COLORS[badge.rarity]}40`,
            }}
          >
            {/* 상단 그라데이션 바 */}
            <div
              className="h-2 w-full"
              style={{
                background: `linear-gradient(90deg, ${RARITY_COLORS[badge.rarity]}, ${RARITY_COLORS[badge.rarity]}80)`,
              }}
            />

            <div className="p-6">
              {/* 빛나는 배경 효과 */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 h-40 w-40 rounded-full opacity-20"
                style={{
                  background: `radial-gradient(circle, ${RARITY_COLORS[badge.rarity]}, transparent)`,
                }}
              />

              <div className="relative flex flex-col items-center gap-4 text-center">
                {/* 배지 아이콘 */}
                <motion.div
                  initial={{ scale: 0, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  transition={{ type: 'spring', delay: 0.3, stiffness: 300 }}
                  className="flex h-24 w-24 items-center justify-center rounded-2xl text-6xl"
                  style={{
                    background: `linear-gradient(135deg, ${RARITY_COLORS[badge.rarity]}20, ${RARITY_COLORS[badge.rarity]}10)`,
                    boxShadow: `0 0 30px ${RARITY_COLORS[badge.rarity]}30`,
                  }}
                >
                  {badge.icon}
                </motion.div>

                {/* 배지 이름 */}
                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="text-xl font-bold"
                >
                  {badge.name[lang]}
                </motion.h2>

                {/* 희귀도 */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 }}
                  className="rounded-full px-3 py-1 text-xs font-semibold text-white"
                  style={{ backgroundColor: RARITY_COLORS[badge.rarity] }}
                >
                  {RARITY_LABELS[badge.rarity][lang]}
                </motion.div>

                {/* 설명 */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="text-sm text-muted-foreground"
                >
                  {badge.description[lang]}
                </motion.p>

                {/* XP 보상 */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.8 }}
                  className="flex items-center gap-1 rounded-full bg-yellow-100 dark:bg-yellow-900/30 px-4 py-1.5"
                >
                  <span className="text-sm font-bold text-yellow-600 dark:text-yellow-400">
                    +{badge.xpReward} XP
                  </span>
                </motion.div>

                {/* 닫기 버튼 */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1 }}
                  className="w-full pt-2"
                >
                  <Button
                    onClick={onClose}
                    className="w-full rounded-xl"
                    style={{
                      backgroundColor: RARITY_COLORS[badge.rarity],
                      color: 'white',
                    }}
                  >
                    {lang === 'ko' ? '확인' : 'Awesome!'}
                  </Button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// 레벨업 축하 모달 컴포넌트
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/useTranslation';
import { Sparkles, Trophy, ArrowUp } from 'lucide-react';

interface LevelUpModalProps {
  open: boolean;
  level: number;
  newTitle?: string | null;
  onClose: () => void;
}

export default function LevelUpModal({
  open,
  level,
  newTitle,
  onClose,
}: LevelUpModalProps) {
  const { t, language } = useTranslation();
  const lang = language as 'ko' | 'en';

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
            initial={{ scale: 0.5, opacity: 0, rotateY: -90 }}
            animate={{ scale: 1, opacity: 1, rotateY: 0 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="relative mx-4 w-full max-w-sm overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-[2px] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="rounded-3xl bg-background p-6">
              {/* 배경 파티클 */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {Array.from({ length: 20 }).map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{
                      opacity: 0,
                      x: '50%',
                      y: '50%',
                    }}
                    animate={{
                      opacity: [0, 1, 0],
                      x: `${Math.random() * 100}%`,
                      y: `${Math.random() * 100}%`,
                    }}
                    transition={{
                      duration: 2,
                      delay: i * 0.1,
                      repeat: Infinity,
                      repeatDelay: 1,
                    }}
                    className="absolute h-1 w-1 rounded-full bg-yellow-400"
                  />
                ))}
              </div>

              {/* 컨텐츠 */}
              <div className="relative flex flex-col items-center gap-4 text-center">
                {/* 레벨 뱃지 */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.2, stiffness: 300 }}
                  className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 shadow-lg shadow-orange-400/40"
                >
                  <div className="flex flex-col items-center">
                    <ArrowUp className="h-5 w-5 text-white" />
                    <span className="text-3xl font-black text-white">{level}</span>
                  </div>
                </motion.div>

                {/* 제목 */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-yellow-500" />
                    {t('gamification.levelUp').replace('{level}', String(level))}
                    <Sparkles className="h-5 w-5 text-yellow-500" />
                  </h2>
                </motion.div>

                {/* 새 칭호 */}
                {newTitle && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6 }}
                    className="flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 px-4 py-2"
                  >
                    <Trophy className="h-4 w-4 text-purple-500" />
                    <span className="text-sm font-semibold">
                      {t('gamification.newTitle').replace('{title}', newTitle)}
                    </span>
                  </motion.div>
                )}

                {/* 축하 메시지 */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="text-sm text-muted-foreground"
                >
                  {lang === 'ko'
                    ? '계속 이 기세를 유지하세요! 💪'
                    : 'Keep up the great momentum! 💪'}
                </motion.p>

                {/* 닫기 버튼 */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1 }}
                  className="w-full"
                >
                  <Button
                    onClick={onClose}
                    className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-600 hover:to-purple-600"
                  >
                    {lang === 'ko' ? '계속하기' : 'Continue'}
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

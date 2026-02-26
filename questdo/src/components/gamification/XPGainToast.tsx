// XP 획득 토스트 애니메이션 컴포넌트
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface XPGainToastProps {
  xp: number;
  visible: boolean;
  onDone?: () => void;
}

export default function XPGainToast({ xp, visible, onDone }: XPGainToastProps) {
  return (
    <AnimatePresence onExitComplete={onDone}>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -30, scale: 0.6 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
        >
          <div className="flex items-center gap-2 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 px-5 py-2.5 shadow-lg shadow-orange-500/30">
            <Sparkles className="h-4 w-4 text-white" />
            <span className="text-sm font-bold text-white">+{xp} XP</span>
          </div>
          {/* 파티클 효과 */}
          {Array.from({ length: 6 }).map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 1, x: 0, y: 0 }}
              animate={{
                opacity: 0,
                x: (Math.random() - 0.5) * 120,
                y: -Math.random() * 80 - 20,
              }}
              transition={{ duration: 0.8, delay: i * 0.05 }}
              className="absolute left-1/2 top-1/2 h-1.5 w-1.5 rounded-full bg-yellow-300"
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

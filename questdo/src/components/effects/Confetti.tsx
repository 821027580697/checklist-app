// 3D 폭죽/Confetti 인터랙티브 애니메이션
'use client';

import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConfettiProps {
  active: boolean;
  duration?: number; // ms
  particleCount?: number;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  rotateX: number;
  rotateY: number;
  rotateZ: number;
  delay: number;
  shape: 'circle' | 'rect' | 'star';
}

const CONFETTI_COLORS = [
  '#FF3B30', '#FF9500', '#FFCC00', '#34C759', '#007AFF',
  '#5856D6', '#AF52DE', '#FF2D55', '#00C7BE', '#FF6482',
  '#FFD60A', '#30D158', '#64D2FF', '#BF5AF2',
];

const SHAPES = ['circle', 'rect', 'star'] as const;

const StarShape = ({ size, color }: { size: number; color: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

export const Confetti = ({ active, duration = 3000, particleCount = 50 }: ConfettiProps) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (active) {
      setShow(true);
      const timer = setTimeout(() => setShow(false), duration);
      return () => clearTimeout(timer);
    }
  }, [active, duration]);

  const particles: Particle[] = useMemo(() => {
    if (!show) return [];
    return Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      x: Math.random() * 100,             // % position
      y: -10 - Math.random() * 20,        // start above
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      size: 6 + Math.random() * 10,
      rotateX: Math.random() * 720 - 360,
      rotateY: Math.random() * 720 - 360,
      rotateZ: Math.random() * 720 - 360,
      delay: Math.random() * 0.5,
      shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
    }));
  }, [show, particleCount]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0 overflow-hidden pointer-events-none z-50"
          style={{ perspective: '800px' }}
        >
          {particles.map((p) => (
            <motion.div
              key={p.id}
              initial={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                opacity: 1,
                scale: 0,
                rotateX: 0,
                rotateY: 0,
                rotateZ: 0,
              }}
              animate={{
                top: `${100 + Math.random() * 30}%`,
                left: `${p.x + (Math.random() - 0.5) * 40}%`,
                opacity: [1, 1, 0.8, 0],
                scale: [0, 1.2, 1, 0.6],
                rotateX: p.rotateX,
                rotateY: p.rotateY,
                rotateZ: p.rotateZ,
              }}
              transition={{
                duration: 1.8 + Math.random() * 1.2,
                delay: p.delay,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
              className="absolute"
              style={{
                width: p.size,
                height: p.size,
                transformStyle: 'preserve-3d',
              }}
            >
              {p.shape === 'circle' ? (
                <div
                  className="w-full h-full rounded-full"
                  style={{ backgroundColor: p.color, boxShadow: `0 0 ${p.size / 2}px ${p.color}40` }}
                />
              ) : p.shape === 'star' ? (
                <StarShape size={p.size} color={p.color} />
              ) : (
                <div
                  className="w-full rounded-sm"
                  style={{
                    backgroundColor: p.color,
                    height: p.size * 0.4,
                    boxShadow: `0 0 ${p.size / 2}px ${p.color}40`,
                  }}
                />
              )}
            </motion.div>
          ))}

          {/* 중앙 폭발 효과 (glowing ring) */}
          <motion.div
            initial={{ scale: 0, opacity: 0.8 }}
            animate={{ scale: 3, opacity: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(255,215,0,0.4) 0%, transparent 70%)',
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

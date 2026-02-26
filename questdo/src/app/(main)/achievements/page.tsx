// 도전과제 & 배지 페이지
'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useAuthStore } from '@/stores/authStore';
import { useTranslation } from '@/hooks/useTranslation';
import { BADGES } from '@/constants/badges';
import { RARITY_COLORS, RARITY_LABELS, BadgeRarity } from '@/types/badge';
import { getNextAchievableBadges } from '@/lib/gamification/badgeSystem';
import { cn } from '@/lib/utils';
import { Trophy, Lock, Sparkles } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useState } from 'react';

export default function AchievementsPage() {
  const { t, language } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const lang = language as 'ko' | 'en';
  const [selectedBadge, setSelectedBadge] = useState<(typeof BADGES)[0] | null>(null);

  const earnedBadgeIds = user?.badges || [];
  const earnedCount = earnedBadgeIds.length;
  const totalCount = BADGES.length;

  // 배지를 희귀도별로 그룹핑
  const groupedBadges = useMemo(() => {
    const groups: Record<BadgeRarity, typeof BADGES> = {
      common: [],
      rare: [],
      epic: [],
      legendary: [],
    };
    BADGES.forEach((badge) => {
      groups[badge.rarity].push(badge);
    });
    return groups;
  }, []);

  // 다음 달성 가능한 배지
  const nextBadges = useMemo(() => {
    if (!user) return [];
    return getNextAchievableBadges(user.stats, user.level, earnedBadgeIds).slice(0, 3);
  }, [user, earnedBadgeIds]);

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold">{t('achievements.title')}</h1>
          <p className="text-sm text-muted-foreground">
            {earnedCount}/{totalCount} {t('achievements.achieved')}
          </p>
        </div>
        <Trophy className="h-8 w-8 text-yellow-500" />
      </motion.div>

      {/* 거의 달성할 배지 */}
      {nextBadges.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-yellow-500" />
              {lang === 'ko' ? '곧 달성 가능' : 'Almost There'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {nextBadges.map((badge) => (
              <div key={badge.id} className="flex items-center gap-3">
                <span className="text-2xl">{badge.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{badge.name[lang]}</p>
                  <Progress value={badge.progress * 100} className="h-1.5 mt-1" />
                </div>
                <span className="text-xs text-muted-foreground">
                  {Math.round(badge.progress * 100)}%
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* 배지 컬렉션 */}
      {(Object.entries(groupedBadges) as [BadgeRarity, typeof BADGES][]).map(
        ([rarity, badges]) => {
          const earnedInRarity = badges.filter((b) => earnedBadgeIds.includes(b.id)).length;

          return (
            <div key={rarity}>
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: RARITY_COLORS[rarity] }}
                />
                <h2 className="text-sm font-semibold">
                  {RARITY_LABELS[rarity][lang]} ({earnedInRarity}/{badges.length})
                </h2>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3">
                {badges.map((badge, index) => {
                  const isEarned = earnedBadgeIds.includes(badge.id);

                  return (
                    <motion.button
                      key={badge.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.03 }}
                      onClick={() => setSelectedBadge(badge)}
                      className={cn(
                        'flex flex-col items-center gap-1 rounded-2xl border-2 p-3 transition-all duration-200',
                        isEarned
                          ? 'border-transparent bg-card shadow-sm hover:shadow-md'
                          : 'border-dashed border-border opacity-50 hover:opacity-70',
                      )}
                      style={isEarned ? { borderColor: RARITY_COLORS[rarity] + '40' } : undefined}
                    >
                      <span className={cn('text-2xl', !isEarned && 'grayscale')}>
                        {isEarned ? badge.icon : <Lock className="h-5 w-5 text-muted-foreground" />}
                      </span>
                      <span className="text-[10px] text-center font-medium leading-tight truncate w-full">
                        {badge.name[lang]}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          );
        },
      )}

      {/* 배지 상세 모달 */}
      <Dialog open={!!selectedBadge} onOpenChange={() => setSelectedBadge(null)}>
        <DialogContent className="sm:max-w-sm">
          {selectedBadge && (
            <>
              <DialogHeader>
                <DialogTitle className="text-center">{selectedBadge.name[lang]}</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col items-center gap-4 py-4">
                <div
                  className={cn(
                    'flex h-20 w-20 items-center justify-center rounded-2xl text-5xl',
                    earnedBadgeIds.includes(selectedBadge.id)
                      ? 'bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20'
                      : 'bg-muted grayscale',
                  )}
                  style={{
                    boxShadow: earnedBadgeIds.includes(selectedBadge.id)
                      ? `0 0 20px ${RARITY_COLORS[selectedBadge.rarity]}30`
                      : 'none',
                  }}
                >
                  {selectedBadge.icon}
                </div>

                <div
                  className="rounded-full px-3 py-1 text-xs font-medium text-white"
                  style={{ backgroundColor: RARITY_COLORS[selectedBadge.rarity] }}
                >
                  {RARITY_LABELS[selectedBadge.rarity][lang]}
                </div>

                <p className="text-sm text-center text-muted-foreground">
                  {selectedBadge.description[lang]}
                </p>

                <p className="text-xs text-muted-foreground">
                  {t('achievements.xpReward', { xp: selectedBadge.xpReward })}
                </p>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

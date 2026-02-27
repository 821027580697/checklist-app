// 도전과제 & 배지 페이지 — 실제 데이터 기반 + hover 안내
'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useAuthStore } from '@/stores/authStore';
import { useTaskStore } from '@/stores/taskStore';
import { useHabitStore } from '@/stores/habitStore';
import { useTranslation } from '@/hooks/useTranslation';
import { BADGES } from '@/constants/badges';
import { RARITY_COLORS, RARITY_LABELS, BadgeRarity, Badge } from '@/types/badge';
import { getNextAchievableBadges } from '@/lib/gamification/badgeSystem';
import { cn } from '@/lib/utils';
import { Trophy, Lock, Sparkles, Target, Info } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export default function AchievementsPage() {
  const { t, language } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const tasks = useTaskStore((state) => state.tasks);
  const habits = useHabitStore((state) => state.habits);
  const lang = language as 'ko' | 'en';
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);

  const earnedBadgeIds = user?.badges || [];
  const earnedCount = earnedBadgeIds.length;
  const totalCount = BADGES.length;

  // 실제 통계 계산
  const realStats = useMemo(() => {
    const completedTasks = tasks.filter((t) => t.status === 'completed').length;
    const totalHabitChecks = habits.reduce((sum, h) => sum + (h.completedDates?.length || 0), 0);

    return {
      totalCompleted: completedTasks,
      currentStreak: user?.stats?.currentStreak || 0,
      longestStreak: user?.stats?.longestStreak || 0,
      totalHabitChecks,
    };
  }, [tasks, habits, user]);

  // 배지를 희귀도별로 그룹핑
  const groupedBadges = useMemo(() => {
    const groups: Record<BadgeRarity, Badge[]> = {
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

  // 배지 진행률 계산
  const getBadgeProgress = (badge: Badge): { current: number; target: number; percent: number } => {
    let current = 0;
    const target = badge.condition.target;

    switch (badge.condition.type) {
      case 'task_complete':
        current = realStats.totalCompleted;
        break;
      case 'streak':
        current = Math.max(realStats.currentStreak, realStats.longestStreak);
        break;
      case 'habit_check':
        current = realStats.totalHabitChecks;
        break;
      case 'level':
        current = user?.level || 1;
        break;
      case 'social':
      case 'special':
        current = 0;
        break;
    }

    const percent = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
    return { current, target, percent };
  };

  // 미션 완료 방법 설명
  const getMissionHint = (badge: Badge): string => {
    switch (badge.condition.type) {
      case 'task_complete':
        return lang === 'ko'
          ? `할 일을 완료하세요 (현재 ${realStats.totalCompleted}/${badge.condition.target})`
          : `Complete tasks (${realStats.totalCompleted}/${badge.condition.target})`;
      case 'streak':
        return lang === 'ko'
          ? `매일 할 일이나 습관을 완료하여 연속 달성하세요 (현재 ${Math.max(realStats.currentStreak, realStats.longestStreak)}/${badge.condition.target}일)`
          : `Complete tasks/habits daily for streak (${Math.max(realStats.currentStreak, realStats.longestStreak)}/${badge.condition.target}d)`;
      case 'habit_check':
        return lang === 'ko'
          ? `습관을 체크하세요 (현재 ${realStats.totalHabitChecks}/${badge.condition.target}회)`
          : `Check habits (${realStats.totalHabitChecks}/${badge.condition.target})`;
      case 'level':
        return lang === 'ko'
          ? `레벨을 올리세요 (현재 Lv.${user?.level || 1}/${badge.condition.target})`
          : `Level up (Lv.${user?.level || 1}/${badge.condition.target})`;
      case 'social':
        return lang === 'ko'
          ? `피드에 게시글을 작성하세요 (목표: ${badge.condition.target}개)`
          : `Create posts in feed (target: ${badge.condition.target})`;
      case 'special':
        return badge.description[lang];
    }
  };

  // 다음 달성 가능한 배지
  const nextBadges = useMemo(() => {
    if (!user) return [];
    return getNextAchievableBadges(realStats, user.level, earnedBadgeIds).slice(0, 5);
  }, [user, earnedBadgeIds, realStats]);

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-[28px] font-bold tracking-tight">{t('achievements.title')}</h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            {earnedCount}/{totalCount} {lang === 'ko' ? '달성' : 'achieved'}
          </p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 shadow-lg shadow-yellow-500/20">
          <Trophy className="h-6 w-6 text-white" />
        </div>
      </motion.div>

      {/* 전체 진행률 */}
      <Card className="border-border/50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[13px] font-semibold">{lang === 'ko' ? '전체 진행률' : 'Overall Progress'}</span>
            <span className="text-[13px] font-bold text-[#007AFF]">
              {totalCount > 0 ? Math.round((earnedCount / totalCount) * 100) : 0}%
            </span>
          </div>
          <Progress value={totalCount > 0 ? (earnedCount / totalCount) * 100 : 0} className="h-2" />
          <div className="flex items-center justify-between mt-2 text-[11px] text-muted-foreground">
            <span>{lang === 'ko' ? `${earnedCount}개 획득` : `${earnedCount} earned`}</span>
            <span>{lang === 'ko' ? `${totalCount - earnedCount}개 남음` : `${totalCount - earnedCount} remaining`}</span>
          </div>
        </CardContent>
      </Card>

      {/* 현재 통계 요약 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {[
          { label: lang === 'ko' ? '완료한 할 일' : 'Tasks Done', value: realStats.totalCompleted, color: '#007AFF' },
          { label: lang === 'ko' ? '현재 스트릭' : 'Current Streak', value: `${realStats.currentStreak}${lang === 'ko' ? '일' : 'd'}`, color: '#FF9500' },
          { label: lang === 'ko' ? '습관 체크' : 'Habit Checks', value: realStats.totalHabitChecks, color: '#34C759' },
          { label: lang === 'ko' ? '레벨' : 'Level', value: `Lv.${user?.level || 1}`, color: '#AF52DE' },
        ].map((stat) => (
          <div key={stat.label} className="apple-card p-3 text-center">
            <p className="text-[18px] font-bold" style={{ color: stat.color }}>{stat.value}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* 곧 달성 가능한 배지 */}
      {nextBadges.length > 0 && (
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-[15px] flex items-center gap-2">
              <Target className="h-4 w-4 text-[#FF9500]" />
              {lang === 'ko' ? '곧 달성 가능' : 'Almost There'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {nextBadges.map((badge) => {
              const { current, target, percent } = getBadgeProgress(badge);
              return (
                <Tooltip key={badge.id}>
                  <TooltipTrigger asChild>
                    <div
                      className="flex items-center gap-3 p-2 rounded-xl hover:bg-secondary/50 cursor-pointer transition-colors"
                      onClick={() => setSelectedBadge(badge)}
                    >
                      <span className="text-2xl shrink-0">{badge.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-[13px] font-medium truncate">{badge.name[lang]}</p>
                          <span className="text-[11px] text-muted-foreground ml-2 shrink-0">
                            {current}/{target}
                          </span>
                        </div>
                        <Progress value={percent} className="h-1.5 mt-1" />
                      </div>
                      <span className="text-[12px] font-semibold text-[#007AFF] shrink-0 ml-1">
                        {percent}%
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <p className="text-xs font-medium">{badge.name[lang]}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{getMissionHint(badge)}</p>
                    <p className="text-xs text-[#FF9500] mt-0.5">+{badge.xpReward} XP</p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* 배지 컬렉션 */}
      {(Object.entries(groupedBadges) as [BadgeRarity, Badge[]][]).map(
        ([rarity, badges]) => {
          const earnedInRarity = badges.filter((b) => earnedBadgeIds.includes(b.id)).length;

          return (
            <div key={rarity}>
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: RARITY_COLORS[rarity] }}
                />
                <h2 className="text-[14px] font-semibold">
                  {RARITY_LABELS[rarity][lang]} ({earnedInRarity}/{badges.length})
                </h2>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {badges.map((badge, index) => {
                  const isEarned = earnedBadgeIds.includes(badge.id);
                  const { current, target, percent } = getBadgeProgress(badge);

                  return (
                    <Tooltip key={badge.id}>
                      <TooltipTrigger asChild>
                        <motion.button
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.03 }}
                          onClick={() => setSelectedBadge(badge)}
                          className={cn(
                            'flex flex-col items-center gap-1.5 rounded-2xl border-2 p-3 transition-all duration-200 relative',
                            isEarned
                              ? 'border-transparent bg-card shadow-sm hover:shadow-md'
                              : 'border-dashed border-border hover:border-primary/30 hover:bg-secondary/50',
                          )}
                          style={isEarned ? { borderColor: RARITY_COLORS[rarity] + '40' } : undefined}
                        >
                          <span className={cn('text-2xl', !isEarned && 'grayscale opacity-40')}>
                            {isEarned ? badge.icon : <Lock className="h-5 w-5 text-muted-foreground" />}
                          </span>
                          <span className="text-[10px] text-center font-medium leading-tight truncate w-full">
                            {badge.name[lang]}
                          </span>
                          {/* 진행률 바 (미획득) */}
                          {!isEarned && percent > 0 && (
                            <div className="w-full h-1 rounded-full bg-secondary overflow-hidden mt-0.5">
                              <div
                                className="h-full rounded-full transition-all"
                                style={{ width: `${percent}%`, backgroundColor: RARITY_COLORS[rarity] }}
                              />
                            </div>
                          )}
                          {isEarned && (
                            <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-[#34C759] flex items-center justify-center">
                              <span className="text-[8px] text-white">✓</span>
                            </div>
                          )}
                        </motion.button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-[220px]">
                        <div className="space-y-1">
                          <p className="text-xs font-semibold">{badge.name[lang]}</p>
                          <p className="text-xs text-muted-foreground">{getMissionHint(badge)}</p>
                          {!isEarned && (
                            <div className="flex items-center gap-1 pt-0.5">
                              <Info className="h-3 w-3 text-[#007AFF]" />
                              <span className="text-[10px] text-[#007AFF]">
                                {lang === 'ko' ? `완료 시 +${badge.xpReward} XP 획득` : `+${badge.xpReward} XP on completion`}
                              </span>
                            </div>
                          )}
                          {isEarned && (
                            <p className="text-[10px] text-[#34C759] font-medium">
                              {lang === 'ko' ? '✅ 달성 완료!' : '✅ Achieved!'}
                            </p>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            </div>
          );
        },
      )}

      {/* 배지 상세 모달 */}
      <Dialog open={!!selectedBadge} onOpenChange={() => setSelectedBadge(null)}>
        <DialogContent className="sm:max-w-sm rounded-2xl">
          {selectedBadge && (() => {
            const isEarned = earnedBadgeIds.includes(selectedBadge.id);
            const { current, target, percent } = getBadgeProgress(selectedBadge);
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="text-center text-[17px]">{selectedBadge.name[lang]}</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col items-center gap-4 py-4">
                  <div
                    className={cn(
                      'flex h-20 w-20 items-center justify-center rounded-2xl text-5xl',
                      isEarned
                        ? 'bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20'
                        : 'bg-muted',
                    )}
                    style={{
                      boxShadow: isEarned
                        ? `0 0 20px ${RARITY_COLORS[selectedBadge.rarity]}30`
                        : 'none',
                    }}
                  >
                    {isEarned ? selectedBadge.icon : <span className="grayscale opacity-40 text-4xl">{selectedBadge.icon}</span>}
                  </div>

                  <div
                    className="rounded-full px-3 py-1 text-xs font-medium text-white"
                    style={{ backgroundColor: RARITY_COLORS[selectedBadge.rarity] }}
                  >
                    {RARITY_LABELS[selectedBadge.rarity][lang]}
                  </div>

                  <p className="text-[13px] text-center text-muted-foreground">
                    {selectedBadge.description[lang]}
                  </p>

                  {/* 미션 안내 */}
                  <div className="w-full rounded-xl bg-secondary/60 p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-[#007AFF]" />
                      <span className="text-[12px] font-semibold">
                        {lang === 'ko' ? '미션 안내' : 'Mission Guide'}
                      </span>
                    </div>
                    <p className="text-[12px] text-muted-foreground">
                      {getMissionHint(selectedBadge)}
                    </p>

                    {/* 진행률 */}
                    {selectedBadge.condition.type !== 'special' && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-muted-foreground">{lang === 'ko' ? '진행률' : 'Progress'}</span>
                          <span className="font-semibold" style={{ color: isEarned ? '#34C759' : '#007AFF' }}>
                            {current}/{target} ({percent}%)
                          </span>
                        </div>
                        <Progress value={percent} className="h-2" />
                      </div>
                    )}
                  </div>

                  <p className="text-[12px] text-[#FF9500] font-medium">
                    {t('achievements.xpReward', { xp: selectedBadge.xpReward })}
                  </p>

                  {isEarned && (
                    <div className="rounded-full bg-[#34C759]/10 px-4 py-1.5">
                      <span className="text-[12px] font-semibold text-[#34C759]">
                        {lang === 'ko' ? '✅ 달성 완료!' : '✅ Achieved!'}
                      </span>
                    </div>
                  )}
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}

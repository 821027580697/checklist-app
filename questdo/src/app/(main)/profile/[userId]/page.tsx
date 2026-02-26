// 다른 사용자 프로필 페이지
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuthStore } from '@/stores/authStore';
import { BADGES } from '@/constants/badges';
import { RARITY_COLORS } from '@/types/badge';
import {
  ArrowLeft,
  Trophy,
  Flame,
  CheckCircle2,
  Repeat,
  Calendar,
  UserPlus,
  UserCheck,
} from 'lucide-react';

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { t, language } = useTranslation();
  const currentUser = useAuthStore((state) => state.user);
  const lang = language as 'ko' | 'en';
  const [isFollowing, setIsFollowing] = useState(false);

  // 데모 유저 프로필 (실제로는 Firestore에서 userId로 조회)
  const demoUser = {
    uid: params.userId as string,
    nickname: '할일마스터',
    avatarUrl: '',
    bio: lang === 'ko' ? '매일 꾸준히 성장하는 중! 🚀' : 'Growing every day! 🚀',
    level: 12,
    title: lang === 'ko' ? '할 일 전사' : 'Task Warrior',
    totalXp: 2400,
    followersCount: 45,
    followingCount: 32,
    badges: ['first-task', 'week-warrior', 'level-5'],
    stats: {
      totalCompleted: 156,
      currentStreak: 14,
      longestStreak: 28,
      totalHabitChecks: 230,
    },
  };

  const isOwnProfile = currentUser?.uid === demoUser.uid;
  const earnedBadges = BADGES.filter((b) => demoUser.badges.includes(b.id));

  const handleFollow = () => {
    setIsFollowing(!isFollowing);
    // TODO: Firestore 팔로우/언팔로우 처리
  };

  return (
    <div className="space-y-6">
      {/* 상단 네비 */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          {t('common.back')}
        </Button>
      </motion.div>

      {/* 프로필 카드 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              {/* 아바타 */}
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-purple-500 text-3xl font-bold text-white mb-3">
                {demoUser.nickname.charAt(0)}
              </div>

              {/* 닉네임 & 레벨 */}
              <h1 className="text-xl font-bold">{demoUser.nickname}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="rounded-full">
                  Lv.{demoUser.level}
                </Badge>
                <span className="text-sm text-muted-foreground">{demoUser.title}</span>
              </div>

              {/* 자기소개 */}
              {demoUser.bio && (
                <p className="mt-3 text-sm text-muted-foreground max-w-xs">
                  {demoUser.bio}
                </p>
              )}

              {/* 팔로워/팔로잉 */}
              <div className="flex items-center gap-6 mt-4">
                <div className="text-center">
                  <p className="text-lg font-bold">{demoUser.followersCount}</p>
                  <p className="text-xs text-muted-foreground">{t('feed.followers')}</p>
                </div>
                <Separator orientation="vertical" className="h-8" />
                <div className="text-center">
                  <p className="text-lg font-bold">{demoUser.followingCount}</p>
                  <p className="text-xs text-muted-foreground">{t('feed.followingCount')}</p>
                </div>
              </div>

              {/* 팔로우 버튼 */}
              {!isOwnProfile && (
                <Button
                  variant={isFollowing ? 'outline' : 'default'}
                  className="mt-4 rounded-full"
                  onClick={handleFollow}
                >
                  {isFollowing ? (
                    <>
                      <UserCheck className="mr-1 h-4 w-4" />
                      {t('feed.unfollow')}
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-1 h-4 w-4" />
                      {t('feed.follow')}
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: CheckCircle2, label: t('profile.totalCompleted'), value: demoUser.stats.totalCompleted, color: 'text-green-500' },
          { icon: Flame, label: t('profile.currentStreak'), value: `${demoUser.stats.currentStreak}${lang === 'ko' ? '일' : 'd'}`, color: 'text-orange-500' },
          { icon: Calendar, label: t('profile.longestStreak'), value: `${demoUser.stats.longestStreak}${lang === 'ko' ? '일' : 'd'}`, color: 'text-blue-500' },
          { icon: Repeat, label: t('profile.totalHabitChecks'), value: demoUser.stats.totalHabitChecks, color: 'text-purple-500' },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card>
              <CardContent className="p-4 text-center">
                <stat.icon className={`h-5 w-5 mx-auto mb-1 ${stat.color}`} />
                <p className="text-xl font-bold">{stat.value}</p>
                <p className="text-[10px] text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* 배지 진열장 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Trophy className="h-4 w-4 text-yellow-500" />
            {t('profile.badgeShowcase')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {earnedBadges.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              {lang === 'ko' ? '아직 획득한 배지가 없습니다' : 'No badges earned yet'}
            </p>
          ) : (
            <div className="flex flex-wrap gap-3">
              {earnedBadges.map((badge) => (
                <div
                  key={badge.id}
                  className="flex flex-col items-center gap-1 rounded-xl border p-2"
                  style={{ borderColor: RARITY_COLORS[badge.rarity] + '40' }}
                >
                  <span className="text-2xl">{badge.icon}</span>
                  <span className="text-[9px] text-muted-foreground">{badge.name[lang]}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

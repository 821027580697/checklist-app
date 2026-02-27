// 내 프로필 페이지 — 프로필 사진 업로드 지원
'use client';

import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useAuthStore } from '@/stores/authStore';
import { useTranslation } from '@/hooks/useTranslation';
import { getLevelInfo } from '@/lib/gamification/levelSystem';
import { BADGES } from '@/constants/badges';
import { RARITY_COLORS } from '@/types/badge';
import { uploadAvatar } from '@/lib/firebase/storage';
import { updateDocument } from '@/lib/firebase/firestore';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  Settings,
  Trophy,
  Flame,
  CheckCircle2,
  Repeat,
  Calendar,
  Camera,
  Loader2,
} from 'lucide-react';

export default function ProfilePage() {
  const { t, language } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const lang = language as 'ko' | 'en';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  if (!user) return null;

  const levelInfo = getLevelInfo(user.level, user.totalXp);
  const earnedBadges = BADGES.filter((b) => user.badges.includes(b.id));

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // 파일 형식 검증
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast.error(lang === 'ko' ? 'JPG, PNG, WebP, GIF 형식만 가능합니다' : 'Only JPG, PNG, WebP, GIF allowed');
      return;
    }

    // 파일 크기 검증 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error(lang === 'ko' ? '파일 크기는 5MB 이하여야 합니다' : 'File must be under 5MB');
      return;
    }

    setIsUploading(true);
    try {
      const { url, error } = await uploadAvatar(user.uid, file);
      if (error) throw error;
      if (!url) throw new Error('Upload failed');

      // Firestore 업데이트
      const { error: updateError } = await updateDocument('users', user.uid, {
        avatarUrl: url,
      });
      if (updateError) throw updateError;

      // 로컬 상태 업데이트
      setUser({ ...user, avatarUrl: url });
      toast.success(lang === 'ko' ? '프로필 사진이 변경되었습니다' : 'Profile photo updated');
    } catch (err) {
      console.error('Failed to upload avatar:', err);
      toast.error(lang === 'ko' ? '사진 업로드에 실패했습니다' : 'Failed to upload photo');
    } finally {
      setIsUploading(false);
      // 파일 input 리셋
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const hasPhotoUrl = user.avatarUrl?.startsWith('http');

  return (
    <div className="space-y-6">
      {/* 프로필 카드 */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              {/* 아바타 + 업로드 버튼 */}
              <div className="relative group">
                <div
                  onClick={handleAvatarClick}
                  className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-purple-500 text-4xl cursor-pointer overflow-hidden ring-4 ring-background shadow-lg transition-transform group-hover:scale-105"
                >
                  {isUploading ? (
                    <Loader2 className="h-8 w-8 text-white animate-spin" />
                  ) : hasPhotoUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.nickname}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-white font-bold">
                      {user.nickname?.charAt(0) || '?'}
                    </span>
                  )}
                </div>

                {/* 카메라 아이콘 오버레이 */}
                <button
                  onClick={handleAvatarClick}
                  disabled={isUploading}
                  className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md hover:bg-primary/90 transition-colors"
                >
                  <Camera className="h-3.5 w-3.5" />
                </button>

                {/* 숨겨진 파일 입력 */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>

              <p className="text-[11px] text-muted-foreground mt-2">
                {lang === 'ko' ? '사진을 탭하여 변경' : 'Tap to change photo'}
              </p>

              {/* 닉네임 & 레벨 */}
              <h1 className="text-xl font-bold mt-2">{user.nickname}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="rounded-full">
                  Lv.{user.level}
                </Badge>
                <span className="text-sm text-muted-foreground">{user.title}</span>
              </div>

              {/* 자기소개 */}
              {user.bio && (
                <p className="mt-3 text-sm text-muted-foreground max-w-xs">
                  {user.bio}
                </p>
              )}

              {/* XP 프로그레스 */}
              <div className="w-full max-w-xs mt-4">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                  <span>XP</span>
                  <span>{levelInfo.progressPercent}%</span>
                </div>
                <Progress value={levelInfo.progressPercent} className="h-2" />
              </div>

              {/* 팔로워/팔로잉 */}
              <div className="flex items-center gap-6 mt-4">
                <div className="text-center">
                  <p className="text-lg font-bold">{user.followersCount}</p>
                  <p className="text-xs text-muted-foreground">{t('feed.followers')}</p>
                </div>
                <Separator orientation="vertical" className="h-8" />
                <div className="text-center">
                  <p className="text-lg font-bold">{user.followingCount}</p>
                  <p className="text-xs text-muted-foreground">{t('feed.followingCount')}</p>
                </div>
              </div>

              {/* 설정 버튼 */}
              <Link href="/settings" className="mt-4">
                <Button variant="outline" size="sm" className="rounded-full">
                  <Settings className="mr-1 h-4 w-4" />
                  {t('profile.editProfile')}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: CheckCircle2, label: t('profile.totalCompleted'), value: user.stats.totalCompleted, color: 'text-green-500' },
          { icon: Flame, label: t('profile.currentStreak'), value: `${user.stats.currentStreak}${lang === 'ko' ? '일' : 'd'}`, color: 'text-orange-500' },
          { icon: Calendar, label: t('profile.longestStreak'), value: `${user.stats.longestStreak}${lang === 'ko' ? '일' : 'd'}`, color: 'text-blue-500' },
          { icon: Repeat, label: t('profile.totalHabitChecks'), value: user.stats.totalHabitChecks, color: 'text-purple-500' },
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
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="h-4 w-4 text-yellow-500" />
              {t('profile.badgeShowcase')}
            </CardTitle>
            <Link href="/achievements">
              <Button variant="ghost" size="sm" className="text-xs">
                {t('common.seeAll')}
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {earnedBadges.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              {lang === 'ko' ? '아직 획득한 배지가 없습니다' : 'No badges earned yet'}
            </p>
          ) : (
            <div className="flex flex-wrap gap-3">
              {earnedBadges.slice(0, 8).map((badge) => (
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

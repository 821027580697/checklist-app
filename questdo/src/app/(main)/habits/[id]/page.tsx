// 습관 상세 페이지
'use client';

import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useHabitStore } from '@/stores/habitStore';
import { useTranslation } from '@/hooks/useTranslation';
import { StreakCalendar } from '@/components/habits/StreakCalendar';
import { useState } from 'react';
import { HabitForm } from '@/components/habits/HabitForm';
import {
  ArrowLeft,
  Flame,
  Trophy,
  Calendar,
  Edit3,
  AlertTriangle,
} from 'lucide-react';

export default function HabitDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { t, language } = useTranslation();
  const habits = useHabitStore((state) => state.habits);
  const lang = language as 'ko' | 'en';
  const [showEdit, setShowEdit] = useState(false);

  const habit = habits.find((h) => h.id === params.id);

  if (!habit) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertTriangle className="h-10 w-10 text-muted-foreground mb-4" />
        <p className="text-sm text-muted-foreground">
          {lang === 'ko' ? '습관을 찾을 수 없습니다' : 'Habit not found'}
        </p>
        <Button
          variant="outline"
          className="mt-4 rounded-xl"
          onClick={() => router.push('/habits')}
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          {lang === 'ko' ? '목록으로 돌아가기' : 'Back to list'}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 상단 네비 */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/habits')}
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          {t('common.back')}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="rounded-xl"
          onClick={() => setShowEdit(true)}
        >
          <Edit3 className="mr-1 h-4 w-4" />
          {t('common.edit')}
        </Button>
      </motion.div>

      {/* 습관 헤더 카드 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center gap-3">
              <div
                className="flex h-16 w-16 items-center justify-center rounded-2xl text-3xl"
                style={{ backgroundColor: habit.color + '20' }}
              >
                {habit.icon}
              </div>
              <h1 className="text-xl font-bold">{habit.title}</h1>
              {habit.description && (
                <p className="text-sm text-muted-foreground max-w-xs">{habit.description}</p>
              )}
              <div className="flex items-center gap-4">
                <Badge variant="secondary" className="rounded-full">
                  {habit.frequency.type === 'daily'
                    ? t('habits.daily')
                    : habit.frequency.type === 'weekly'
                      ? t('habits.weekly')
                      : t('habits.custom')}
                </Badge>
                {!habit.isActive && (
                  <Badge variant="outline" className="rounded-full text-muted-foreground">
                    {lang === 'ko' ? '비활성' : 'Inactive'}
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-3 gap-3">
        {[
          {
            icon: Flame,
            label: lang === 'ko' ? '현재 스트릭' : 'Current Streak',
            value: `${habit.streak}${lang === 'ko' ? '일' : 'd'}`,
            color: 'text-orange-500',
          },
          {
            icon: Trophy,
            label: lang === 'ko' ? '최장 스트릭' : 'Best Streak',
            value: `${habit.longestStreak}${lang === 'ko' ? '일' : 'd'}`,
            color: 'text-yellow-500',
          },
          {
            icon: Calendar,
            label: lang === 'ko' ? '총 체크' : 'Total Checks',
            value: String(habit.totalChecks),
            color: 'text-blue-500',
          },
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

      {/* 스트릭 캘린더 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t('habits.streakCalendar')}</CardTitle>
        </CardHeader>
        <CardContent>
          <StreakCalendar completedDates={habit.completedDates} />
        </CardContent>
      </Card>

      {/* 편집 모달 */}
      <HabitForm
        open={showEdit}
        onClose={() => setShowEdit(false)}
        onSubmit={() => setShowEdit(false)}
        isEdit
        initialData={{
          title: habit.title,
          description: habit.description,
          category: habit.category,
          icon: habit.icon,
          color: habit.color,
          frequencyType: habit.frequency.type,
          daysOfWeek: habit.frequency.daysOfWeek,
          reminderTime: habit.reminderTime ?? '',
        }}
      />
    </div>
  );
}

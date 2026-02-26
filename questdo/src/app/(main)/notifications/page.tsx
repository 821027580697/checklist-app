// 알림 센터 페이지
'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useNotificationStore } from '@/stores/notificationStore';
import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/lib/utils';
import { Bell, CheckCheck, Trophy, Heart, MessageCircle, UserPlus, Target } from 'lucide-react';
import { NotificationType } from '@/types/notification';

// 알림 아이콘 매핑
const NOTIF_ICONS: Record<NotificationType, React.ElementType> = {
  task_reminder: Target,
  habit_reminder: Target,
  like: Heart,
  comment: MessageCircle,
  follow: UserPlus,
  badge: Trophy,
  level_up: Trophy,
  challenge: Target,
};

// 데모용 알림 표시 타입
interface DisplayNotification {
  id: string;
  type: NotificationType;
  title: { ko: string; en: string };
  message: { ko: string; en: string };
  isRead: boolean;
  timeAgo: string;
}

export default function NotificationsPage() {
  const { t, language } = useTranslation();
  const { notifications, markAllAsRead, markAsRead } = useNotificationStore();
  const lang = language as 'ko' | 'en';

  // 데모 알림 데이터
  const demoNotifications: DisplayNotification[] = [
    {
      id: '1',
      type: 'badge',
      title: { ko: '배지 획득', en: 'Badge Earned' },
      message: { ko: "🏅 '일주일 전사' 배지를 획득했습니다!", en: "🏅 You earned the 'Week Warrior' badge!" },
      isRead: false,
      timeAgo: lang === 'ko' ? '1시간 전' : '1 hour ago',
    },
    {
      id: '2',
      type: 'like',
      title: { ko: '좋아요', en: 'Like' },
      message: { ko: '❤️ 김철수님이 회원님의 포스트를 좋아합니다', en: '❤️ Someone liked your post' },
      isRead: false,
      timeAgo: lang === 'ko' ? '3시간 전' : '3 hours ago',
    },
    {
      id: '3',
      type: 'task_reminder',
      title: { ko: '할 일 리마인더', en: 'Task Reminder' },
      message: { ko: "📝 '프로젝트 회의 준비' 마감 1시간 전입니다", en: "📝 'Project meeting prep' is due in 1 hour" },
      isRead: true,
      timeAgo: lang === 'ko' ? '5시간 전' : '5 hours ago',
    },
    {
      id: '4',
      type: 'level_up',
      title: { ko: '레벨업', en: 'Level Up' },
      message: { ko: '⬆️ 레벨 12 달성! 새 칭호: 할 일 전사', en: '⬆️ Level 12 reached! New title: Task Warrior' },
      isRead: true,
      timeAgo: lang === 'ko' ? '1일 전' : '1 day ago',
    },
  ];

  // Firestore 알림을 DisplayNotification으로 변환
  const convertedNotifications: DisplayNotification[] = notifications.map((n) => ({
    id: n.id,
    type: n.type,
    title: n.title,
    message: n.message,
    isRead: n.isRead,
    timeAgo: '', // 실제로는 createdAt에서 계산
  }));

  const displayNotifications = convertedNotifications.length > 0 ? convertedNotifications : demoNotifications;
  const unreadCount = displayNotifications.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold">{t('notifications.title')}</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-muted-foreground">
              {unreadCount} {lang === 'ko' ? '개 읽지 않음' : 'unread'}
            </p>
          )}
        </div>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={markAllAsRead}
            className="text-xs"
          >
            <CheckCheck className="mr-1 h-4 w-4" />
            {t('notifications.markAllRead')}
          </Button>
        )}
      </motion.div>

      {/* 알림 목록 */}
      {displayNotifications.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <Bell className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-sm text-muted-foreground">
            {t('notifications.noNotifications')}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {displayNotifications.map((notif, index) => {
            const Icon = NOTIF_ICONS[notif.type] || Bell;

            return (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  className={cn(
                    'transition-all duration-200 cursor-pointer hover:shadow-sm',
                    !notif.isRead && 'border-primary/20 bg-primary/5',
                  )}
                  onClick={() => markAsRead(notif.id)}
                >
                  <CardContent className="flex items-start gap-3 p-4">
                    <div className={cn(
                      'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                      !notif.isRead ? 'bg-primary/10' : 'bg-muted',
                    )}>
                      <Icon className={cn('h-4 w-4', !notif.isRead ? 'text-primary' : 'text-muted-foreground')} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-sm', !notif.isRead && 'font-semibold')}>
                        {notif.message[lang]}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {notif.timeAgo}
                      </p>
                    </div>
                    {!notif.isRead && (
                      <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

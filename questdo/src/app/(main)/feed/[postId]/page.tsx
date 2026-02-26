// 포스트 상세 페이지
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useTranslation } from '@/hooks/useTranslation';
import { useFeedStore } from '@/stores/feedStore';
import {
  ArrowLeft,
  Heart,
  Flame,
  MessageCircle,
  Send,
  AlertTriangle,
} from 'lucide-react';

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { t, language } = useTranslation();
  const lang = language as 'ko' | 'en';
  const posts = useFeedStore((state) => state.posts);
  const [comment, setComment] = useState('');

  // 데모 포스트 (실제로는 Firestore에서 조회)
  const demoPost = {
    id: params.postId as string,
    userNickname: '할일마스터',
    userLevel: 12,
    userTitle: '할 일 전사',
    userAvatar: '🧑‍💻',
    content: {
      text: '오늘도 미라클 모닝 성공! 3일 연속 달성 중 🔥',
      taskTitle: '아침 5시 기상',
    },
    reactions: { likes: 24, fires: 12, comments: 5 },
    timeAgo: lang === 'ko' ? '2시간 전' : '2 hours ago',
    comments: [
      {
        id: 'c1',
        userNickname: '코딩러버',
        userAvatar: '🧑‍🎨',
        text: '대단해요! 저도 도전해볼게요 💪',
        timeAgo: lang === 'ko' ? '1시간 전' : '1 hour ago',
      },
      {
        id: 'c2',
        userNickname: '운동왕',
        userAvatar: '🏋️',
        text: '화이팅! 🔥',
        timeAgo: lang === 'ko' ? '30분 전' : '30 min ago',
      },
    ],
  };

  const post = posts.find((p) => p.id === params.postId) ? posts.find((p) => p.id === params.postId) : null;
  const displayPost = demoPost; // 실제로는 post || Firestore 조회

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
          onClick={() => router.push('/feed')}
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          {t('common.back')}
        </Button>
      </motion.div>

      {/* 포스트 카드 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card>
          <CardContent className="p-4">
            {/* 유저 헤더 */}
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-purple-500 text-xl">
                {displayPost.userAvatar}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{displayPost.userNickname}</span>
                  <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                    Lv.{displayPost.userLevel}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {displayPost.userTitle} · {displayPost.timeAgo}
                </p>
              </div>
            </div>

            {/* 연결된 할 일 */}
            {displayPost.content.taskTitle && (
              <div className="mb-3 rounded-xl bg-green-50 dark:bg-green-900/20 p-3 text-sm">
                ✅ &quot;{displayPost.content.taskTitle}&quot; {t('tasks.completed')}!
              </div>
            )}

            {/* 본문 */}
            <p className="text-sm leading-relaxed mb-4">{displayPost.content.text}</p>

            {/* 리액션 바 */}
            <div className="flex items-center gap-6 border-t border-b border-border py-3">
              <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-red-500 transition-colors">
                <Heart className="h-5 w-5" />
                <span>{displayPost.reactions.likes}</span>
              </button>
              <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-orange-500 transition-colors">
                <Flame className="h-5 w-5" />
                <span>{displayPost.reactions.fires}</span>
              </button>
              <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-blue-500 transition-colors">
                <MessageCircle className="h-5 w-5" />
                <span>{displayPost.reactions.comments}</span>
              </button>
            </div>

            {/* 댓글 목록 */}
            <div className="mt-4 space-y-3">
              {displayPost.comments.map((c) => (
                <div key={c.id} className="flex items-start gap-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm">
                    {c.userAvatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="rounded-xl bg-muted/50 p-2.5">
                      <span className="text-xs font-semibold">{c.userNickname}</span>
                      <p className="text-sm mt-0.5">{c.text}</p>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5 ml-2">{c.timeAgo}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* 댓글 입력 */}
            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border">
              <Input
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={t('feed.commentPlaceholder')}
                className="rounded-full text-sm"
              />
              <Button
                size="icon"
                className="rounded-full shrink-0 h-9 w-9"
                disabled={!comment.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

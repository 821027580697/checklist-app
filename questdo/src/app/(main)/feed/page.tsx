// 소셜 피드 — Apple 스타일
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/hooks/useTranslation';
import { useFeedStore } from '@/stores/feedStore';
import { Heart, Flame, MessageCircle, Plus, ImagePlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

export default function FeedPage() {
  const { t } = useTranslation();
  const { posts, activeTab, setActiveTab } = useFeedStore();
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [postContent, setPostContent] = useState('');

  const demoPosts = [
    {
      id: '1',
      userNickname: '할일마스터',
      userLevel: 12,
      userTitle: '할 일 전사',
      userAvatar: '🧑‍💻',
      type: 'completion' as const,
      content: {
        text: '오늘도 미라클 모닝 성공! 3일 연속 달성 중 🔥',
        taskTitle: '아침 5시 기상',
        category: '건강',
      },
      reactions: { likes: 24, fires: 12, comments: 5 },
      timeAgo: '2시간 전',
    },
    {
      id: '2',
      userNickname: '코딩러버',
      userLevel: 8,
      userTitle: '성실한 실행자',
      userAvatar: '🧑‍🎨',
      type: 'badge' as const,
      content: {
        text: '일주일 전사 배지 획득! 💪',
        badgeName: '일주일 전사',
        badgeIcon: '⚔️',
      },
      reactions: { likes: 18, fires: 8, comments: 3 },
      timeAgo: '5시간 전',
    },
  ];

  return (
    <div className="space-y-5">
      {/* 페이지 헤더 */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="flex items-center justify-between"
      >
        <h1 className="text-[28px] font-bold tracking-tight">{t('feed.title')}</h1>
        <Button
          onClick={() => setShowCreatePost(true)}
          className="h-9 rounded-full px-4 text-[13px] font-medium"
          size="sm"
        >
          <Plus className="mr-1 h-4 w-4" />
          {t('feed.createPost')}
        </Button>
      </motion.div>

      {/* 탭 */}
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as 'explore' | 'following')}
      >
        <TabsList className="w-full rounded-xl bg-secondary/60 p-1">
          <TabsTrigger value="explore" className="flex-1 rounded-lg text-[13px] font-medium">
            {t('feed.explore')}
          </TabsTrigger>
          <TabsTrigger value="following" className="flex-1 rounded-lg text-[13px] font-medium">
            {t('feed.following')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="explore" className="space-y-3 mt-4">
          {demoPosts.map((post, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <div className="apple-card overflow-hidden p-5">
                {/* 포스트 헤더 */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#007AFF] to-[#5856D6] text-base">
                    {post.userAvatar}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[13px] font-semibold tracking-tight">{post.userNickname}</span>
                      <Badge variant="secondary" className="text-[10px] h-4 px-1.5 rounded-md font-medium">
                        Lv.{post.userLevel}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground">{post.timeAgo}</p>
                  </div>
                </div>

                {/* 연결된 할 일 / 배지 */}
                {post.content.taskTitle && (
                  <div className="mb-3 rounded-xl bg-[#34C759]/8 p-2.5 text-[13px]">
                    ✅ &quot;{post.content.taskTitle}&quot; {t('tasks.completed')}!
                  </div>
                )}
                {post.content.badgeName && (
                  <div className="mb-3 rounded-xl bg-[#FF9500]/8 p-2.5 text-[13px] flex items-center gap-2">
                    <span className="text-lg">{post.content.badgeIcon}</span>
                    {post.content.badgeName} {t('achievements.achieved')}!
                  </div>
                )}

                {/* 본문 */}
                <p className="text-[14px] leading-relaxed mb-4">{post.content.text}</p>

                {/* 리액션 바 */}
                <div className="flex items-center gap-5 pt-3 border-t border-border/50">
                  <button className="flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-[#FF3B30] transition-colors">
                    <Heart className="h-4 w-4" />
                    {post.reactions.likes}
                  </button>
                  <button className="flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-[#FF9500] transition-colors">
                    <Flame className="h-4 w-4" />
                    {post.reactions.fires}
                  </button>
                  <button className="flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-[#007AFF] transition-colors">
                    <MessageCircle className="h-4 w-4" />
                    {post.reactions.comments}
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </TabsContent>

        <TabsContent value="following" className="mt-4">
          <div className="flex flex-col items-center py-16 text-center">
            <p className="text-[14px] text-muted-foreground">{t('feed.noFeed')}</p>
            <p className="text-[12px] text-muted-foreground/60 mt-1">
              {t('feed.explore')} 탭에서 다른 사용자를 팔로우해보세요
            </p>
          </div>
        </TabsContent>
      </Tabs>

      {/* 포스트 작성 모달 */}
      <Dialog open={showCreatePost} onOpenChange={setShowCreatePost}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-[17px]">{t('feed.createPost')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              placeholder={t('feed.writeContent')}
              className="min-h-[120px] rounded-xl resize-none text-[14px] bg-secondary/50 border-0"
              maxLength={300}
            />
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="rounded-xl text-[12px] h-8">
                <ImagePlus className="mr-1 h-3.5 w-3.5" />
                {t('feed.uploadPhoto')}
              </Button>
              <Button variant="outline" size="sm" className="rounded-xl text-[12px] h-8">
                ✅ {t('feed.selectTask')}
              </Button>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 h-10 rounded-xl text-[14px]"
                onClick={() => setShowCreatePost(false)}
              >
                {t('common.cancel')}
              </Button>
              <Button className="flex-1 h-10 rounded-xl text-[14px] font-semibold">
                {t('feed.post')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 플로팅 추가 버튼 (모바일) */}
      <Button
        onClick={() => setShowCreatePost(true)}
        className="fixed bottom-24 right-5 h-[52px] w-[52px] rounded-full shadow-lg shadow-primary/30 md:hidden z-30"
        size="icon"
      >
        <Plus className="h-5 w-5" />
      </Button>
    </div>
  );
}

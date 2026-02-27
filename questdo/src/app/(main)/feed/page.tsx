// 소셜 피드 — Firestore 기반 실시간 소셜 공간
'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuthStore } from '@/stores/authStore';
import {
  Heart,
  Flame,
  MessageCircle,
  Plus,
  Send,
  Users,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { db } from '@/lib/firebase/config';
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
  serverTimestamp,
  updateDoc,
  doc,
  arrayUnion,
  arrayRemove,
  where,
  increment,
  Timestamp,
} from 'firebase/firestore';
import { Post, Comment } from '@/types/post';

export default function FeedPage() {
  const { t, language } = useTranslation();
  const lang = language as 'ko' | 'en';
  const user = useAuthStore((state) => state.user);

  const [activeTab, setActiveTab] = useState<'explore' | 'following'>('explore');
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [isSubmittingPost, setIsSubmittingPost] = useState(false);

  // 댓글 관련 상태
  const [showComments, setShowComments] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [isLoadingComments, setIsLoadingComments] = useState(false);

  // 게시글 로드
  const loadPosts = useCallback(async () => {
    if (!db) return;
    setIsLoadingPosts(true);
    try {
      const q = query(
        collection(db, 'posts'),
        orderBy('createdAt', 'desc'),
        limit(30),
      );
      const snapshot = await getDocs(q);
      const loadedPosts = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Post[];
      setPosts(loadedPosts);
    } catch (err) {
      console.error('Failed to load posts:', err);
      toast.error(lang === 'ko' ? '게시글을 불러오지 못했습니다' : 'Failed to load posts');
    } finally {
      setIsLoadingPosts(false);
    }
  }, [lang]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  // 게시글 작성
  const handleCreatePost = async () => {
    if (!user || !db || !postContent.trim()) return;
    setIsSubmittingPost(true);
    try {
      const newPost = {
        userId: user.uid,
        userNickname: user.nickname,
        userAvatar: user.avatarUrl || user.nickname?.charAt(0) || '?',
        userLevel: user.level,
        userTitle: user.title,
        type: 'general' as const,
        content: {
          text: postContent.trim(),
          imageUrl: null,
          taskRef: null,
          badgeRef: null,
          milestoneType: null,
        },
        reactions: {
          likes: [],
          cheers: [],
          fires: [],
        },
        totalReactions: 0,
        commentsCount: 0,
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'posts'), newPost);
      setPostContent('');
      setShowCreatePost(false);
      toast.success(lang === 'ko' ? '게시글이 작성되었습니다' : 'Post created');
      loadPosts();
    } catch (err) {
      console.error('Failed to create post:', err);
      toast.error(lang === 'ko' ? '게시글 작성에 실패했습니다' : 'Failed to create post');
    } finally {
      setIsSubmittingPost(false);
    }
  };

  // 리액션 토글
  const handleReaction = async (postId: string, type: 'likes' | 'fires') => {
    if (!user || !db) return;
    try {
      const postRef = doc(db, 'posts', postId);
      const post = posts.find((p) => p.id === postId);
      if (!post) return;

      const reactions = post.reactions?.[type] || [];
      const isReacted = reactions.includes(user.uid);

      await updateDoc(postRef, {
        [`reactions.${type}`]: isReacted ? arrayRemove(user.uid) : arrayUnion(user.uid),
        totalReactions: increment(isReacted ? -1 : 1),
      });

      // 낙관적 업데이트
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id !== postId) return p;
          const updatedReactions = isReacted
            ? (p.reactions?.[type] || []).filter((id: string) => id !== user.uid)
            : [...(p.reactions?.[type] || []), user.uid];
          return {
            ...p,
            reactions: { ...p.reactions, [type]: updatedReactions },
            totalReactions: p.totalReactions + (isReacted ? -1 : 1),
          };
        }),
      );
    } catch (err) {
      console.error('Failed to react:', err);
      toast.error(lang === 'ko' ? '반응 처리에 실패했습니다' : 'Failed to update reaction');
    }
  };

  // 댓글 로드
  const loadComments = async (postId: string) => {
    if (!db) return;
    setIsLoadingComments(true);
    try {
      const q = query(
        collection(db, 'comments'),
        where('postId', '==', postId),
        orderBy('createdAt', 'asc'),
        limit(50),
      );
      const snapshot = await getDocs(q);
      const loadedComments = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Comment[];
      setComments(loadedComments);
    } catch (err) {
      console.error('Failed to load comments:', err);
      toast.error(lang === 'ko' ? '댓글을 불러오지 못했습니다' : 'Failed to load comments');
    } finally {
      setIsLoadingComments(false);
    }
  };

  // 댓글 작성
  const handleAddComment = async (postId: string) => {
    if (!user || !db || !commentText.trim()) return;
    try {
      const newComment = {
        postId,
        userId: user.uid,
        userNickname: user.nickname,
        userAvatar: user.avatarUrl || user.nickname?.charAt(0) || '?',
        text: commentText.trim(),
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'comments'), newComment);
      
      // 게시글의 댓글 수 증가
      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, { commentsCount: increment(1) });

      // 낙관적 업데이트
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, commentsCount: (p.commentsCount || 0) + 1 } : p,
        ),
      );

      setCommentText('');
      loadComments(postId);
      toast.success(lang === 'ko' ? '댓글이 작성되었습니다' : 'Comment added');
    } catch (err) {
      console.error('Failed to add comment:', err);
      toast.error(lang === 'ko' ? '댓글 작성에 실패했습니다' : 'Failed to add comment');
    }
  };

  // 댓글 열기/닫기
  const toggleComments = (postId: string) => {
    if (showComments === postId) {
      setShowComments(null);
      setComments([]);
    } else {
      setShowComments(postId);
      loadComments(postId);
    }
  };

  // 시간 표시
  const getTimeAgo = (timestamp: Timestamp | null | undefined): string => {
    if (!timestamp) return '';
    try {
      const date = timestamp.toDate();
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMin = Math.floor(diffMs / 60000);
      const diffHour = Math.floor(diffMin / 60);
      const diffDay = Math.floor(diffHour / 24);

      if (diffMin < 1) return lang === 'ko' ? '방금 전' : 'Just now';
      if (diffMin < 60) return `${diffMin}${lang === 'ko' ? '분 전' : 'm ago'}`;
      if (diffHour < 24) return `${diffHour}${lang === 'ko' ? '시간 전' : 'h ago'}`;
      return `${diffDay}${lang === 'ko' ? '일 전' : 'd ago'}`;
    } catch {
      return '';
    }
  };

  return (
    <div className="space-y-5">
      {/* 페이지 헤더 */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-[28px] font-bold tracking-tight">{t('feed.title')}</h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            {lang === 'ko' ? '함께 성장하는 커뮤니티' : 'Growing together'}
          </p>
        </div>
        <Button
          onClick={() => setShowCreatePost(true)}
          className="h-9 rounded-full px-4 text-[13px] font-medium"
          size="sm"
        >
          <Plus className="mr-1 h-4 w-4" />
          {lang === 'ko' ? '글쓰기' : 'Write'}
        </Button>
      </motion.div>

      {/* 탭 */}
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as 'explore' | 'following')}
      >
        <TabsList className="w-full rounded-xl bg-secondary/60 p-1">
          <TabsTrigger value="explore" className="flex-1 rounded-lg text-[13px] font-medium">
            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
            {t('feed.explore')}
          </TabsTrigger>
          <TabsTrigger value="following" className="flex-1 rounded-lg text-[13px] font-medium">
            <Users className="mr-1.5 h-3.5 w-3.5" />
            {t('feed.following')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="explore" className="space-y-3 mt-4">
          {isLoadingPosts ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-6 w-6 animate-spin rounded-full border-[2px] border-primary/20 border-t-primary" />
            </div>
          ) : posts.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary dark:bg-[#2C2C2E] mb-4">
                <Users className="h-7 w-7 text-muted-foreground" />
              </div>
              <p className="text-[15px] font-medium">
                {lang === 'ko' ? '아직 게시글이 없습니다' : 'No posts yet'}
              </p>
              <p className="text-[13px] text-muted-foreground mt-1.5">
                {lang === 'ko' ? '첫 번째 게시글을 작성해보세요!' : 'Write the first post!'}
              </p>
              <Button
                onClick={() => setShowCreatePost(true)}
                className="mt-4 rounded-full text-[13px]"
                size="sm"
              >
                <Plus className="mr-1 h-4 w-4" />
                {lang === 'ko' ? '글쓰기' : 'Write'}
              </Button>
            </div>
          ) : (
            posts.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04, duration: 0.4 }}
              >
                <div className="rounded-2xl border border-border/50 bg-card overflow-hidden p-5 transition-shadow hover:shadow-sm">
                  {/* 포스트 헤더 */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#007AFF] to-[#5856D6] text-lg shrink-0">
                      {post.userAvatar || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[14px] font-semibold tracking-tight truncate">{post.userNickname}</span>
                        <Badge variant="secondary" className="text-[10px] h-4 px-1.5 rounded-md font-medium shrink-0">
                          Lv.{post.userLevel}
                        </Badge>
                        {post.userTitle && (
                          <span className="text-[10px] text-muted-foreground truncate">{post.userTitle}</span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground">{getTimeAgo(post.createdAt)}</p>
                    </div>
                  </div>

                  {/* 연결된 할 일 / 배지 */}
                  {post.content?.taskRef && (
                    <div className="mb-3 rounded-xl bg-[#34C759]/8 dark:bg-[#34C759]/15 p-3 text-[13px] font-medium">
                      ✅ &quot;{post.content.taskRef.title}&quot; {lang === 'ko' ? '완료!' : 'completed!'}
                    </div>
                  )}
                  {post.content?.badgeRef && (
                    <div className="mb-3 rounded-xl bg-[#FF9500]/8 dark:bg-[#FF9500]/15 p-3 text-[13px] flex items-center gap-2 font-medium">
                      <span className="text-lg">{post.content.badgeRef.icon}</span>
                      {post.content.badgeRef.name} {lang === 'ko' ? '획득!' : 'earned!'}
                    </div>
                  )}

                  {/* 본문 */}
                  <p className="text-[14px] leading-relaxed whitespace-pre-wrap">{post.content?.text}</p>

                  {/* 리액션 바 */}
                  <div className="flex items-center gap-4 pt-4 mt-4 border-t border-border/30">
                    <button
                      onClick={() => handleReaction(post.id, 'likes')}
                      className={cn(
                        'flex items-center gap-1.5 text-[12px] transition-colors rounded-full px-2.5 py-1 -ml-2.5',
                        (post.reactions?.likes || []).includes(user?.uid || '')
                          ? 'text-[#FF3B30] bg-[#FF3B30]/8'
                          : 'text-muted-foreground hover:text-[#FF3B30] hover:bg-[#FF3B30]/5',
                      )}
                    >
                      <Heart className={cn('h-4 w-4', (post.reactions?.likes || []).includes(user?.uid || '') && 'fill-current')} />
                      {(post.reactions?.likes || []).length || ''}
                    </button>
                    <button
                      onClick={() => handleReaction(post.id, 'fires')}
                      className={cn(
                        'flex items-center gap-1.5 text-[12px] transition-colors rounded-full px-2.5 py-1',
                        (post.reactions?.fires || []).includes(user?.uid || '')
                          ? 'text-[#FF9500] bg-[#FF9500]/8'
                          : 'text-muted-foreground hover:text-[#FF9500] hover:bg-[#FF9500]/5',
                      )}
                    >
                      <Flame className={cn('h-4 w-4', (post.reactions?.fires || []).includes(user?.uid || '') && 'fill-current')} />
                      {(post.reactions?.fires || []).length || ''}
                    </button>
                    <button
                      onClick={() => toggleComments(post.id)}
                      className={cn(
                        'flex items-center gap-1.5 text-[12px] transition-colors rounded-full px-2.5 py-1',
                        showComments === post.id
                          ? 'text-[#007AFF] bg-[#007AFF]/8'
                          : 'text-muted-foreground hover:text-[#007AFF] hover:bg-[#007AFF]/5',
                      )}
                    >
                      <MessageCircle className="h-4 w-4" />
                      {post.commentsCount || ''}
                    </button>
                  </div>

                  {/* 댓글 섹션 */}
                  <AnimatePresence>
                    {showComments === post.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-4 pt-3 border-t border-border/30 space-y-3">
                          {/* 댓글 목록 */}
                          {isLoadingComments ? (
                            <div className="flex justify-center py-3">
                              <div className="h-4 w-4 animate-spin rounded-full border-[2px] border-primary/20 border-t-primary" />
                            </div>
                          ) : comments.length === 0 ? (
                            <p className="text-[12px] text-muted-foreground text-center py-2">
                              {lang === 'ko' ? '아직 댓글이 없습니다' : 'No comments yet'}
                            </p>
                          ) : (
                            comments.map((comment) => (
                              <div key={comment.id} className="flex items-start gap-2">
                                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#007AFF]/30 to-[#5856D6]/30 text-[10px]">
                                  {comment.userAvatar || '?'}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="rounded-xl bg-secondary dark:bg-[#2C2C2E] px-3 py-2">
                                    <span className="text-[11px] font-semibold">{comment.userNickname}</span>
                                    <p className="text-[12px] leading-relaxed mt-0.5">{comment.text}</p>
                                  </div>
                                  <p className="text-[10px] text-muted-foreground mt-1 pl-1">{getTimeAgo(comment.createdAt)}</p>
                                </div>
                              </div>
                            ))
                          )}

                          {/* 댓글 입력 */}
                          <div className="flex items-center gap-2">
                            <Input
                              value={commentText}
                              onChange={(e) => setCommentText(e.target.value)}
                              placeholder={lang === 'ko' ? '댓글을 입력하세요...' : 'Write a comment...'}
                              className="flex-1 h-9 rounded-full text-[13px] bg-secondary dark:bg-[#2C2C2E] border-0"
                              maxLength={200}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  handleAddComment(post.id);
                                }
                              }}
                            />
                            <Button
                              size="icon"
                              className="h-9 w-9 rounded-full shrink-0"
                              onClick={() => handleAddComment(post.id)}
                              disabled={!commentText.trim()}
                            >
                              <Send className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            ))
          )}
        </TabsContent>

        <TabsContent value="following" className="mt-4">
          <div className="flex flex-col items-center py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary dark:bg-[#2C2C2E] mb-4">
              <Users className="h-7 w-7 text-muted-foreground" />
            </div>
            <p className="text-[15px] font-medium">
              {lang === 'ko' ? '팔로잉 피드' : 'Following Feed'}
            </p>
            <p className="text-[13px] text-muted-foreground mt-1.5 max-w-xs">
              {lang === 'ko'
                ? '탐색 탭에서 다른 사용자의 게시글에 반응하고 소통해보세요'
                : 'Interact with posts in the Explore tab'}
            </p>
          </div>
        </TabsContent>
      </Tabs>

      {/* 포스트 작성 모달 */}
      <Dialog open={showCreatePost} onOpenChange={setShowCreatePost}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-[17px]">{lang === 'ko' ? '새 게시글' : 'New Post'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* 작성자 정보 */}
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#007AFF] to-[#5856D6] text-sm">
                {user?.avatarUrl || user?.nickname?.charAt(0) || '?'}
              </div>
              <div>
                <p className="text-[13px] font-semibold">{user?.nickname}</p>
                <p className="text-[11px] text-muted-foreground">Lv.{user?.level || 1} · {user?.title || ''}</p>
              </div>
            </div>

            <Textarea
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              placeholder={lang === 'ko' ? '오늘의 성과나 생각을 공유해보세요...' : 'Share your thoughts...'}
              className="min-h-[120px] rounded-xl resize-none text-[14px] bg-secondary dark:bg-[#2C2C2E] border-0 focus-visible:ring-1 focus-visible:ring-primary"
              maxLength={300}
            />

            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">
                {postContent.length}/300
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="h-9 rounded-xl text-[13px]"
                  onClick={() => setShowCreatePost(false)}
                >
                  {lang === 'ko' ? '취소' : 'Cancel'}
                </Button>
                <Button
                  className="h-9 rounded-xl text-[13px] font-semibold"
                  onClick={handleCreatePost}
                  disabled={isSubmittingPost || !postContent.trim()}
                >
                  {isSubmittingPost
                    ? (lang === 'ko' ? '게시 중...' : 'Posting...')
                    : (lang === 'ko' ? '게시하기' : 'Post')}
                </Button>
              </div>
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

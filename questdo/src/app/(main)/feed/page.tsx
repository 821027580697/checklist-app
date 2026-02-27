// 소셜 피드 — 유저 검색 + 친구 추가 + Firestore 기반
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
  Search,
  UserPlus,
  UserCheck,
  X,
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
  getDoc,
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
  deleteDoc,
} from 'firebase/firestore';
import { Post, Comment } from '@/types/post';
import { User } from '@/types/user';

export default function FeedPage() {
  const { t, language } = useTranslation();
  const lang = language as 'ko' | 'en';
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);

  const [activeTab, setActiveTab] = useState<'explore' | 'following'>('explore');
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [isSubmittingPost, setIsSubmittingPost] = useState(false);

  // 댓글
  const [showComments, setShowComments] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [isLoadingComments, setIsLoadingComments] = useState(false);

  // 유저 검색
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [followingIds, setFollowingIds] = useState<string[]>([]);

  // 팔로잉 목록 로드
  const loadFollowingIds = useCallback(async () => {
    if (!user || !db) return;
    try {
      const q = query(
        collection(db, 'follows'),
        where('followerId', '==', user.uid),
      );
      const snapshot = await getDocs(q);
      const ids = snapshot.docs.map((d) => d.data().followingId as string);
      setFollowingIds(ids);
    } catch (err) {
      console.error('Failed to load following ids:', err);
    }
  }, [user]);

  useEffect(() => {
    loadFollowingIds();
  }, [loadFollowingIds]);

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
      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, { commentsCount: increment(1) });

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

  const toggleComments = (postId: string) => {
    if (showComments === postId) {
      setShowComments(null);
      setComments([]);
    } else {
      setShowComments(postId);
      loadComments(postId);
    }
  };

  // ── 유저 검색 ──
  const handleSearch = async () => {
    if (!db || !searchQuery.trim()) return;
    setIsSearching(true);
    try {
      // Firestore에서 닉네임 검색 (prefix 매칭)
      const q = query(
        collection(db, 'users'),
        where('nickname', '>=', searchQuery.trim()),
        where('nickname', '<=', searchQuery.trim() + '\uf8ff'),
        limit(20),
      );
      const snapshot = await getDocs(q);
      const results = snapshot.docs
        .map((d) => ({ uid: d.id, ...d.data() } as User))
        .filter((u) => u.uid !== user?.uid); // 자신 제외
      setSearchResults(results);
    } catch (err) {
      console.error('Failed to search users:', err);
      toast.error(lang === 'ko' ? '검색에 실패했습니다' : 'Search failed');
    } finally {
      setIsSearching(false);
    }
  };

  // ── 팔로우 / 언팔로우 ──
  const handleFollow = async (targetUserId: string) => {
    if (!user || !db) return;
    try {
      // follows 컬렉션에 문서 추가
      await addDoc(collection(db, 'follows'), {
        followerId: user.uid,
        followingId: targetUserId,
        createdAt: serverTimestamp(),
      });

      // 카운터 업데이트
      const myRef = doc(db, 'users', user.uid);
      const targetRef = doc(db, 'users', targetUserId);
      await updateDoc(myRef, { followingCount: increment(1) });
      await updateDoc(targetRef, { followersCount: increment(1) });

      // 로컬 상태 업데이트
      setFollowingIds((prev) => [...prev, targetUserId]);
      setUser({
        ...user,
        followingCount: (user.followingCount || 0) + 1,
      });

      toast.success(lang === 'ko' ? '친구가 추가되었습니다!' : 'Friend added!');
    } catch (err) {
      console.error('Failed to follow:', err);
      toast.error(lang === 'ko' ? '팔로우에 실패했습니다' : 'Failed to follow');
    }
  };

  const handleUnfollow = async (targetUserId: string) => {
    if (!user || !db) return;
    try {
      // follows 컬렉션에서 문서 삭제
      const q = query(
        collection(db, 'follows'),
        where('followerId', '==', user.uid),
        where('followingId', '==', targetUserId),
      );
      const snapshot = await getDocs(q);
      for (const d of snapshot.docs) {
        await deleteDoc(doc(db, 'follows', d.id));
      }

      // 카운터 업데이트
      const myRef = doc(db, 'users', user.uid);
      const targetRef = doc(db, 'users', targetUserId);
      await updateDoc(myRef, { followingCount: increment(-1) });
      await updateDoc(targetRef, { followersCount: increment(-1) });

      // 로컬 상태 업데이트
      setFollowingIds((prev) => prev.filter((id) => id !== targetUserId));
      setUser({
        ...user,
        followingCount: Math.max(0, (user.followingCount || 0) - 1),
      });

      toast.success(lang === 'ko' ? '팔로우를 취소했습니다' : 'Unfollowed');
    } catch (err) {
      console.error('Failed to unfollow:', err);
      toast.error(lang === 'ko' ? '언팔로우에 실패했습니다' : 'Failed to unfollow');
    }
  };

  // 팔로잉 게시글 필터
  const followingPosts = posts.filter((p) => followingIds.includes(p.userId));

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

  // 포스트 카드 렌더링 (공통)
  const renderPost = (post: Post, index: number) => (
    <motion.div
      key={post.id}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.4 }}
    >
      <div className="rounded-2xl border border-border/50 bg-card overflow-hidden p-5 transition-shadow hover:shadow-sm">
        {/* 포스트 헤더 */}
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#007AFF] to-[#5856D6] text-lg shrink-0 overflow-hidden">
            {post.userAvatar?.startsWith('http') ? (
              <img src={post.userAvatar} alt="" className="h-full w-full object-cover" />
            ) : (
              post.userAvatar || '?'
            )}
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
          {/* 팔로우 버튼 (내 게시글 아닌 경우) */}
          {user && post.userId !== user.uid && (
            <Button
              variant={followingIds.includes(post.userId) ? 'secondary' : 'outline'}
              size="sm"
              className="h-7 rounded-full text-[11px] px-2.5 shrink-0"
              onClick={() =>
                followingIds.includes(post.userId)
                  ? handleUnfollow(post.userId)
                  : handleFollow(post.userId)
              }
            >
              {followingIds.includes(post.userId) ? (
                <><UserCheck className="h-3 w-3 mr-1" />{lang === 'ko' ? '팔로잉' : 'Following'}</>
              ) : (
                <><UserPlus className="h-3 w-3 mr-1" />{lang === 'ko' ? '추가' : 'Follow'}</>
              )}
            </Button>
          )}
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
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#007AFF]/30 to-[#5856D6]/30 text-[10px] overflow-hidden">
                        {comment.userAvatar?.startsWith('http') ? (
                          <img src={comment.userAvatar} alt="" className="h-full w-full object-cover" />
                        ) : (
                          comment.userAvatar || '?'
                        )}
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
  );

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
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-full"
            onClick={() => setShowSearch(true)}
          >
            <Search className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => setShowCreatePost(true)}
            className="h-9 rounded-full px-4 text-[13px] font-medium"
            size="sm"
          >
            <Plus className="mr-1 h-4 w-4" />
            {lang === 'ko' ? '글쓰기' : 'Write'}
          </Button>
        </div>
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
            {followingIds.length > 0 && (
              <span className="ml-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary/10 px-1 text-[9px] font-bold text-primary">
                {followingIds.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* 탐색 탭 */}
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
            posts.map((post, index) => renderPost(post, index))
          )}
        </TabsContent>

        {/* 팔로잉 탭 */}
        <TabsContent value="following" className="space-y-3 mt-4">
          {followingPosts.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary dark:bg-[#2C2C2E] mb-4">
                <Users className="h-7 w-7 text-muted-foreground" />
              </div>
              <p className="text-[15px] font-medium">
                {lang === 'ko' ? '팔로잉 피드가 비어있습니다' : 'Following feed is empty'}
              </p>
              <p className="text-[13px] text-muted-foreground mt-1.5 max-w-xs">
                {lang === 'ko'
                  ? '다른 사용자를 검색하고 친구 추가해보세요!'
                  : 'Search and follow other users!'}
              </p>
              <Button
                variant="outline"
                className="mt-4 rounded-full text-[13px]"
                size="sm"
                onClick={() => setShowSearch(true)}
              >
                <Search className="mr-1 h-4 w-4" />
                {lang === 'ko' ? '사용자 검색' : 'Search users'}
              </Button>
            </div>
          ) : (
            followingPosts.map((post, index) => renderPost(post, index))
          )}
        </TabsContent>
      </Tabs>

      {/* ── 유저 검색 모달 ── */}
      <Dialog open={showSearch} onOpenChange={setShowSearch}>
        <DialogContent className="sm:max-w-md rounded-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[17px] flex items-center gap-2">
              <Search className="h-5 w-5 text-primary" />
              {lang === 'ko' ? '사용자 검색' : 'Search Users'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* 검색 입력 */}
            <div className="flex gap-2">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={lang === 'ko' ? '닉네임으로 검색...' : 'Search by nickname...'}
                className="flex-1 h-10 rounded-xl text-[14px]"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSearch();
                }}
              />
              <Button
                onClick={handleSearch}
                disabled={isSearching || !searchQuery.trim()}
                className="h-10 rounded-xl px-4"
              >
                {isSearching ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-[2px] border-white/30 border-t-white" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* 검색 결과 */}
            {searchResults.length > 0 ? (
              <div className="space-y-2">
                <p className="text-[12px] text-muted-foreground">
                  {lang === 'ko' ? `${searchResults.length}명의 사용자를 찾았습니다` : `Found ${searchResults.length} users`}
                </p>
                {searchResults.map((result) => {
                  const isFollowing = followingIds.includes(result.uid);
                  return (
                    <motion.div
                      key={result.uid}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-3 rounded-xl p-3 hover:bg-secondary/50 transition-all"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#007AFF] to-[#5856D6] text-lg shrink-0 overflow-hidden">
                        {result.avatarUrl?.startsWith('http') ? (
                          <img src={result.avatarUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          result.nickname?.charAt(0) || '?'
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-semibold truncate">{result.nickname}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="secondary" className="text-[10px] h-4 px-1.5 rounded-md">
                            Lv.{result.level || 1}
                          </Badge>
                          {result.bio && (
                            <span className="text-[11px] text-muted-foreground truncate">{result.bio}</span>
                          )}
                        </div>
                      </div>
                      <Button
                        variant={isFollowing ? 'secondary' : 'default'}
                        size="sm"
                        className="h-8 rounded-full text-[12px] px-3 shrink-0"
                        onClick={() => isFollowing ? handleUnfollow(result.uid) : handleFollow(result.uid)}
                      >
                        {isFollowing ? (
                          <><UserCheck className="h-3.5 w-3.5 mr-1" />{lang === 'ko' ? '팔로잉' : 'Following'}</>
                        ) : (
                          <><UserPlus className="h-3.5 w-3.5 mr-1" />{lang === 'ko' ? '추가' : 'Follow'}</>
                        )}
                      </Button>
                    </motion.div>
                  );
                })}
              </div>
            ) : searchQuery && !isSearching ? (
              <p className="text-[13px] text-muted-foreground text-center py-6">
                {lang === 'ko' ? '검색 결과가 없습니다' : 'No results found'}
              </p>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      {/* 포스트 작성 모달 */}
      <Dialog open={showCreatePost} onOpenChange={setShowCreatePost}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-[17px]">{lang === 'ko' ? '새 게시글' : 'New Post'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#007AFF] to-[#5856D6] text-sm overflow-hidden">
                {user?.avatarUrl?.startsWith('http') ? (
                  <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  user?.nickname?.charAt(0) || '?'
                )}
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

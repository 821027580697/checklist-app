// 소셜 피드 상태 관리 (Zustand)
import { create } from 'zustand';
import { Post } from '@/types/post';

type FeedTab = 'explore' | 'following';

interface FeedState {
  // 상태
  posts: Post[];
  isLoading: boolean;
  activeTab: FeedTab;
  hasMore: boolean;

  // 액션
  setPosts: (posts: Post[]) => void;
  addPost: (post: Post) => void;
  updatePost: (id: string, data: Partial<Post>) => void;
  removePost: (id: string) => void;
  appendPosts: (posts: Post[]) => void;
  setLoading: (loading: boolean) => void;
  setActiveTab: (tab: FeedTab) => void;
  setHasMore: (hasMore: boolean) => void;
}

export const useFeedStore = create<FeedState>((set) => ({
  posts: [],
  isLoading: false,
  activeTab: 'explore',
  hasMore: true,

  setPosts: (posts) => set({ posts }),

  addPost: (post) =>
    set((state) => ({ posts: [post, ...state.posts] })),

  updatePost: (id, data) =>
    set((state) => ({
      posts: state.posts.map((p) => (p.id === id ? { ...p, ...data } : p)),
    })),

  removePost: (id) =>
    set((state) => ({
      posts: state.posts.filter((p) => p.id !== id),
    })),

  appendPosts: (posts) =>
    set((state) => ({
      posts: [...state.posts, ...posts],
    })),

  setLoading: (loading) => set({ isLoading: loading }),
  setActiveTab: (tab) => set({ activeTab: tab, posts: [], hasMore: true }),
  setHasMore: (hasMore) => set({ hasMore }),
}));

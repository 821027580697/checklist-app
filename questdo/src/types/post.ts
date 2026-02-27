// 소셜 포스트 관련 타입 정의
import { TaskCategory } from './task';

// 포스트 유형
export type PostType = 'general' | 'completion' | 'badge' | 'challenge' | 'milestone';

// 포스트 리액션
export interface PostReactions {
  likes: string[];
  cheers: string[];
  fires: string[];
}

// 포스트 콘텐츠
export interface PostContent {
  text: string;
  imageUrl: string | null;
  taskRef: {
    title: string;
    category: TaskCategory;
  } | null;
  badgeRef: {
    id: string;
    name: string;
    icon: string;
  } | null;
  milestoneType: string | null;
}

// 포스트 메인 인터페이스
export interface Post {
  id: string;
  userId: string;
  userNickname: string;
  userAvatar: string;
  userLevel: number;
  userTitle: string;
  type: PostType;
  content: PostContent;
  reactions: PostReactions;
  totalReactions: number;
  commentsCount: number;
  createdAt: string; // ISO 문자열
}

// 댓글 인터페이스
export interface Comment {
  id: string;
  postId: string;
  userId: string;
  userNickname: string;
  userAvatar: string;
  text: string;
  createdAt: string;
}

// 팔로우 관계 인터페이스
export interface Follow {
  id: string;
  followerId: string;
  followingId: string;
  createdAt: string;
}

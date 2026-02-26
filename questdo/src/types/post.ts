// 소셜 포스트 관련 타입 정의
import { Timestamp } from 'firebase/firestore';
import { TaskCategory } from './task';

// 포스트 유형
export type PostType = 'completion' | 'badge' | 'challenge' | 'milestone';

// 포스트 리액션
export interface PostReactions {
  likes: string[];    // userId 배열
  cheers: string[];   // 응원 userId 배열
  fires: string[];    // 🔥 userId 배열
}

// 포스트 콘텐츠
export interface PostContent {
  text: string;                 // 본문 텍스트 (최대 300자)
  imageUrl: string | null;      // Firebase Storage 이미지 URL
  taskRef: {                    // 완료한 할 일 참조
    title: string;
    category: TaskCategory;
  } | null;
  badgeRef: {                   // 획득한 배지 참조
    id: string;
    name: string;
    icon: string;
  } | null;
  milestoneType: string | null; // '100_tasks', 'level_10' 등
}

// 포스트 메인 인터페이스
export interface Post {
  id: string;
  userId: string;
  userNickname: string;           // 비정규화 (빠른 렌더링용)
  userAvatar: string;
  userLevel: number;
  userTitle: string;
  type: PostType;
  content: PostContent;
  reactions: PostReactions;
  totalReactions: number;
  commentsCount: number;
  createdAt: Timestamp;
}

// 댓글 인터페이스
export interface Comment {
  id: string;
  postId: string;
  userId: string;
  userNickname: string;
  userAvatar: string;
  text: string;                   // 최대 200자
  createdAt: Timestamp;
}

// 팔로우 관계 인터페이스
export interface Follow {
  id: string;
  followerId: string;
  followingId: string;
  createdAt: Timestamp;
}

// Comments API — GET (by postId), POST (생성), DELETE (삭제)
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import CommentModel from '@/models/Comment';
import PostModel from '@/models/Post';
import UserModel from '@/models/User';
import { getServerUser } from '@/lib/api/server-auth';

export async function GET(req: NextRequest) {
  const user = await getServerUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const postId = searchParams.get('postId');
  if (!postId) return NextResponse.json({ error: 'postId required' }, { status: 400 });

  await dbConnect();
  const comments = await CommentModel.find({ postId }).sort({ createdAt: 1 }).limit(100).lean();
  const mapped = comments.map((c) => ({ ...c, id: c._id.toString() }));
  return NextResponse.json(mapped);
}

export async function POST(req: NextRequest) {
  const user = await getServerUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await dbConnect();
  const body = await req.json();

  // 유저 프로필에서 닉네임, 아바타 가져오기
  const userDoc = await UserModel.findById(user.uid).lean();
  const userNickname = userDoc?.nickname || user.name || 'User';
  const userAvatar = userDoc?.avatarUrl || user.image || '';

  const comment = await CommentModel.create({
    ...body,
    userId: user.uid,
    userNickname,
    userAvatar,
  });

  // 게시글 댓글 수 증가
  if (body.postId) {
    await PostModel.findByIdAndUpdate(body.postId, { $inc: { commentsCount: 1 } });
  }

  return NextResponse.json({ ...comment.toObject(), id: comment._id.toString() }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const user = await getServerUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await dbConnect();
  const { searchParams } = new URL(req.url);
  const commentId = searchParams.get('id');
  if (!commentId) return NextResponse.json({ error: 'id required' }, { status: 400 });

  // 본인 댓글만 삭제 가능
  const comment = await CommentModel.findOne({ _id: commentId, userId: user.uid });
  if (!comment) return NextResponse.json({ error: 'Not found or not authorized' }, { status: 404 });

  const postId = comment.postId;
  await CommentModel.deleteOne({ _id: commentId });

  // 게시글 댓글 수 감소
  if (postId) {
    await PostModel.findByIdAndUpdate(postId, { $inc: { commentsCount: -1 } });
  }

  return NextResponse.json({ success: true });
}

// Comments API — GET (by postId), POST (생성)
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import CommentModel from '@/models/Comment';
import PostModel from '@/models/Post';
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
  const comment = await CommentModel.create({ ...body, userId: user.uid });

  // 게시글 댓글 수 증가
  if (body.postId) {
    await PostModel.findByIdAndUpdate(body.postId, { $inc: { commentsCount: 1 } });
  }

  return NextResponse.json({ ...comment.toObject(), id: comment._id.toString() }, { status: 201 });
}

// Posts API — PUT (리액션), DELETE
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import PostModel from '@/models/Post';
import { getServerUser } from '@/lib/api/server-auth';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getServerUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;

  await dbConnect();
  const body = await req.json();

  // 리액션 토글 처리
  if (body.reactionType) {
    const field = `reactions.${body.reactionType}`;
    const post = await PostModel.findById(id).lean();
    if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const currentList = (post.reactions as Record<string, string[]>)?.[body.reactionType] || [];
    const isReacted = currentList.includes(user.uid);

    const update = isReacted
      ? { $pull: { [field]: user.uid }, $inc: { totalReactions: -1 } }
      : { $addToSet: { [field]: user.uid }, $inc: { totalReactions: 1 } };

    const updated = await PostModel.findByIdAndUpdate(id, update, { new: true }).lean();
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ ...updated, id: updated._id.toString() });
  }

  // 일반 업데이트 (commentsCount 등)
  const updated = await PostModel.findByIdAndUpdate(id, { $set: body }, { new: true }).lean();
  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ ...updated, id: updated._id.toString() });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getServerUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;

  await dbConnect();
  const result = await PostModel.deleteOne({ _id: id, userId: user.uid });
  if (result.deletedCount === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ success: true });
}

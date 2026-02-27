// Follows API — GET (팔로잉 목록), POST (팔로우), DELETE (언팔로우)
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import FollowModel from '@/models/Follow';
import UserModel from '@/models/User';
import { getServerUser } from '@/lib/api/server-auth';

export async function GET() {
  const user = await getServerUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await dbConnect();
  const follows = await FollowModel.find({ followerId: user.uid }).lean();
  const ids = follows.map((f) => f.followingId);
  return NextResponse.json(ids);
}

export async function POST(req: NextRequest) {
  const user = await getServerUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await dbConnect();
  const { targetUserId } = await req.json();

  try {
    await FollowModel.create({ followerId: user.uid, followingId: targetUserId });
    await UserModel.findByIdAndUpdate(user.uid, { $inc: { followingCount: 1 } });
    await UserModel.findByIdAndUpdate(targetUserId, { $inc: { followersCount: 1 } });
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err: unknown) {
    if ((err as { code?: number }).code === 11000) {
      return NextResponse.json({ error: 'Already following' }, { status: 409 });
    }
    throw err;
  }
}

export async function DELETE(req: NextRequest) {
  const user = await getServerUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await dbConnect();
  const { targetUserId } = await req.json();

  const result = await FollowModel.deleteOne({ followerId: user.uid, followingId: targetUserId });
  if (result.deletedCount > 0) {
    await UserModel.findByIdAndUpdate(user.uid, { $inc: { followingCount: -1 } });
    await UserModel.findByIdAndUpdate(targetUserId, { $inc: { followersCount: -1 } });
  }
  return NextResponse.json({ success: true });
}

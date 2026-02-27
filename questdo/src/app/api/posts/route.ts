// Posts API — GET (목록), POST (생성) — 유저 정보 자동 주입
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import PostModel from '@/models/Post';
import UserModel from '@/models/User';
import { getServerUser } from '@/lib/api/server-auth';

export async function GET() {
  const user = await getServerUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await dbConnect();
  const posts = await PostModel.find().sort({ createdAt: -1 }).limit(50).lean();
  const mapped = posts.map((p) => ({ ...p, id: p._id.toString() }));
  return NextResponse.json(mapped);
}

export async function POST(req: NextRequest) {
  const user = await getServerUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await dbConnect();
  const body = await req.json();

  // 유저 프로필에서 닉네임, 아바타, 레벨, 타이틀 가져오기
  const userDoc = await UserModel.findById(user.uid).lean();
  const userNickname = userDoc?.nickname || user.name || 'User';
  const userAvatar = userDoc?.avatarUrl || user.image || '';
  const userLevel = userDoc?.level || 1;
  const userTitle = userDoc?.title || '';

  const post = await PostModel.create({
    ...body,
    userId: user.uid,
    userNickname,
    userAvatar,
    userLevel,
    userTitle,
  });
  return NextResponse.json({ ...post.toObject(), id: post._id.toString() }, { status: 201 });
}

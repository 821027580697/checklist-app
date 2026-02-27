// Users API — GET (내 프로필 / 검색), PUT (업데이트)
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import UserModel from '@/models/User';
import { getServerUser } from '@/lib/api/server-auth';

export async function GET(req: NextRequest) {
  const user = await getServerUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await dbConnect();
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search');

  if (search) {
    // 닉네임 검색 (prefix 매칭)
    const users = await UserModel.find({
      nickname: { $regex: `^${search}`, $options: 'i' },
      _id: { $ne: user.uid },
    })
      .limit(20)
      .lean();
    const mapped = users.map((u) => ({ ...u, uid: u._id.toString() }));
    return NextResponse.json(mapped);
  }

  // 내 프로필
  const me = await UserModel.findById(user.uid).lean();
  if (!me) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  return NextResponse.json({ ...me, uid: me._id.toString() });
}

export async function PUT(req: NextRequest) {
  const user = await getServerUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await dbConnect();
  const body = await req.json();

  // stats.xxx 형태의 dot notation 처리
  const updateData: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(body)) {
    updateData[key] = value;
  }

  const updated = await UserModel.findByIdAndUpdate(user.uid, { $set: updateData }, { new: true }).lean();
  if (!updated) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  return NextResponse.json({ ...updated, uid: updated._id.toString() });
}

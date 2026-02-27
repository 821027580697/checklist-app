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
  try {
    const user = await getServerUser();
    console.log('[PUT /api/users] 세션 유저:', user ? { uid: user.uid, email: user.email } : 'null');
    if (!user || !user.uid) return NextResponse.json({ error: '로그인이 필요합니다 (세션 없음)' }, { status: 401 });

    await dbConnect();
    const body = await req.json();
    console.log('[PUT /api/users] 요청 바디:', JSON.stringify(body));

    // $set에 넣을 데이터와 $setOnInsert에 넣을 기본값 분리
    const updateData: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(body)) {
      updateData[key] = value;
    }

    // $setOnInsert에는 $set에 없는 필드만 넣어야 충돌 방지
    const insertDefaults: Record<string, unknown> = {
      _id: user.uid,
      email: user.email || '',
      bio: '',
      level: 1,
      xp: 0,
      totalXp: 0,
      title: '초보 모험가',
      stats: {
        totalCompleted: 0,
        currentStreak: 0,
        longestStreak: 0,
        totalHabitChecks: 0,
        lastStreakDate: '',
      },
      badges: [],
      settings: {
        theme: 'system',
        language: 'ko',
        notifications: { taskReminder: true, habitReminder: true, socialActivity: true, achievements: true },
        privacy: { profilePublic: true, showStreak: true, showLevel: true },
      },
      followersCount: 0,
      followingCount: 0,
    };

    // $set에 이미 있는 필드는 $setOnInsert에서 제거
    for (const key of Object.keys(updateData)) {
      delete insertDefaults[key];
    }

    const updated = await UserModel.findByIdAndUpdate(
      user.uid,
      { $set: updateData, $setOnInsert: insertDefaults },
      { new: true, upsert: true, returnDocument: 'after' },
    ).lean();

    console.log('[PUT /api/users] 결과:', updated ? 'OK' : 'null');
    if (!updated) return NextResponse.json({ error: '사용자 업데이트 실패' }, { status: 500 });
    return NextResponse.json({ ...updated, uid: updated._id.toString() });
  } catch (err) {
    console.error('[PUT /api/users] 에러:', err);
    const message = err instanceof Error ? err.message : '알 수 없는 서버 오류';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

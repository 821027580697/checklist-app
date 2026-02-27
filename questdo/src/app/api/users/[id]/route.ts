// Users API — GET user by ID (공개 프로필)
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import UserModel from '@/models/User';
import { getServerUser } from '@/lib/api/server-auth';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getServerUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;

  await dbConnect();
  const found = await UserModel.findById(id).lean();
  if (!found) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ ...found, uid: found._id.toString() });
}

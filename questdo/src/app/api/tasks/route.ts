// Tasks API — GET (목록), POST (생성)
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import TaskModel from '@/models/Task';
import { getServerUser } from '@/lib/api/server-auth';

export async function GET() {
  const user = await getServerUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await dbConnect();
  const tasks = await TaskModel.find({ userId: user.uid }).sort({ createdAt: -1 }).lean();
  // _id → id 변환
  const mapped = tasks.map((t) => ({ ...t, id: t._id.toString() }));
  return NextResponse.json(mapped);
}

export async function POST(req: NextRequest) {
  const user = await getServerUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await dbConnect();
  const body = await req.json();
  const task = await TaskModel.create({ ...body, userId: user.uid });
  return NextResponse.json({ ...task.toObject(), id: task._id.toString() }, { status: 201 });
}

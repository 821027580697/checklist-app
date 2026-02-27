// Tasks API — GET/PUT/DELETE by ID
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import TaskModel from '@/models/Task';
import { getServerUser } from '@/lib/api/server-auth';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getServerUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;

  await dbConnect();
  const task = await TaskModel.findOne({ _id: id, userId: user.uid }).lean();
  if (!task) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ ...task, id: task._id.toString() });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getServerUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;

  await dbConnect();
  const body = await req.json();
  const task = await TaskModel.findOneAndUpdate(
    { _id: id, userId: user.uid },
    { $set: body },
    { new: true },
  ).lean();
  if (!task) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ ...task, id: task._id.toString() });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getServerUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;

  await dbConnect();
  const result = await TaskModel.deleteOne({ _id: id, userId: user.uid });
  if (result.deletedCount === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ success: true });
}

// Habits API — GET (목록), POST (생성)
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import HabitModel from '@/models/Habit';
import { getServerUser } from '@/lib/api/server-auth';

export async function GET() {
  const user = await getServerUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await dbConnect();
  const habits = await HabitModel.find({ userId: user.uid }).sort({ createdAt: -1 }).lean();
  const mapped = habits.map((h) => ({ ...h, id: h._id.toString() }));
  return NextResponse.json(mapped);
}

export async function POST(req: NextRequest) {
  const user = await getServerUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await dbConnect();
  const body = await req.json();
  const habit = await HabitModel.create({
    ...body,
    userId: user.uid,
    streak: 0,
    longestStreak: 0,
    completedDates: [],
    totalChecks: 0,
  });
  return NextResponse.json({ ...habit.toObject(), id: habit._id.toString() }, { status: 201 });
}

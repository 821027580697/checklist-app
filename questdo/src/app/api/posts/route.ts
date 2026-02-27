// Posts API — GET (목록), POST (생성)
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import PostModel from '@/models/Post';
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
  const post = await PostModel.create({ ...body, userId: user.uid });
  return NextResponse.json({ ...post.toObject(), id: post._id.toString() }, { status: 201 });
}

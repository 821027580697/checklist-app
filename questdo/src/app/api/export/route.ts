// Data Export API — CSV 형식 (Google Sheets 호환)
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import TaskModel from '@/models/Task';
import HabitModel from '@/models/Habit';
import { getServerUser } from '@/lib/api/server-auth';

export async function GET() {
  const user = await getServerUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await dbConnect();

  const tasks = await TaskModel.find({ userId: user.uid }).sort({ createdAt: -1 }).lean();
  const habits = await HabitModel.find({ userId: user.uid }).sort({ createdAt: -1 }).lean();

  // BOM for Excel/Google Sheets Korean support
  const BOM = '\uFEFF';

  // ── Tasks Sheet ──
  const taskHeaders = [
    '제목', '설명', '카테고리', '우선순위', '상태', '마감일', '반복',
    '재정유형', '금액', '통화', '생성일', '완료일',
  ];
  const taskRows = tasks.map((t) => [
    escCsv(t.title),
    escCsv(t.description || ''),
    t.category || '',
    t.priority || '',
    t.status || '',
    t.dueDate ? new Date(t.dueDate).toLocaleDateString('ko-KR') : '',
    t.isRecurring ? 'Y' : 'N',
    (t.financeData as Record<string, unknown>)?.transactionType || '',
    (t.financeData as Record<string, unknown>)?.amount || '',
    (t.financeData as Record<string, unknown>)?.currency || '',
    t.createdAt ? new Date(t.createdAt).toLocaleDateString('ko-KR') : '',
    t.completedAt ? new Date(t.completedAt as unknown as string).toLocaleDateString('ko-KR') : '',
  ]);

  // ── Habits Sheet ──
  const habitHeaders = [
    '제목', '설명', '카테고리', '아이콘', '빈도', '총 체크 수',
    '연속 달성', '최장 연속', '생성일',
  ];
  const habitRows = habits.map((h) => [
    escCsv(h.title),
    escCsv(h.description || ''),
    h.category || '',
    h.icon || '',
    h.frequency?.type || '',
    h.totalChecks || 0,
    h.streak || 0,
    h.longestStreak || 0,
    h.createdAt ? new Date(h.createdAt).toLocaleDateString('ko-KR') : '',
  ]);

  // Build CSV
  let csv = BOM;
  csv += '=== 할 일 (Tasks) ===\n';
  csv += taskHeaders.join(',') + '\n';
  for (const row of taskRows) {
    csv += row.join(',') + '\n';
  }
  csv += '\n';
  csv += '=== 습관 (Habits) ===\n';
  csv += habitHeaders.join(',') + '\n';
  for (const row of habitRows) {
    csv += row.join(',') + '\n';
  }

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="questdo-data-${new Date().toISOString().split('T')[0]}.csv"`,
    },
  });
}

function escCsv(value: string): string {
  if (!value) return '';
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/index';
import { teacher_clock, teacher_contracts, teacher_leaves } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';
import { v4 as uuid } from 'uuid';

// GET /api/teacher/rh - Get teacher's RH info (contracts, leaves, today's clock)
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'teacher' && user.role !== 'admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const teacherId = user.userId;
    const today = new Date().toISOString().split('T')[0];

    const contracts = await db.select().from(teacher_contracts).where(eq(teacher_contracts.teacher_id, teacherId)).orderBy(desc(teacher_contracts.start_date));
    const leaves = await db.select().from(teacher_leaves).where(eq(teacher_leaves.teacher_id, teacherId)).orderBy(desc(teacher_leaves.start_date));
    const clock = await db.select().from(teacher_clock).where(and(eq(teacher_clock.teacher_id, teacherId), eq(teacher_clock.date, today))).limit(1);

    return NextResponse.json({ contracts, leaves, todayClock: clock[0] || null });
  } catch (error) {
    console.error('GET /api/teacher/rh error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


// POST /api/teacher/rh/leaves - Request leave
export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'teacher') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    const { type, startDate, endDate, reason } = await req.json();
    if (!type || !startDate || !endDate) return NextResponse.json({ error: 'Champs manquants' }, { status: 400 });

    await db.insert(teacher_leaves).values({
      id: uuid(),
      teacher_id: user.userId,
      type,
      start_date: startDate,
      end_date: endDate,
      reason,
      status: 'pending'
    });

    return NextResponse.json({ message: 'Demande de congé envoyée' });
  } catch (error) {
    console.error('POST /api/teacher/rh/leaves error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

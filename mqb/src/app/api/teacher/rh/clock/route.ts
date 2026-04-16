import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/index';
import { teacher_clock } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';
import { v4 as uuid } from 'uuid';

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user || user.role !== 'teacher') {
      return NextResponse.json({ error: 'Seuls les enseignants peuvent pointer' }, { status: 403 });
    }

    const teacherId = user.userId;
    const today = new Date().toISOString().split('T')[0];
    const now = Math.floor(Date.now() / 1000);

    const existing = await db.select().from(teacher_clock).where(and(eq(teacher_clock.teacher_id, teacherId), eq(teacher_clock.date, today))).limit(1);

    if (!existing[0]) {
      // Clocking in
      await db.insert(teacher_clock).values({
        id: uuid(),
        teacher_id: teacherId,
        clock_in: now,
        date: today
      });
      return NextResponse.json({ status: 'in', time: now });
    } else if (!existing[0].clock_out) {
      // Clocking out
      await db.update(teacher_clock).set({ clock_out: now }).where(eq(teacher_clock.id, existing[0].id));
      return NextResponse.json({ status: 'out', time: now });
    } else {
      return NextResponse.json({ error: 'Déjà pointé aujourd\'hui' }, { status: 400 });
    }
  } catch (error) {
    console.error('POST /api/teacher/rh/clock error:', error);
    return NextResponse.json({ error: 'Erreur lors du pointage' }, { status: 500 });
  }
}

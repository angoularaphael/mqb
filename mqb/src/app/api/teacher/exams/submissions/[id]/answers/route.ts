import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/index';
import { exam_answers } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'teacher' && user.role !== 'admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const answers = await db.select().from(exam_answers).where(eq(exam_answers.submission_id, params.id));

    return NextResponse.json({ answers });
  } catch (error) {
    console.error('GET /api/teacher/exams/submissions/answers error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

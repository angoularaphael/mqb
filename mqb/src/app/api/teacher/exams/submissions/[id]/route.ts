import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/index';
import { exam_submissions, exam_answers } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'teacher' && user.role !== 'admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { questionGrades } = await req.json(); // questionGrades: { [questionId]: points }

    // 1. Update individual points for questions (mainly open ones)
    if (questionGrades) {
      for (const [qId, points] of Object.entries(questionGrades)) {
        await db.update(exam_answers)
          .set({ points_awarded: Number(points) })
          .where(and(
            eq(exam_answers.submission_id, params.id),
            eq(exam_answers.question_id, qId)
          ));
      }
    }

    // 2. Re-calculate total score
    const answers = await db.select().from(exam_answers).where(eq(exam_answers.submission_id, params.id));
    const totalScore = answers.reduce((acc, curr) => acc + (curr.points_awarded || 0), 0);

    // 3. Update submission
    await db.update(exam_submissions)
      .set({
        score: totalScore,
        status: 'graded'
        // feedback could be a column if added to schema, currently we just use score/status
      })
      .where(eq(exam_submissions.id, params.id));

    return NextResponse.json({ success: true, totalScore });
  } catch (error) {
    console.error('PATCH /api/teacher/exams/submissions error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

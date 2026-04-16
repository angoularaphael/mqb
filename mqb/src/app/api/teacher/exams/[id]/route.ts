import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/index';
import { exams, exam_questions, exam_choices, exam_submissions } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

// GET /api/teacher/exams/[id] — get exam details with questions
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const exam = await db.select().from(exams).where(eq(exams.id, params.id)).limit(1);
    if (!exam[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const questions = await db.select().from(exam_questions).where(eq(exam_questions.exam_id, params.id));
    const choices = await db.select().from(exam_choices);
    const submissions = await db.select().from(exam_submissions).where(eq(exam_submissions.exam_id, params.id));

    const questionsWithChoices = questions.map(q => ({
      ...q,
      choices: choices.filter(c => c.question_id === q.id),
    }));

    return NextResponse.json({ exam: exam[0], questions: questionsWithChoices, submissions });
  } catch (error) {
    console.error('GET exam detail error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/teacher/exams/[id] — publish/unpublish
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'teacher' && user.role !== 'admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    const body = await req.json();
    const updateData: Record<string, unknown> = {};
    if (body.isPublished !== undefined) updateData.is_published = body.isPublished ? 1 : 0;
    if (body.title) updateData.title = body.title;
    if (body.startDate) updateData.start_date = body.startDate;
    if (body.endDate) updateData.end_date = body.endDate;
    await db.update(exams).set(updateData).where(eq(exams.id, params.id));
    return NextResponse.json({ message: 'Examen mis à jour' });
  } catch (error) {
    console.error('PUT exam error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/teacher/exams/[id]
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'teacher' && user.role !== 'admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    await db.delete(exams).where(eq(exams.id, params.id));
    return NextResponse.json({ message: 'Examen supprimé' });
  } catch (error) {
    console.error('DELETE exam error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

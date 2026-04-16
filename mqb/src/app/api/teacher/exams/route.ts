import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/index';
import { exams, exam_questions, exam_choices, exam_submissions, courses } from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';
import { v4 as uuid } from 'uuid';

// GET /api/teacher/exams — list teacher's exams
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'teacher' && user.role !== 'admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    const teacherExams = await db.select({ id: exams.id, title: exams.title, description: exams.description, courseId: exams.course_id, courseName: courses.name, type: exams.type, durationMinutes: exams.duration_minutes, startDate: exams.start_date, endDate: exams.end_date, isPublished: exams.is_published, createdAt: exams.created_at })
      .from(exams)
      .leftJoin(courses, eq(exams.course_id, courses.id))
      .where(user.role === 'admin' ? undefined as any : eq(exams.teacher_id, user.userId))
      .orderBy(desc(exams.created_at));
    return NextResponse.json({ exams: teacherExams });
  } catch (error) {
    console.error('GET /api/teacher/exams error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/teacher/exams — create exam with questions
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'teacher' && user.role !== 'admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    const body = await req.json();
    const { title, description, courseId, type, durationMinutes, startDate, endDate, questions } = body;
    if (!title || !courseId) return NextResponse.json({ error: 'Title and courseId required' }, { status: 400 });

    const examId = uuid();
    await db.insert(exams).values({ id: examId, title, description, course_id: courseId, teacher_id: user.userId, type: type || 'qcm', duration_minutes: parseInt(durationMinutes) || 60, start_date: startDate, end_date: endDate });

    // Insert questions + choices
    if (questions && Array.isArray(questions)) {
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const qId = uuid();
        await db.insert(exam_questions).values({ id: qId, exam_id: examId, question_text: q.text, type: q.type || 'multiple_choice', points: parseFloat(q.points) || 1, order_index: i });
        if (q.choices && Array.isArray(q.choices)) {
          for (const c of q.choices) {
            await db.insert(exam_choices).values({ id: uuid(), question_id: qId, choice_text: c.text, is_correct: c.isCorrect ? 1 : 0 });
          }
        }
      }
    }

    return NextResponse.json({ id: examId, message: 'Examen créé' }, { status: 201 });
  } catch (error) {
    console.error('POST /api/teacher/exams error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

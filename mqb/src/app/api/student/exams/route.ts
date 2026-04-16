import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/index';
import { exams, exam_questions, exam_choices, exam_submissions, exam_answers, courses, group_members } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';
import { v4 as uuid } from 'uuid';

// GET /api/student/exams — list available exams for student
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Get student's groups
    const myGroups = await db.select().from(group_members).where(eq(group_members.user_id, user.userId));
    const groupIds = myGroups.map(g => g.group_id);

    // Get published exams for student's courses
    const allExams = await db.select({ id: exams.id, title: exams.title, description: exams.description, courseId: exams.course_id, courseName: courses.name, type: exams.type, durationMinutes: exams.duration_minutes, startDate: exams.start_date, endDate: exams.end_date, isPublished: exams.is_published })
      .from(exams)
      .leftJoin(courses, eq(exams.course_id, courses.id))
      .where(eq(exams.is_published, 1))
      .orderBy(desc(exams.created_at));

    // Filter exams whose course belongs to student's groups
    const filtered = groupIds.length > 0
      ? allExams.filter(e => {
          // For simplicity, show all published exams (course group check can be added)
          return true;
        })
      : allExams;

    // Get student's submissions
    const mySubmissions = await db.select().from(exam_submissions).where(eq(exam_submissions.student_id, user.userId));

    const result = filtered.map(exam => ({
      ...exam,
      submission: mySubmissions.find(s => s.exam_id === exam.id) || null,
    }));

    return NextResponse.json({ exams: result });
  } catch (error) {
    console.error('GET /api/student/exams error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/student/exams — submit exam answers
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { examId, answers } = await req.json();
    if (!examId || !answers) return NextResponse.json({ error: 'Missing data' }, { status: 400 });

    // Create or update submission
    const existing = await db.select().from(exam_submissions).where(and(eq(exam_submissions.exam_id, examId), eq(exam_submissions.student_id, user.userId))).limit(1);

    let submissionId: string;
    if (existing[0]) {
      submissionId = existing[0].id;
    } else {
      submissionId = uuid();
      await db.insert(exam_submissions).values({ id: submissionId, exam_id: examId, student_id: user.userId });
    }

    // Save answers and auto-grade MCQ
    let totalScore = 0;
    const questions = await db.select().from(exam_questions).where(eq(exam_questions.exam_id, examId));
    const allChoices = await db.select().from(exam_choices);

    for (const ans of answers) {
      const question = questions.find(q => q.id === ans.questionId);
      if (!question) continue;

      let pointsAwarded: number | null = null;

      if (question.type === 'multiple_choice' && ans.selectedChoiceId) {
        const choice = allChoices.find(c => c.id === ans.selectedChoiceId);
        pointsAwarded = choice && choice.is_correct ? question.points : 0;
        totalScore += pointsAwarded;
      }

      await db.insert(exam_answers).values({
        id: uuid(),
        submission_id: submissionId,
        question_id: ans.questionId,
        selected_choice_id: ans.selectedChoiceId || null,
        open_answer: ans.openAnswer || null,
        points_awarded: pointsAwarded,
      });
    }

    // Update submission
    const hasOpenQuestions = questions.some(q => q.type === 'open');
    await db.update(exam_submissions).set({
      submitted_at: Math.floor(Date.now() / 1000),
      score: hasOpenQuestions ? null : totalScore,
      status: hasOpenQuestions ? 'submitted' : 'graded',
    }).where(eq(exam_submissions.id, submissionId));

    return NextResponse.json({ submissionId, score: hasOpenQuestions ? null : totalScore, message: 'Examen soumis' });
  } catch (error) {
    console.error('POST /api/student/exams error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

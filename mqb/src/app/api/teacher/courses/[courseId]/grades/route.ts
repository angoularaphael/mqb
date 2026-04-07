import { NextResponse } from 'next/server';
import { requireStaffSession } from '@/lib/api-auth';
import { gradeSchema } from '@/lib/validations';
import { listGradesForCourse, teacherOwnsCourse, upsertGradeRow } from '@/lib/server/db-resources';

export async function GET(
  _: Request,
  { params }: { params: Promise<{ courseId: string }> },
) {
  const auth = await requireStaffSession();
  if ('response' in auth) return auth.response;
  if (auth.user.role !== 'teacher') return NextResponse.json({ error: 'Réservé aux enseignants' }, { status: 403 });
  const { courseId } = await params;
  if (!(await teacherOwnsCourse(auth.user.userId, courseId))) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  }
  return NextResponse.json({ grades: await listGradesForCourse(courseId) });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ courseId: string }> },
) {
  const auth = await requireStaffSession();
  if ('response' in auth) return auth.response;
  if (auth.user.role !== 'teacher') return NextResponse.json({ error: 'Réservé aux enseignants' }, { status: 403 });
  const { courseId } = await params;
  if (!(await teacherOwnsCourse(auth.user.userId, courseId))) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
  }
  const parsed = gradeSchema.safeParse({ ...(body as object), courseId });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 422 });
  }
  const g = await upsertGradeRow({
    studentId: parsed.data.studentId,
    courseId: parsed.data.courseId,
    score: parsed.data.score,
    feedback: parsed.data.feedback ?? null,
  });
  return NextResponse.json({ grade: g }, { status: 201 });
}

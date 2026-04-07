import { NextResponse } from 'next/server';
import { requireStaffSession } from '@/lib/api-auth';
import { gradeUpdateSchema } from '@/lib/validations';
import { deleteGradeRow, getGrade, teacherOwnsCourse, updateGradeRowById } from '@/lib/server/db-resources';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireStaffSession();
  if ('response' in auth) return auth.response;
  if (auth.user.role !== 'teacher') return NextResponse.json({ error: 'Réservé aux enseignants' }, { status: 403 });
  const { id } = await params;
  const existing = await getGrade(id);
  if (!existing) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });
  if (!(await teacherOwnsCourse(auth.user.userId, existing.course_id))) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
  }
  const parsed = gradeUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 422 });
  }
  const g = await updateGradeRowById(id, {
    score: parsed.data.score,
    feedback: parsed.data.feedback,
  });
  return NextResponse.json({ grade: g });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireStaffSession();
  if ('response' in auth) return auth.response;
  if (auth.user.role !== 'teacher') return NextResponse.json({ error: 'Réservé aux enseignants' }, { status: 403 });
  const { id } = await params;
  const existing = await getGrade(id);
  if (!existing) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });
  if (!(await teacherOwnsCourse(auth.user.userId, existing.course_id))) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  }
  await deleteGradeRow(id);
  return NextResponse.json({ ok: true });
}

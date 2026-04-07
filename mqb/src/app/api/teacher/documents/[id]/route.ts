import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireStaffSession } from '@/lib/api-auth';
import { deleteDocumentRow, getDocument, teacherOwnsCourse, updateDocumentRow } from '@/lib/server/db-resources';

const patchSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().nullable().optional(),
  courseId: z.string().nullable().optional(),
  visibility: z.enum(['private', 'students', 'public']).optional(),
});

async function canManage(teacherId: string, doc: NonNullable<Awaited<ReturnType<typeof getDocument>>>) {
  if (doc.uploaded_by === teacherId) return true;
  if (doc.course_id && (await teacherOwnsCourse(teacherId, doc.course_id))) return true;
  return false;
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireStaffSession();
  if ('response' in auth) return auth.response;
  if (auth.user.role !== 'teacher') return NextResponse.json({ error: 'Réservé aux enseignants' }, { status: 403 });
  const { id } = await params;
  const doc = await getDocument(id);
  if (!doc) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });
  if (!(await canManage(auth.user.userId, doc))) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 422 });
  }
  const nextCourseId = parsed.data.courseId === undefined ? undefined : parsed.data.courseId;
  if (nextCourseId && !(await teacherOwnsCourse(auth.user.userId, nextCourseId))) {
    return NextResponse.json({ error: 'Cours non autorisé' }, { status: 403 });
  }
  const d = parsed.data;
  const updated = await updateDocumentRow(id, {
    title: d.title,
    description: d.description,
    courseId: nextCourseId,
    visibility: d.visibility,
  });
  return NextResponse.json({ document: updated });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireStaffSession();
  if ('response' in auth) return auth.response;
  if (auth.user.role !== 'teacher') return NextResponse.json({ error: 'Réservé aux enseignants' }, { status: 403 });
  const { id } = await params;
  const doc = await getDocument(id);
  if (!doc) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });
  if (!(await canManage(auth.user.userId, doc))) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  }
  await deleteDocumentRow(id);
  return NextResponse.json({ ok: true });
}

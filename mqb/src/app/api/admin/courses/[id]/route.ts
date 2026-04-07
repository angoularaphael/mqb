import { NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/api-auth';
import { z } from 'zod';
import { deleteCourseRow, getCourse, updateCourseRow } from '@/lib/server/db-resources';

const patchSchema = z.object({
  code: z.string().min(3).optional(),
  name: z.string().min(3).optional(),
  description: z.string().nullable().optional(),
  teacherId: z.string().optional(),
  groupId: z.string().optional(),
  hoursTotal: z.coerce.number().min(1).optional(),
});

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminSession();
  if ('response' in auth) return auth.response;
  const { id } = await params;
  const c = await getCourse(id);
  if (!c) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });
  return NextResponse.json({ course: c });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminSession();
  if ('response' in auth) return auth.response;
  const { id } = await params;
  if (!(await getCourse(id))) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });
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
  const d = parsed.data;
  const c = await updateCourseRow(id, {
    code: d.code,
    name: d.name,
    description: d.description,
    teacherId: d.teacherId,
    groupId: d.groupId,
    hoursTotal: d.hoursTotal,
  });
  return NextResponse.json({ course: c });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminSession();
  if ('response' in auth) return auth.response;
  const { id } = await params;
  if (!(await getCourse(id))) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });
  await deleteCourseRow(id);
  return NextResponse.json({ ok: true });
}

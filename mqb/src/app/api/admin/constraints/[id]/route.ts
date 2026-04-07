import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdminSession } from '@/lib/api-auth';
import { deleteConstraintRow, getConstraint, updateConstraintRow } from '@/lib/server/db-resources';

const patchSchema = z.object({
  dayOfWeek: z.coerce.number().min(0).max(6).optional(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  endTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  isAvailable: z.coerce.number().min(0).max(1).optional(),
});

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminSession();
  if ('response' in auth) return auth.response;
  const { id } = await params;
  if (!(await getConstraint(id))) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });
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
  const c = await updateConstraintRow(id, {
    dayOfWeek: d.dayOfWeek,
    startTime: d.startTime,
    endTime: d.endTime,
    isAvailable: d.isAvailable,
  });
  return NextResponse.json({ constraint: c });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminSession();
  if ('response' in auth) return auth.response;
  const { id } = await params;
  if (!(await getConstraint(id))) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });
  await deleteConstraintRow(id);
  return NextResponse.json({ ok: true });
}

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdminSession } from '@/lib/api-auth';
import { deleteDocumentRow, getDocument, updateDocumentRow } from '@/lib/server/db-resources';

const patchSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().nullable().optional(),
  courseId: z.string().nullable().optional(),
  visibility: z.enum(['private', 'students', 'public']).optional(),
});

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminSession();
  if ('response' in auth) return auth.response;
  const { id } = await params;
  if (!(await getDocument(id))) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });
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
  const doc = await updateDocumentRow(id, {
    title: d.title,
    description: d.description,
    courseId: d.courseId === undefined ? undefined : d.courseId,
    visibility: d.visibility,
  });
  return NextResponse.json({ document: doc });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminSession();
  if ('response' in auth) return auth.response;
  const { id } = await params;
  const prev = await deleteDocumentRow(id);
  if (!prev) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });
  return NextResponse.json({ ok: true });
}

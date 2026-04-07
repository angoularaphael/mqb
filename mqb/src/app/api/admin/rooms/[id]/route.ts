import { NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/api-auth';
import { z } from 'zod';
import { deleteRoomRow, getRoom, updateRoomRow } from '@/lib/server/db-resources';

const patchSchema = z.object({
  name: z.string().min(3).optional(),
  capacity: z.coerce.number().min(1).optional(),
  type: z.enum(['classroom', 'lab', 'auditorium']).optional(),
});

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminSession();
  if ('response' in auth) return auth.response;
  const { id } = await params;
  const r = await getRoom(id);
  if (!r) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });
  return NextResponse.json({ room: r });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminSession();
  if ('response' in auth) return auth.response;
  const { id } = await params;
  if (!(await getRoom(id))) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });
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
  const r = await updateRoomRow(id, parsed.data);
  return NextResponse.json({ room: r });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminSession();
  if ('response' in auth) return auth.response;
  const { id } = await params;
  if (!(await getRoom(id))) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });
  await deleteRoomRow(id);
  return NextResponse.json({ ok: true });
}

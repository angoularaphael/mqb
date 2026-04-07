import { NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/api-auth';
import { z } from 'zod';
import {
  addGroupMemberRow,
  getGroup,
  listGroupMembers,
  removeGroupMemberRow,
} from '@/lib/server/db-resources';
import { getUserById } from '@/lib/db-client';

const addSchema = z.object({ userId: z.string().min(1) });

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminSession();
  if ('response' in auth) return auth.response;
  const { id } = await params;
  if (!(await getGroup(id))) return NextResponse.json({ error: 'Groupe introuvable' }, { status: 404 });
  return NextResponse.json({ members: await listGroupMembers(id) });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminSession();
  if ('response' in auth) return auth.response;
  const { id } = await params;
  if (!(await getGroup(id))) return NextResponse.json({ error: 'Groupe introuvable' }, { status: 404 });
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
  }
  const parsed = addSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'userId requis' }, { status: 422 });
  if (!(await getUserById(parsed.data.userId))) {
    return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });
  }
  try {
    await addGroupMemberRow(id, parsed.data.userId);
  } catch {
    return NextResponse.json({ error: 'Déjà membre ou erreur' }, { status: 409 });
  }
  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminSession();
  if ('response' in auth) return auth.response;
  const { id } = await params;
  const userId = new URL(request.url).searchParams.get('userId');
  if (!userId) return NextResponse.json({ error: 'userId query requis' }, { status: 400 });
  await removeGroupMemberRow(id, userId);
  return NextResponse.json({ ok: true });
}

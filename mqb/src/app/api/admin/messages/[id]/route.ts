import { NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/api-auth';
import { deleteMessageRow } from '@/lib/server/db-resources';
import { eq } from 'drizzle-orm';
import { db } from '@/db/index';
import { messages } from '@/db/schema';

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminSession();
  if ('response' in auth) return auth.response;
  const { id } = await params;
  const [m] = await db.select().from(messages).where(eq(messages.id, id)).limit(1);
  if (!m) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });
  await deleteMessageRow(id);
  return NextResponse.json({ ok: true });
}

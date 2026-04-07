import { NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/api-auth';
import { patchRequestSchema } from '@/lib/validations';
import { eq } from 'drizzle-orm';
import { db } from '@/db/index';
import { requests } from '@/db/schema';
import { patchRequestAdmin } from '@/lib/server/db-resources';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminSession();
  if ('response' in auth) return auth.response;
  const { id } = await params;
  const [existing] = await db.select().from(requests).where(eq(requests.id, id)).limit(1);
  if (!existing) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
  }
  const parsed = patchRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 422 });
  }
  const r = await patchRequestAdmin(id, {
    status: parsed.data.status,
    response: parsed.data.response,
    respondedBy: auth.user.userId,
  });
  return NextResponse.json({ request: r });
}

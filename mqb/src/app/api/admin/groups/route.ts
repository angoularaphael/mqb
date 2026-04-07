import { NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/api-auth';
import { createGroupSchema } from '@/lib/validations';
import { createGroupRow, listGroups } from '@/lib/server/db-resources';

export async function GET() {
  const auth = await requireAdminSession();
  if ('response' in auth) return auth.response;
  return NextResponse.json({ groups: await listGroups() });
}

export async function POST(request: Request) {
  const auth = await requireAdminSession();
  if ('response' in auth) return auth.response;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
  }
  const parsed = createGroupSchema.safeParse(body);
  if (!parsed.success) {
    const e = parsed.error.errors[0];
    return NextResponse.json({ error: e?.message ?? 'Invalide' }, { status: 422 });
  }
  const g = await createGroupRow({
    name: parsed.data.name,
    description: parsed.data.description,
    capacity: parsed.data.capacity,
  });
  return NextResponse.json({ group: g }, { status: 201 });
}

import { NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/api-auth';
import { adminConstraintBodySchema } from '@/lib/validations';
import { createConstraintRow, listAllConstraints } from '@/lib/server/db-resources';

export async function GET() {
  const auth = await requireAdminSession();
  if ('response' in auth) return auth.response;
  return NextResponse.json({ constraints: await listAllConstraints() });
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
  const parsed = adminConstraintBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 422 });
  }
  const c = await createConstraintRow({
    teacherId: parsed.data.teacherId,
    dayOfWeek: parsed.data.dayOfWeek,
    startTime: parsed.data.startTime,
    endTime: parsed.data.endTime,
    isAvailable: parsed.data.isAvailable,
  });
  return NextResponse.json({ constraint: c }, { status: 201 });
}

import { NextResponse } from 'next/server';
import { requireStaffSession } from '@/lib/api-auth';
import { constraintSchema } from '@/lib/validations';
import { createConstraintRow, listConstraintsForTeacher } from '@/lib/server/db-resources';

export async function GET() {
  const auth = await requireStaffSession();
  if ('response' in auth) return auth.response;
  if (auth.user.role !== 'teacher') return NextResponse.json({ error: 'Réservé aux enseignants' }, { status: 403 });
  return NextResponse.json({ constraints: await listConstraintsForTeacher(auth.user.userId) });
}

export async function POST(request: Request) {
  const auth = await requireStaffSession();
  if ('response' in auth) return auth.response;
  if (auth.user.role !== 'teacher') return NextResponse.json({ error: 'Réservé aux enseignants' }, { status: 403 });
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
  }
  const parsed = constraintSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 422 });
  }
  const c = await createConstraintRow({
    teacherId: auth.user.userId,
    dayOfWeek: parsed.data.dayOfWeek,
    startTime: parsed.data.startTime,
    endTime: parsed.data.endTime,
    isAvailable: parsed.data.isAvailable,
  });
  return NextResponse.json({ constraint: c }, { status: 201 });
}

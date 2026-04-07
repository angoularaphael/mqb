import { NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/api-auth';
import { createCourseSchema } from '@/lib/validations';
import { createCourseRow, listCourses } from '@/lib/server/db-resources';

export async function GET() {
  const auth = await requireAdminSession();
  if ('response' in auth) return auth.response;
  return NextResponse.json({ courses: await listCourses() });
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
  const parsed = createCourseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 422 });
  }
  try {
    const c = await createCourseRow({
      code: parsed.data.code,
      name: parsed.data.name,
      description: parsed.data.description,
      teacherId: parsed.data.teacherId,
      groupId: parsed.data.groupId,
      hoursTotal: parsed.data.hoursTotal,
    });
    return NextResponse.json({ course: c }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Code cours dupliqué ou données invalides' }, { status: 409 });
  }
}

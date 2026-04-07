import { NextResponse } from 'next/server';
import { requireStaffSession } from '@/lib/api-auth';
import { attendanceSchema } from '@/lib/validations';
import { getSchedule, teacherOwnsCourse, upsertAttendanceRow } from '@/lib/server/db-resources';

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
  const parsed = attendanceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 422 });
  }
  const sch = await getSchedule(parsed.data.scheduleId);
  if (!sch) return NextResponse.json({ error: 'Créneau inconnu' }, { status: 404 });
  if (!(await teacherOwnsCourse(auth.user.userId, sch.course_id))) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  }
  await upsertAttendanceRow({
    studentId: parsed.data.studentId,
    scheduleId: parsed.data.scheduleId,
    status: parsed.data.status,
    markedBy: auth.user.userId,
  });
  return NextResponse.json({ ok: true }, { status: 201 });
}

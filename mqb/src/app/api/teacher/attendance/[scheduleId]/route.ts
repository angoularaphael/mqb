import { NextResponse } from 'next/server';
import { requireStaffSession } from '@/lib/api-auth';
import {
  getSchedule,
  listAttendanceForSchedule,
  listStudentsInCourseGroup,
  teacherOwnsCourse,
} from '@/lib/server/db-resources';

export async function GET(_: Request, { params }: { params: Promise<{ scheduleId: string }> }) {
  const auth = await requireStaffSession();
  if ('response' in auth) return auth.response;
  if (auth.user.role !== 'teacher') return NextResponse.json({ error: 'Réservé aux enseignants' }, { status: 403 });
  const { scheduleId } = await params;
  const sch = await getSchedule(scheduleId);
  if (!sch) return NextResponse.json({ error: 'Créneau inconnu' }, { status: 404 });
  if (!(await teacherOwnsCourse(auth.user.userId, sch.course_id))) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  }
  const [students, attendance] = await Promise.all([
    listStudentsInCourseGroup(sch.course_id),
    listAttendanceForSchedule(scheduleId),
  ]);
  return NextResponse.json({ students, attendance });
}

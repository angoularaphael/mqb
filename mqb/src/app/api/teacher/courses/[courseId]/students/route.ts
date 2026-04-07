import { NextResponse } from 'next/server';
import { requireStaffSession } from '@/lib/api-auth';
import { listStudentsInCourseGroup, teacherOwnsCourse } from '@/lib/server/db-resources';

export async function GET(
  _: Request,
  { params }: { params: Promise<{ courseId: string }> },
) {
  const auth = await requireStaffSession();
  if ('response' in auth) return auth.response;
  if (auth.user.role !== 'teacher') return NextResponse.json({ error: 'Réservé aux enseignants' }, { status: 403 });
  const { courseId } = await params;
  if (!(await teacherOwnsCourse(auth.user.userId, courseId))) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  }
  const students = await listStudentsInCourseGroup(courseId);
  return NextResponse.json({ students });
}

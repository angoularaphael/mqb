import { NextResponse } from 'next/server';
import { requireStaffSession } from '@/lib/api-auth';
import { listCoursesForTeacher } from '@/lib/server/db-resources';

export async function GET() {
  const auth = await requireStaffSession();
  if ('response' in auth) return auth.response;
  if (auth.user.role !== 'teacher') return NextResponse.json({ error: 'Réservé aux enseignants' }, { status: 403 });
  return NextResponse.json({ courses: await listCoursesForTeacher(auth.user.userId) });
}

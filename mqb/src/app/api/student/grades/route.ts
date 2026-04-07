import { NextResponse } from 'next/server';
import { requireStudentSession } from '@/lib/api-auth';
import { getStudentGrades, getStudentGradeAverage } from '@/lib/data/student-queries';

export async function GET() {
  const auth = await requireStudentSession();
  if ('response' in auth) return auth.response;
  const userId = auth.user.userId;
  const [courses, average] = await Promise.all([
    getStudentGrades(userId),
    getStudentGradeAverage(userId),
  ]);
  return NextResponse.json({
    courses,
    average: average != null ? `${average}/20` : '—',
  });
}

import { NextResponse } from 'next/server';
import { requireStudentSession } from '@/lib/api-auth';
import { getStudentSchedule } from '@/lib/data/student-queries';

export async function GET() {
  const auth = await requireStudentSession();
  if ('response' in auth) return auth.response;
  const schedule = await getStudentSchedule(auth.user.userId);
  return NextResponse.json({ schedule });
}

import { NextResponse } from 'next/server';
import { requireStudentSession } from '@/lib/api-auth';
import { getStudentAttendanceRecords } from '@/lib/data/student-queries';

export async function GET() {
  const auth = await requireStudentSession();
  if ('response' in auth) return auth.response;
  const records = await getStudentAttendanceRecords(auth.user.userId);
  return NextResponse.json({ records });
}

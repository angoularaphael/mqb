import { NextResponse } from 'next/server';
import { requireStudentSession } from '@/lib/api-auth';
import { listTeachersAndAdmins } from '@/lib/data/student-queries';

export async function GET() {
  const auth = await requireStudentSession();
  if ('response' in auth) return auth.response;
  const recipients = await listTeachersAndAdmins();
  return NextResponse.json({ recipients });
}

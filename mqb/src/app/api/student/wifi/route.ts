import { NextResponse } from 'next/server';
import { requireStudentSession } from '@/lib/api-auth';
import { getActiveWifiCode } from '@/lib/data/student-queries';

export async function GET() {
  const auth = await requireStudentSession();
  if ('response' in auth) return auth.response;
  const wifi = await getActiveWifiCode();
  return NextResponse.json(wifi);
}

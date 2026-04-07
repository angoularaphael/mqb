import { NextResponse } from 'next/server';
import { requireStaffSession } from '@/lib/api-auth';
import { getInboxPreviewForUser } from '@/lib/data/student-queries';

export async function GET() {
  const auth = await requireStaffSession();
  if ('response' in auth) return auth.response;
  if (auth.user.role !== 'teacher') {
    return NextResponse.json({ error: 'Réservé aux enseignants' }, { status: 403 });
  }
  const inboxPreview = await getInboxPreviewForUser(auth.user.userId, 8);
  return NextResponse.json({ inboxPreview });
}

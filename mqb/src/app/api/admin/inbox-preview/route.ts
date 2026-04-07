import { NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/api-auth';
import { getInboxPreviewForUser } from '@/lib/data/student-queries';

export async function GET() {
  const auth = await requireAdminSession();
  if ('response' in auth) return auth.response;
  const inboxPreview = await getInboxPreviewForUser(auth.user.userId, 8);
  return NextResponse.json({ inboxPreview });
}

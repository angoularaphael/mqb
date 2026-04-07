import { NextResponse } from 'next/server';
import { requireStudentSession } from '@/lib/api-auth';
import { listConversationSummaries } from '@/lib/data/messaging-queries';

export async function GET() {
  const auth = await requireStudentSession();
  if ('response' in auth) return auth.response;
  const conversations = await listConversationSummaries(auth.user.userId);
  return NextResponse.json({ conversations });
}

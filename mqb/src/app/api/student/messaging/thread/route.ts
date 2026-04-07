import { NextResponse } from 'next/server';
import { requireStudentSession } from '@/lib/api-auth';
import { getDirectThread } from '@/lib/data/messaging-queries';

export async function GET(request: Request) {
  const auth = await requireStudentSession();
  if ('response' in auth) return auth.response;
  const peerId = new URL(request.url).searchParams.get('peerId');
  if (!peerId) return NextResponse.json({ error: 'peerId requis' }, { status: 400 });
  const messages = await getDirectThread(auth.user.userId, peerId);
  return NextResponse.json({ messages });
}

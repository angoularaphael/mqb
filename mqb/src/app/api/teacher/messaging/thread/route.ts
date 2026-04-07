import { NextResponse } from 'next/server';
import { requireStaffSession } from '@/lib/api-auth';
import { getDirectThread } from '@/lib/data/messaging-queries';

export async function GET(request: Request) {
  const auth = await requireStaffSession();
  if ('response' in auth) return auth.response;
  if (auth.user.role !== 'teacher') return NextResponse.json({ error: 'Réservé aux enseignants' }, { status: 403 });
  const peerId = new URL(request.url).searchParams.get('peerId');
  if (!peerId) return NextResponse.json({ error: 'peerId requis' }, { status: 400 });
  const messages = await getDirectThread(auth.user.userId, peerId);
  return NextResponse.json({ messages });
}

import { NextResponse } from 'next/server';
import { requireStaffSession } from '@/lib/api-auth';
import { listBroadcastsForUser } from '@/lib/data/messaging-queries';

export async function GET() {
  const auth = await requireStaffSession();
  if ('response' in auth) return auth.response;
  if (auth.user.role !== 'teacher') return NextResponse.json({ error: 'Réservé aux enseignants' }, { status: 403 });
  const broadcasts = await listBroadcastsForUser(auth.user.userId);
  return NextResponse.json({ broadcasts });
}

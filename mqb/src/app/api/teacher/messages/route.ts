import { NextResponse } from 'next/server';
import { requireStaffSession } from '@/lib/api-auth';
import { getStudentMessages, insertStudentMessage } from '@/lib/data/student-queries';

export async function GET() {
  const auth = await requireStaffSession();
  if ('response' in auth) return auth.response;
  if (auth.user.role !== 'teacher') return NextResponse.json({ error: 'Réservé aux enseignants' }, { status: 403 });
  const messages = await getStudentMessages(auth.user.userId);
  return NextResponse.json({ messages });
}

export async function POST(request: Request) {
  const auth = await requireStaffSession();
  if ('response' in auth) return auth.response;
  if (auth.user.role !== 'teacher') return NextResponse.json({ error: 'Réservé aux enseignants' }, { status: 403 });
  let body: { recipientId?: string; title?: string; content?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
  }
  if (!body.recipientId || !body.content?.trim()) {
    return NextResponse.json({ error: 'recipientId et content sont requis' }, { status: 400 });
  }
  if (body.recipientId === auth.user.userId) {
    return NextResponse.json({ error: 'Destinataire invalide' }, { status: 400 });
  }
  await insertStudentMessage({
    senderId: auth.user.userId,
    recipientId: body.recipientId,
    title: body.title?.trim() ?? '',
    content: body.content.trim(),
  });
  return NextResponse.json({ ok: true });
}

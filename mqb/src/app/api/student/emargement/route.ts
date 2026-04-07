import { NextResponse } from 'next/server';
import { requireStudentSession } from '@/lib/api-auth';
import { addEmargementSignature, listOpenEmargementSessionsForStudent } from '@/lib/server/db-resources';

export async function GET() {
  const auth = await requireStudentSession();
  if ('response' in auth) return auth.response;
  const sessions = await listOpenEmargementSessionsForStudent(auth.user.userId);
  return NextResponse.json({ sessions });
}

export async function POST(request: Request) {
  const auth = await requireStudentSession();
  if ('response' in auth) return auth.response;
  let body: { sessionId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
  }
  if (!body.sessionId) return NextResponse.json({ error: 'sessionId requis' }, { status: 400 });
  const r = await addEmargementSignature(body.sessionId, auth.user.userId);
  if (!r.ok) {
    const msg =
      r.reason === 'closed'
        ? 'Émargement fermé'
        : r.reason === 'not_in_course'
          ? 'Non autorisé'
          : 'Erreur';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
  return NextResponse.json({ ok: true, already: r.already });
}

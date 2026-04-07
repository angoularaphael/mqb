import { NextResponse } from 'next/server';
import { requireStudentSession } from '@/lib/api-auth';
import { getStudentRequests, insertStudentRequest } from '@/lib/data/student-queries';

export async function GET() {
  const auth = await requireStudentSession();
  if ('response' in auth) return auth.response;
  const requests = await getStudentRequests(auth.user.userId);
  return NextResponse.json({ requests });
}

export async function POST(request: Request) {
  const auth = await requireStudentSession();
  if ('response' in auth) return auth.response;
  let body: { type?: string; subject?: string; description?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
  }
  const type = body.type ?? 'request';
  if (!body.subject?.trim() || !body.description?.trim()) {
    return NextResponse.json(
      { error: 'subject et description sont requis' },
      { status: 400 },
    );
  }
  await insertStudentRequest({
    studentId: auth.user.userId,
    type,
    subject: body.subject.trim(),
    description: body.description.trim(),
  });
  return NextResponse.json({ ok: true });
}

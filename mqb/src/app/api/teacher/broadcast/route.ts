import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireStaffSession } from '@/lib/api-auth';
import { createBroadcastMessage, listStudentIdsForTeacher } from '@/lib/server/db-resources';

const teacherBroadcastBody = z.object({
  title: z.string().min(3, 'Le sujet est requis'),
  content: z.string().min(10, 'Le message est requis'),
  recipientIds: z.array(z.string()).optional(),
  allMyStudents: z.boolean().optional(),
});

export async function POST(request: Request) {
  const auth = await requireStaffSession();
  if ('response' in auth) return auth.response;
  if (auth.user.role !== 'teacher') return NextResponse.json({ error: 'Réservé aux enseignants' }, { status: 403 });

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
  }

  const parsed = teacherBroadcastBody.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 422 });
  }

  const mine = await listStudentIdsForTeacher(auth.user.userId);
  const allowed = new Set(mine);
  let recipientIds: string[];
  if (parsed.data.allMyStudents) {
    recipientIds = [...mine];
  } else {
    const ids = parsed.data.recipientIds ?? [];
    recipientIds = ids.filter((id) => allowed.has(id));
  }
  if (!recipientIds.length) {
    return NextResponse.json(
      { error: 'Aucun destinataire (étudiants de vos cours)' },
      { status: 400 },
    );
  }

  const m = await createBroadcastMessage({
    senderId: auth.user.userId,
    title: parsed.data.title,
    content: parsed.data.content,
    recipientIds,
  });
  return NextResponse.json({ message: m }, { status: 201 });
}

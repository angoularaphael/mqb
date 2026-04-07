import { NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/api-auth';
import { broadcastMessageSchema } from '@/lib/validations';
import { createBroadcastMessage, listAllMessages } from '@/lib/server/db-resources';

export async function GET() {
  const auth = await requireAdminSession();
  if ('response' in auth) return auth.response;
  return NextResponse.json({ messages: await listAllMessages() });
}

export async function POST(request: Request) {
  const auth = await requireAdminSession();
  if ('response' in auth) return auth.response;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
  }
  const parsed = broadcastMessageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 422 });
  }
  const m = await createBroadcastMessage({
    senderId: auth.user.userId,
    title: parsed.data.title,
    content: parsed.data.content,
    recipientIds: parsed.data.recipientIds,
  });
  return NextResponse.json({ message: m }, { status: 201 });
}

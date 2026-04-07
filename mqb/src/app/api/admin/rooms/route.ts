import { NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/api-auth';
import { createRoomSchema } from '@/lib/validations';
import { createRoomRow, listRooms } from '@/lib/server/db-resources';

export async function GET() {
  const auth = await requireAdminSession();
  if ('response' in auth) return auth.response;
  return NextResponse.json({ rooms: await listRooms() });
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
  const parsed = createRoomSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 422 });
  }
  const r = await createRoomRow(parsed.data);
  return NextResponse.json({ room: r }, { status: 201 });
}

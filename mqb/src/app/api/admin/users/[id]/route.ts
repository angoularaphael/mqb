import { NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/api-auth';
import { updateUserAdminSchema } from '@/lib/validations';
import { deleteUserRow, updateUserAsAdmin } from '@/lib/server/db-resources';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminSession();
  if ('response' in auth) return auth.response;
  const { id } = await params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
  }
  const parsed = updateUserAdminSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 422 });
  }
  const u = await updateUserAsAdmin(id, {
    email: parsed.data.email,
    firstName: parsed.data.firstName,
    lastName: parsed.data.lastName,
    role: parsed.data.role,
    isActive: parsed.data.isActive,
    password: parsed.data.password,
  });
  if (!u) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });
  return NextResponse.json({
    user: {
      id: u.id,
      name: `${u.first_name} ${u.last_name}`.trim(),
      email: u.email,
      role: u.role,
      status: u.is_active ? 'active' : 'inactive',
    },
  });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminSession();
  if ('response' in auth) return auth.response;
  const { id } = await params;
  if (id === auth.user.userId) {
    return NextResponse.json({ error: 'Vous ne pouvez pas supprimer votre propre compte' }, { status: 400 });
  }
  await deleteUserRow(id);
  return NextResponse.json({ ok: true });
}

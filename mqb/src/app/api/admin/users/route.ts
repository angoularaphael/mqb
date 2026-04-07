import { NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/api-auth';
import { listUsersForAdmin } from '@/lib/data/admin-queries';
import { createUserSchema } from '@/lib/validations';
import { createUser, getUserByEmail } from '@/lib/db-client';

export async function GET() {
  const auth = await requireAdminSession();
  if ('response' in auth) return auth.response;
  const users = await listUsersForAdmin();
  return NextResponse.json({ users });
}

export async function POST(request: Request) {
  const auth = await requireAdminSession();
  if ('response' in auth) return auth.response;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: 'Corps JSON invalide' }, { status: 400 });
  }

  const parsed = createUserSchema.safeParse(json);
  if (!parsed.success) {
    const first = parsed.error.errors[0];
    const msg = first
      ? `${first.path.length ? first.path.join('.') + ': ' : ''}${first.message}`
      : 'Données invalides';
    return NextResponse.json({ error: msg }, { status: 422 });
  }

  const { email, password, firstName, lastName, role } = parsed.data;
  const emailNorm = email.trim().toLowerCase();

  const existing = await getUserByEmail(emailNorm);
  if (existing) {
    return NextResponse.json({ error: 'Cet email est déjà utilisé' }, { status: 409 });
  }

  try {
    const created = await createUser({
      email: emailNorm,
      password,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      role,
    });

    if (!created) {
      return NextResponse.json({ error: 'Création impossible' }, { status: 500 });
    }

    return NextResponse.json(
      {
        user: {
          id: created.id,
          name: `${created.first_name} ${created.last_name}`.trim(),
          email: created.email,
          role: created.role,
          status: created.is_active ? 'active' : 'inactive',
        },
      },
      { status: 201 },
    );
  } catch (e) {
    console.error('POST /api/admin/users', e);
    return NextResponse.json({ error: 'Erreur serveur lors de la création' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { requireAuthSession } from '@/lib/api-auth';
import { updateProfileSchema } from '@/lib/validations';
import { updateUserProfile } from '@/lib/server/db-resources';

export async function PUT(request: Request) {
  const auth = await requireAuthSession();
  if ('response' in auth) return auth.response;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
  }
  const parsed = updateProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 422 });
  }
  const u = await updateUserProfile(auth.user.userId, parsed.data.firstName, parsed.data.lastName);
  if (!u) return NextResponse.json({ error: 'Erreur' }, { status: 500 });
  return NextResponse.json({
    profile: {
      firstName: u.first_name,
      lastName: u.last_name,
      email: u.email,
    },
  });
}

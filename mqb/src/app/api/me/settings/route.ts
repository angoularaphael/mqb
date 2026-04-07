import { NextResponse } from 'next/server';
import { requireAuthSession } from '@/lib/api-auth';
import { userSettingsSchema } from '@/lib/validations';
import { getUserSettingsRow, upsertUserSettings } from '@/lib/server/db-resources';

export async function GET() {
  const auth = await requireAuthSession();
  if ('response' in auth) return auth.response;
  const row = await getUserSettingsRow(auth.user.userId);
  return NextResponse.json({
    settings: {
      theme: (row?.theme as 'light' | 'dark') ?? 'dark',
      fontSize: row?.font_size ?? 16,
      language: (row?.language as 'fr' | 'en') ?? 'fr',
      emailNotifications: row?.email_notifications ?? 1,
    },
  });
}

export async function PUT(request: Request) {
  const auth = await requireAuthSession();
  if ('response' in auth) return auth.response;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
  }
  const parsed = userSettingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 422 });
  }
  await upsertUserSettings(auth.user.userId, {
    theme: parsed.data.theme,
    fontSize: parsed.data.fontSize,
    language: parsed.data.language,
    emailNotifications: parsed.data.emailNotifications,
  });
  const row = await getUserSettingsRow(auth.user.userId);
  return NextResponse.json({
    settings: {
      theme: row?.theme ?? 'dark',
      fontSize: row?.font_size ?? 16,
      language: row?.language ?? 'fr',
      emailNotifications: row?.email_notifications ?? 1,
    },
  });
}
